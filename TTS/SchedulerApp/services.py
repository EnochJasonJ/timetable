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

        # Only teaching slots (REGULAR type) for scheduling
        self.time_slots = list(
            TimeSlot.objects.filter(slot_type='REGULAR').order_by('day', 'slot_number')
        )

        # Build a lookup: day -> sorted list of regular slots
        self.slots_by_day = defaultdict(list)
        for slot in self.time_slots:
            self.slots_by_day[slot.day].append(slot)

        # Load course offerings for the target sections
        self.offerings = list(
            CourseOffering.objects.filter(
                section__in=self.sections
            ).select_related('subject', 'section').prefetch_related('faculty')
        )

    def get_rooms_for_type(self, subject_type):
        if subject_type == 'LAB':
            return self.lab_rooms if self.lab_rooms else self.all_rooms
        return self.rooms if self.rooms else self.all_rooms

    def get_consecutive_slots(self, day, start_slot_number, count):
        """Get `count` consecutive slots starting from EXACTLY `start_slot_number` on `day`."""
        day_slots = self.slots_by_day.get(day, [])
        result = []
        
        # Find the starting slot
        start_idx = -1
        for i, slot in enumerate(day_slots):
            if slot.slot_number == start_slot_number:
                start_idx = i
                break
        
        if start_idx == -1:
            return []
            
        # Check if we have enough slots following it
        for i in range(start_idx, min(start_idx + count, len(day_slots))):
            slot = day_slots[i]
            if not result or slot.slot_number == result[-1].slot_number + 1:
                result.append(slot)
            else:
                break
                
        return result if len(result) == count else []


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
        """Create random class assignments from course offerings."""
        for offering in self.data.offerings:
            weekly_hours = offering.effective_weekly_hours
            subject = offering.subject

            if subject.subject_type == 'LAB':
                # Labs: schedule as multi-slot blocks
                lab_slots_needed = subject.lab_duration_slots
                sessions = weekly_hours // lab_slots_needed
                remainder = weekly_hours % lab_slots_needed
                
                for _ in range(sessions):
                    cls = ScheduleClass(offering)
                    self._assign_random(cls, is_lab=True)
                    self.classes.append(cls)
                
                # Handle remainder as smaller blocks or single slots
                if remainder > 0:
                    cls = ScheduleClass(offering)
                    cls.duration_slots = remainder # Adjust duration for the remainder
                    self._assign_random(cls, is_lab=True)
                    self.classes.append(cls)
            else:
                # Theory: one slot per session
                sessions = weekly_hours
                for _ in range(sessions):
                    cls = ScheduleClass(offering)
                    self._assign_random(cls, is_lab=False)
                    self.classes.append(cls)

        return self

    def _assign_random(self, cls, is_lab=False):
        """Assign a random time slot, room, and faculty to a class."""
        slots = self.data.time_slots
        if not slots:
            return

        if is_lab and cls.duration_slots > 1:
            # Try to assign consecutive slots for lab
            days = list(self.data.slots_by_day.keys())
            random.shuffle(days)
            assigned = False
            for day in days:
                day_slots = self.data.slots_by_day[day]
                if len(day_slots) < cls.duration_slots:
                    continue
                start_idx = random.randrange(0, len(day_slots) - cls.duration_slots + 1)
                start_slot = day_slots[start_idx]
                consec = self.data.get_consecutive_slots(
                    day, start_slot.slot_number, cls.duration_slots
                )
                if consec:
                    cls.time_slot = consec[0]
                    assigned = True
                    break
            if not assigned:
                cls.time_slot = random.choice(slots)
        else:
            cls.time_slot = random.choice(slots)

        # Assign room
        rooms = self.data.get_rooms_for_type(cls.subject.subject_type)
        if rooms:
            cls.room = random.choice(rooms)

        # Assign faculty
        faculty_list = list(cls.offering.faculty.all())
        if faculty_list:
            cls.faculty = random.choice(faculty_list)

    def _calculate_fitness(self):
        """Calculate fitness based on conflicts. 1.0 = perfect.

        Penalty sources:
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
            # Room capacity check
            if classes[i].room and classes[i].room.seating_capacity < classes[i].subject.max_students:
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

        # ── Distribution penalty ──
        # ── Distribution penalty ──
        # Penalise uneven distribution: check each section-day for gaps
        # and penalize same subject multiple times on same day
        section_day_slots = defaultdict(set)
        section_day_subjects = defaultdict(list)
        for cls in classes:
            if cls.time_slot:
                key = (cls.section.id, cls.time_slot.day)
                section_day_slots[key].add(cls.time_slot.slot_number)
                section_day_subjects[key].append(cls.subject.id)
                if cls.duration_slots > 1:
                    for offset in range(1, cls.duration_slots):
                        section_day_slots[key].add(cls.time_slot.slot_number + offset)

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
                
                # Penalize multiple classes of same subject on same day
                # (Labs with duration_slots > 1 will only add 1 subject to the list so that's fine)
                # But if same theory subject is scheduled twice, penalize
                subjects_on_day = section_day_subjects.get(key, [])
                if len(subjects_on_day) != len(set(subjects_on_day)):
                    from collections import Counter
                    counts = Counter(subjects_on_day)
                    for count in counts.values():
                        if count > 1:
                            # Add heavily for each duplicate to discourage it
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

# Global state for progress tracking (keyed by task_id)
GENERATION_STATE = {}


class TimetableGenerator:
    """Orchestrates timetable generation for selected sections."""

    def __init__(self, sections, max_generations=200):
        self.sections = sections
        self.max_generations = max_generations
        self.data = None
        self.best_schedule = None
        # Create a unique task ID based on section IDs
        self.task_id = ",".join(sorted([str(s.id) for s in sections]))

    def generate(self):
        """Run the genetic algorithm and return the best schedule."""
        global GENERATION_STATE

        GENERATION_STATE[self.task_id] = {
            'running': True,
            'generation_num': 0,
            'fitness': 0.0,
            'terminate': False,
            'total_generations': self.max_generations,
        }

        self.data = ScheduleData(self.sections)

        if not self.data.offerings or not self.data.time_slots:
            GENERATION_STATE[self.task_id]['running'] = False
            return None

        population = Population(POPULATION_SIZE, self.data)
        population.schedules.sort(key=lambda s: s.fitness, reverse=True)

        ga = GeneticAlgorithm()
        self.best_schedule = population.schedules[0]

        while (self.best_schedule.fitness != 1.0 and
               GENERATION_STATE[self.task_id]['generation_num'] < self.max_generations):

            if GENERATION_STATE[self.task_id]['terminate']:
                break

            population = ga.evolve(population)
            population.schedules.sort(key=lambda s: s.fitness, reverse=True)
            self.best_schedule = population.schedules[0]

            GENERATION_STATE[self.task_id]['generation_num'] += 1
            GENERATION_STATE[self.task_id]['fitness'] = self.best_schedule.fitness

        GENERATION_STATE[self.task_id]['running'] = False
        return self.best_schedule

    def save_results(self):
        """Save the best schedule as Timetable + TimetableEntry objects."""
        if not self.best_schedule:
            return []

        timetables = {}
        academic_year = None
        
        # Get generation info from state if available
        gen_num = 0
        if self.task_id in GENERATION_STATE:
            gen_num = GENERATION_STATE[self.task_id]['generation_num']

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
                generations_run=GENERATION_STATE['generation_num'],
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
