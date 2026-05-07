"""
Timetable scheduling engine — genetic algorithm adapted for the new academic model.

Key improvements over the original:
- Works with TimeSlot (proper times) instead of MeetingTime (string-based)
- Supports lab sessions spanning multiple consecutive slots
- Section-aware: generates per-section timetables
- Conflict checking: room, faculty, and section clashes
- Saves results as TimetableEntry objects
"""
import random
from collections import defaultdict
from django.utils import timezone
from .models import (
    Room, TimeSlot, Faculty, Subject, Section,
    CourseOffering, Timetable, TimetableEntry,
    DAYS_OF_WEEK,
)


# ──────────────────────────────────────────────────────────────
# GA Parameters
# ──────────────────────────────────────────────────────────────

POPULATION_SIZE = 50
NUMB_OF_ELITE_SCHEDULES = 4
TOURNAMENT_SELECTION_SIZE = 10
MUTATION_RATE = 0.08


# ──────────────────────────────────────────────────────────────
# Data Loader
# ──────────────────────────────────────────────────────────────

class ScheduleData:
    """Loads all data needed for timetable generation."""

    def __init__(self, sections):
        self.sections = list(sections)
        self.rooms = list(Room.objects.filter(room_type='CLASSROOM'))
        self.lab_rooms = list(Room.objects.filter(room_type='LAB'))
        self.all_rooms = list(Room.objects.all())

        # Library rooms: identified by room name or number containing "library" / "lib"
        self.library_rooms = [
            r for r in self.all_rooms
            if 'library' in r.name.lower() or 'library' in r.number.lower() or 'lib' in r.number.lower()
        ]

        # Pre-assign ONE dedicated classroom per section so that all theory classes
        # for a section always happen in the same room.
        classrooms = self.rooms if self.rooms else [
            r for r in self.all_rooms if r.room_type != 'LAB'
        ]
        self.section_classroom = {}
        for i, section in enumerate(self.sections):
            self.section_classroom[section.id] = classrooms[i % len(classrooms)] if classrooms else None

        # Only teaching slots (REGULAR type) for scheduling
        self.time_slots = list(
            TimeSlot.objects.filter(slot_type='REGULAR').order_by('day', 'slot_number')
        )

        # Build a lookup: day -> sorted list of regular slots
        self.slots_by_day = defaultdict(list)
        for slot in self.time_slots:
            self.slots_by_day[slot.day].append(slot)

        # Build "uninterrupted regular blocks" per day.
        # A block is a maximal run of REGULAR slots with no BREAK/LUNCH between them
        # (determined by scanning all slots ordered by slot_number per day).
        # Labs MUST be scheduled within a single block so they never straddle a break.
        all_slots_by_day = defaultdict(list)
        for slot in TimeSlot.objects.order_by('slot_number'):
            all_slots_by_day[slot.day].append(slot)

        self.regular_blocks_by_day = defaultdict(list)  # day -> list of blocks (each block = list of REGULAR TimeSlots)
        for day, day_all_slots in all_slots_by_day.items():
            current_block = []
            for slot in day_all_slots:
                if slot.slot_type == 'REGULAR':
                    current_block.append(slot)
                else:
                    if current_block:
                        self.regular_blocks_by_day[day].append(current_block)
                        current_block = []
            if current_block:
                self.regular_blocks_by_day[day].append(current_block)

        # Load course offerings for the target sections
        self.offerings = list(
            CourseOffering.objects.filter(
                section__in=self.sections
            ).select_related('subject', 'section').prefetch_related('faculty')
        )

    @staticmethod
    def is_library_subject(subject):
        """Return True if the subject is a Library Hour (name / short_name contains 'library')."""
        return (
            'library' in subject.name.lower() or
            'library' in subject.short_name.lower()
        )

    def get_rooms_for_type(self, subject_type):
        if subject_type == 'LAB':
            return self.lab_rooms if self.lab_rooms else self.all_rooms
        return self.rooms if self.rooms else self.all_rooms

    def get_consecutive_slots(self, day, start_slot_number, count):
        """Get `count` consecutive REGULAR slots starting from `start_slot_number` on `day`.

        Only returns slots within the same uninterrupted block (no BREAK/LUNCH between them).
        Returns an empty list if the start slot is not found or there aren't enough
        consecutive REGULAR slots in the same block.
        """
        for block in self.regular_blocks_by_day.get(day, []):
            for i, slot in enumerate(block):
                if slot.slot_number == start_slot_number:
                    if i + count <= len(block):
                        return block[i:i + count]
                    else:
                        return []  # Not enough slots in this block
        return []


# ──────────────────────────────────────────────────────────────
# Schedule Class (one assignment of a subject to a slot)
# ──────────────────────────────────────────────────────────────

class ScheduleClass:
    """Represents one class assignment in a candidate schedule."""

    def __init__(self, offering):
        self.offering = offering         # CourseOffering
        self.section = offering.section  # Section
        self.subject = offering.subject  # Subject
        self.faculty = None              # Faculty
        self.time_slot = None            # TimeSlot (first slot)
        self.room = None                 # Room
        self.duration_slots = 1          # int
        self.entry_type = 'REGULAR'      # str

        # Set lab properties
        if self.subject.subject_type == 'LAB':
            self.duration_slots = self.subject.lab_duration_slots
            self.entry_type = 'LAB'


# ──────────────────────────────────────────────────────────────
# Schedule (one candidate solution)
# ──────────────────────────────────────────────────────────────

class Schedule:
    """A candidate timetable for all given sections."""

    def __init__(self, data):
        self.data = data
        self.classes = []
        self._fitness = -1
        self._conflicts = 0
        self._fitness_changed = True

    def get_classes(self):
        self._fitness_changed = True
        return self.classes

    @property
    def fitness(self):
        if self._fitness_changed:
            self._fitness = self._calculate_fitness()
            self._fitness_changed = False
        return self._fitness

    @property
    def conflicts(self):
        if self._fitness_changed:
            self._calculate_fitness()
        return self._conflicts

    def initialize(self):
        """Create random class assignments from course offerings.

        Labs are processed first so they can be spread across different days per section
        before theory classes fill the remaining slots.
        """
        # Track which days each section already has a lab on — to spread labs across days
        section_lab_days = defaultdict(set)

        # Separate lab and theory offerings; process labs first
        lab_offerings = [o for o in self.data.offerings if o.subject.subject_type == 'LAB']
        theory_offerings = [o for o in self.data.offerings if o.subject.subject_type != 'LAB']

        for offering in lab_offerings + theory_offerings:
            weekly_hours = offering.effective_weekly_hours
            subject = offering.subject

            if subject.subject_type == 'LAB':
                lab_slots_needed = subject.lab_duration_slots
                sessions = weekly_hours // lab_slots_needed
                remainder = weekly_hours % lab_slots_needed

                for _ in range(sessions):
                    cls = ScheduleClass(offering)
                    self._assign_random(cls, is_lab=True, section_lab_days=section_lab_days)
                    if cls.time_slot:
                        section_lab_days[cls.section.id].add(cls.time_slot.day)
                    self.classes.append(cls)

                # Handle remainder as a smaller block
                if remainder > 0:
                    cls = ScheduleClass(offering)
                    cls.duration_slots = remainder
                    self._assign_random(cls, is_lab=True, section_lab_days=section_lab_days)
                    if cls.time_slot:
                        section_lab_days[cls.section.id].add(cls.time_slot.day)
                    self.classes.append(cls)
            else:
                # Theory: one slot per session
                for _ in range(weekly_hours):
                    cls = ScheduleClass(offering)
                    self._assign_random(cls, is_lab=False)
                    self.classes.append(cls)

        return self

    def _assign_random(self, cls, is_lab=False, section_lab_days=None):
        """Assign a random time slot, room, and faculty to a class.

        For labs, only picks start positions within a single uninterrupted block of
        REGULAR slots (no BREAK/LUNCH between), preferring days that don't already
        have a lab for this section.
        """
        slots = self.data.time_slots
        if not slots:
            return

        if is_lab and cls.duration_slots > 1:
            days = list(self.data.slots_by_day.keys())
            random.shuffle(days)

            # Prefer days without an existing lab for this section
            if section_lab_days and cls.section.id in section_lab_days:
                used = section_lab_days[cls.section.id]
                days = [d for d in days if d not in used] + [d for d in days if d in used]

            assigned = False
            for day in days:
                # Collect valid start positions (within a single uninterrupted block)
                valid_starts = []
                for block in self.data.regular_blocks_by_day.get(day, []):
                    if len(block) >= cls.duration_slots:
                        for i in range(len(block) - cls.duration_slots + 1):
                            valid_starts.append(block[i])

                if valid_starts:
                    cls.time_slot = random.choice(valid_starts)
                    assigned = True
                    break

            if not assigned:
                # Fallback: pick any regular slot that doesn't overflow the day's boundaries
                valid_starts = []
                for day, day_slots in self.data.slots_by_day.items():
                    if len(day_slots) >= cls.duration_slots:
                        for i in range(len(day_slots) - cls.duration_slots + 1):
                            valid_starts.append(day_slots[i])
                
                if valid_starts:
                    cls.time_slot = random.choice(valid_starts)
                else:
                    cls.time_slot = random.choice(slots)
        else:
            cls.time_slot = random.choice(slots)

        # ── Room assignment ──
        # Rule 1: Lab subjects   → LAB room
        # Rule 2: Library Hour   → Library room (room name/number contains 'library'/'lib')
        # Rule 3: All other subjects → section's pre-assigned dedicated classroom
        if cls.subject.subject_type == 'LAB':
            rooms = self.data.lab_rooms if self.data.lab_rooms else self.data.all_rooms
            if rooms:
                cls.room = random.choice(rooms)
        elif self.data.is_library_subject(cls.subject):
            lib_rooms = self.data.library_rooms
            if lib_rooms:
                cls.room = lib_rooms[0]  # Typically only one library
            elif self.data.all_rooms:
                cls.room = random.choice(self.data.all_rooms)
        else:
            # Theory / Common / Elective → section's dedicated classroom
            dedicated = self.data.section_classroom.get(cls.section.id)
            if dedicated:
                cls.room = dedicated
            elif self.data.rooms:
                cls.room = random.choice(self.data.rooms)
            elif self.data.all_rooms:
                cls.room = random.choice(self.data.all_rooms)

        # Assign faculty
        faculty_list = list(cls.offering.faculty.all())
        if faculty_list:
            cls.faculty = random.choice(faculty_list)

    def _calculate_fitness(self):
        """Calculate fitness based on conflicts. 1.0 = perfect.

        Penalty sources:
        - Room type mismatch (wrong venue for subject type)
        - Room capacity mismatch
        - Double-booked faculty across sections
        - Double-booked section (same section, same time slot)
        - Double-booked room
        - Lab spanning into non-consecutive slots
        - Uneven distribution (too many classes on one day, gaps on another)
        """
        self._conflicts = 0
        classes = self.classes

        for i in range(len(classes)):
            cls = classes[i]

            # ── Room-venue constraints ──
            if cls.room:
                if cls.subject.subject_type == 'LAB':
                    # Lab must be in a LAB room
                    if self.data.lab_rooms and cls.room not in self.data.lab_rooms:
                        self._conflicts += 80
                elif self.data.is_library_subject(cls.subject):
                    # Library Hour must be in a library room
                    if self.data.library_rooms and cls.room not in self.data.library_rooms:
                        self._conflicts += 100
                else:
                    # Theory must be in the section's dedicated classroom
                    dedicated = self.data.section_classroom.get(cls.section.id)
                    if dedicated and cls.room.id != dedicated.id:
                        self._conflicts += 60

            # Room capacity check
            if cls.room and cls.room.seating_capacity < cls.section.strength:
                self._conflicts += 50

            for j in range(i + 1, len(classes)):
                if classes[i].time_slot is None or classes[j].time_slot is None:
                    continue

                same_slot = classes[i].time_slot.id == classes[j].time_slot.id

                if not same_slot:
                    # Check lab overlap (multi-slot labs may conflict)
                    if classes[i].duration_slots > 1 or classes[j].duration_slots > 1:
                        same_slot = self._check_slot_overlap(classes[i], classes[j])

                if same_slot:
                    # Same faculty in different sections at same time
                    if (classes[i].faculty and classes[j].faculty and
                            classes[i].section.id != classes[j].section.id and
                            classes[i].faculty.id == classes[j].faculty.id):
                        self._conflicts += 100

                    # Same section, same time = double booking
                    if classes[i].section.id == classes[j].section.id:
                        self._conflicts += 100

                    # Same room at same time
                    if (classes[i].room and classes[j].room and
                            classes[i].room.id == classes[j].room.id):
                        self._conflicts += 100

        # ── Distribution & lab-spread penalties ──

        # Heavy penalty: more than one lab session per section per day
        section_day_labs = defaultdict(int)
        for cls in classes:
            if cls.time_slot and cls.entry_type == 'LAB':
                section_day_labs[(cls.section.id, cls.time_slot.day)] += 1
        for count in section_day_labs.values():
            if count > 1:
                self._conflicts += (count - 1) * 200

        # Gap penalty: penalise unfilled regular slots per section per day.
        # Use block structure to correctly track which regular slots are occupied.
        section_day_slots = defaultdict(set)
        section_day_subjects = defaultdict(list)
        for cls in classes:
            if cls.time_slot:
                key = (cls.section.id, cls.time_slot.day)
                section_day_subjects[key].append(cls.subject.id)
                # Mark occupied regular slot positions using blocks (no arithmetic across breaks)
                day = cls.time_slot.day
                start_num = cls.time_slot.slot_number
                section_day_slots[key].add(start_num)
                if cls.duration_slots > 1:
                    for block in self.data.regular_blocks_by_day.get(day, []):
                        for i, slot in enumerate(block):
                            if slot.slot_number == start_num:
                                for j in range(1, cls.duration_slots):
                                    if i + j < len(block):
                                        section_day_slots[key].add(block[i + j].slot_number)
                                break

        available_days = list(self.data.slots_by_day.keys())
        available_per_day = {d: len(self.data.slots_by_day[d]) for d in available_days}

        for section in self.data.sections:
            for day in available_days:
                key = (section.id, day)
                filled = len(section_day_slots.get(key, set()))
                expected = available_per_day.get(day, 7)
                gap = expected - filled
                if gap > 0:
                    # Square the gap so completely empty days are heavily penalized
                    self._conflicts += gap ** 2

                # Penalize same theory subject appearing more than once on the same day
                subjects_on_day = section_day_subjects.get(key, [])
                if len(subjects_on_day) != len(set(subjects_on_day)):
                    from collections import Counter
                    counts = Counter(subjects_on_day)
                    for count in counts.values():
                        if count > 1:
                            self._conflicts += (count - 1) * 3

        return 1.0 / (self._conflicts + 1)

    def _check_slot_overlap(self, cls_a, cls_b):
        """Check if two multi-slot classes overlap."""
        if cls_a.time_slot.day != cls_b.time_slot.day:
            return False

        a_start = cls_a.time_slot.slot_number
        a_end = a_start + cls_a.duration_slots - 1
        b_start = cls_b.time_slot.slot_number
        b_end = b_start + cls_b.duration_slots - 1

        return a_start <= b_end and b_start <= a_end


# ──────────────────────────────────────────────────────────────
# Population
# ──────────────────────────────────────────────────────────────

class Population:
    """A population of candidate schedules."""

    def __init__(self, size, data):
        self.data = data
        self.schedules = []
        for _ in range(size):
            self.schedules.append(Schedule(data).initialize())


# ──────────────────────────────────────────────────────────────
# Genetic Algorithm
# ──────────────────────────────────────────────────────────────

class GeneticAlgorithm:
    """Evolves schedule populations using crossover and mutation."""

    def evolve(self, population):
        return self._mutate_population(self._crossover_population(population))

    def _crossover_population(self, population):
        new_pop = Population(0, population.data)

        # Keep elite schedules
        for i in range(NUMB_OF_ELITE_SCHEDULES):
            new_pop.schedules.append(population.schedules[i])

        # Crossover the rest
        for i in range(NUMB_OF_ELITE_SCHEDULES, POPULATION_SIZE):
            parent_a = self._tournament_select(population)
            parent_b = self._tournament_select(population)
            child = self._crossover(parent_a, parent_b, population.data)
            new_pop.schedules.append(child)

        return new_pop

    def _mutate_population(self, population):
        for i in range(NUMB_OF_ELITE_SCHEDULES, len(population.schedules)):
            self._mutate(population.schedules[i])
        return population

    def _crossover(self, parent_a, parent_b, data):
        child = Schedule(data).initialize()
        for i in range(min(len(child.classes), len(parent_a.classes), len(parent_b.classes))):
            if random.random() > 0.5:
                child.classes[i] = parent_a.classes[i]
            else:
                child.classes[i] = parent_b.classes[i]
        return child

    def _mutate(self, schedule):
        mutant = Schedule(schedule.data).initialize()
        for i in range(min(len(schedule.classes), len(mutant.classes))):
            if MUTATION_RATE > random.random():
                schedule.classes[i] = mutant.classes[i]
        return schedule

    def _tournament_select(self, population):
        tournament = random.sample(
            population.schedules,
            min(TOURNAMENT_SELECTION_SIZE, len(population.schedules))
        )
        return max(tournament, key=lambda s: s.fitness)


# ──────────────────────────────────────────────────────────────
# Timetable Generator (orchestrator)
# ──────────────────────────────────────────────────────────────

from django.core.cache import cache


class TimetableGenerator:
    """Orchestrates timetable generation for selected sections."""

    def __init__(self, sections, max_generations=200, task_id=None):
        self.sections = sections
        self.max_generations = max_generations
        self.data = None
        self.best_schedule = None
        # Create a unique task ID based on section IDs or use provided
        self.task_id = task_id or ",".join(sorted([str(s.id) for s in sections]))

    def generate(self):
        """Run the genetic algorithm and return the best schedule."""
        state = {
            'running': True,
            'generation_num': 0,
            'fitness': 0.0,
            'terminate': False,
            'total_generations': self.max_generations,
            'timetable_ids': [],
        }
        cache.set(self.task_id, state, timeout=3600)

        self.data = ScheduleData(self.sections)

        if not self.data.offerings or not self.data.time_slots:
            return None

        population = Population(POPULATION_SIZE, self.data)
        population.schedules.sort(key=lambda s: s.fitness, reverse=True)

        ga = GeneticAlgorithm()
        self.best_schedule = population.schedules[0]

        while self.best_schedule.fitness != 1.0:
            state = cache.get(self.task_id)
            if not state or state.get('terminate') or state['generation_num'] >= self.max_generations:
                break

            population = ga.evolve(population)
            population.schedules.sort(key=lambda s: s.fitness, reverse=True)
            self.best_schedule = population.schedules[0]

            state['generation_num'] += 1
            state['fitness'] = self.best_schedule.fitness
            cache.set(self.task_id, state, timeout=3600)

        return self.best_schedule

    def save_results(self):
        """Save the best schedule as Timetable + TimetableEntry objects."""
        if not self.best_schedule:
            return []

        timetables = {}
        academic_year = None
        
        # Get generation info from state if available
        state = cache.get(self.task_id)
        gen_num = state['generation_num'] if state else 0

        for section in self.sections:
            academic_year = section.academic_year
            # Delete any existing draft timetable for this section
            Timetable.objects.filter(
                section=section,
                academic_year=academic_year,
                status='DRAFT',
            ).delete()

            tt = Timetable.objects.create(
                section=section,
                academic_year=academic_year,
                status='DRAFT',
                fitness_score=self.best_schedule.fitness,
                generations_run=gen_num,
            )
            timetables[section.id] = tt

        # Create entries
        entries = []
        for cls in self.best_schedule.classes:
            tt = timetables.get(cls.section.id)
            if not tt or not cls.time_slot:
                continue

            entry = TimetableEntry(
                timetable=tt,
                course_offering=cls.offering,
                time_slot=cls.time_slot,
                room=cls.room,
                faculty=cls.faculty,
                entry_type=cls.entry_type,
                duration_slots=cls.duration_slots,
            )
            entries.append(entry)

        TimetableEntry.objects.bulk_create(entries)
        
        if state:
            state['timetable_ids'] = [tt.id for tt in timetables.values()]
            cache.set(self.task_id, state, timeout=3600)
            
        return list(timetables.values())


# ──────────────────────────────────────────────────────────────
# Conflict Checker
# ──────────────────────────────────────────────────────────────

class ConflictChecker:
    """Analyzes existing timetables for conflicts."""

    @staticmethod
    def check_faculty_conflicts(academic_year=None):
        """Find faculty double-bookings across published timetables, accounting for duration."""
        filters = {'timetable__status__in': ['DRAFT', 'PUBLISHED']}
        if academic_year:
            filters['timetable__academic_year'] = academic_year

        entries = TimetableEntry.objects.filter(
            **filters
        ).select_related(
            'faculty', 'time_slot', 'timetable__section',
            'course_offering__subject'
        ).exclude(faculty=None)

        # Group by (faculty, day, slot_number)
        grouped = defaultdict(list)
        for entry in entries:
            # Add entry to its starting slot AND all continuation slots
            for offset in range(entry.duration_slots):
                key = (entry.faculty_id, entry.time_slot.day, entry.time_slot.slot_number + offset)
                grouped[key].append(entry)

        conflicts = []
        for key, entries_group in grouped.items():
            if len(entries_group) > 1:
                # To avoid duplicate conflict reports for the same lab/theory clash,
                # we only report if it's the first slot of at least one entry in the group?
                # Actually, simple grouping is fine, but may over-report. 
                # Let's just group and then unique the entries.
                conflicts.append({
                    'type': 'faculty',
                    'faculty': entries_group[0].faculty,
                    'day': entries_group[0].time_slot.get_day_display(),
                    'slot': entries_group[0].time_slot, # Note: this is the starting slot of the first entry
                    'entries': entries_group,
                })
        return conflicts

    @staticmethod
    def check_room_conflicts(academic_year=None):
        """Find room double-bookings, accounting for duration."""
        filters = {'timetable__status__in': ['DRAFT', 'PUBLISHED']}
        if academic_year:
            filters['timetable__academic_year'] = academic_year

        entries = TimetableEntry.objects.filter(
            **filters
        ).select_related(
            'room', 'time_slot', 'timetable__section',
            'course_offering__subject'
        ).exclude(room=None)

        grouped = defaultdict(list)
        for entry in entries:
            for offset in range(entry.duration_slots):
                key = (entry.room_id, entry.time_slot.day, entry.time_slot.slot_number + offset)
                grouped[key].append(entry)

        conflicts = []
        for key, entries_group in grouped.items():
            if len(entries_group) > 1:
                conflicts.append({
                    'type': 'room',
                    'room': entries_group[0].room,
                    'day': entries_group[0].time_slot.get_day_display(),
                    'slot': entries_group[0].time_slot,
                    'entries': entries_group,
                })
        return conflicts

    @staticmethod
    def get_all_conflicts(academic_year=None):
        """Get all conflicts as a summary dict."""
        faculty = ConflictChecker.check_faculty_conflicts(academic_year)
        room = ConflictChecker.check_room_conflicts(academic_year)
        return {
            'faculty': faculty,
            'room': room,
            'total': len(faculty) + len(room),
        }
