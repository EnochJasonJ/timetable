from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User


# ──────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────

DAYS_OF_WEEK = [
    ('MON', 'Monday'),
    ('TUE', 'Tuesday'),
    ('WED', 'Wednesday'),
    ('THU', 'Thursday'),
    ('FRI', 'Friday'),
    ('SAT', 'Saturday'),
]

SLOT_TYPES = [
    ('REGULAR', 'Regular Class'),
    ('LAB', 'Lab Block'),
    ('BREAK', 'Break'),
    ('LUNCH', 'Lunch'),
]

SUBJECT_TYPES = [
    ('THEORY', 'Theory'),
    ('LAB', 'Laboratory'),
    ('ELECTIVE', 'Elective'),
    ('COMMON', 'Common / Audit'),
]

ROOM_TYPES = [
    ('CLASSROOM', 'Classroom'),
    ('LAB', 'Laboratory'),
    ('SEMINAR', 'Seminar Hall'),
    ('AUDITORIUM', 'Auditorium'),
]

DESIGNATION_CHOICES = [
    ('PROF', 'Professor'),
    ('ASSOC_PROF', 'Associate Professor'),
    ('ASST_PROF', 'Assistant Professor'),
    ('HOD', 'Head of Department'),
    ('VISITING', 'Visiting Faculty'),
]

ROLE_CHOICES = [
    ('SUPER_ADMIN', 'Super Admin'),
    ('TIMETABLE_ADMIN', 'Timetable Admin'),
    ('HOD', 'Head of Department'),
    ('FACULTY', 'Faculty'),
    ('STUDENT', 'Student'),
]

TIMETABLE_STATUS = [
    ('DRAFT', 'Draft'),
    ('PUBLISHED', 'Published'),
    ('ARCHIVED', 'Archived'),
]

YEAR_CHOICES = [
    (1, 'I Year'),
    (2, 'II Year'),
    (3, 'III Year'),
    (4, 'IV Year'),
]

SEMESTER_CHOICES = [
    (1, 'Semester 1'),
    (2, 'Semester 2'),
    (3, 'Semester 3'),
    (4, 'Semester 4'),
    (5, 'Semester 5'),
    (6, 'Semester 6'),
    (7, 'Semester 7'),
    (8, 'Semester 8'),
]


# ──────────────────────────────────────────────────────────────
# Academic Structure
# ──────────────────────────────────────────────────────────────

class Department(models.Model):
    """Academic department (e.g., CSE, ECE, ME)."""
    name = models.CharField(
        max_length=100, verbose_name='Department Name',
        help_text='Full name, e.g. Computer Science & Engineering'
    )
    code = models.CharField(
        max_length=10, unique=True, verbose_name='Department Code',
        help_text='Short code, e.g. CSE'
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'

    def __str__(self):
        return f'{self.code} — {self.name}'


class Program(models.Model):
    """A program under a department (e.g., AIML under CSE)."""
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='programs',
        verbose_name='Department'
    )
    name = models.CharField(
        max_length=100, verbose_name='Program Name',
        help_text='e.g. Artificial Intelligence & Machine Learning'
    )
    code = models.CharField(
        max_length=10, unique=True, verbose_name='Program Code',
        help_text='e.g. AIML'
    )
    duration_years = models.PositiveIntegerField(
        default=4, verbose_name='Duration (Years)',
        validators=[MinValueValidator(1), MaxValueValidator(6)]
    )

    class Meta:
        ordering = ['department', 'name']
        verbose_name = 'Program'
        verbose_name_plural = 'Programs'

    def __str__(self):
        return f'{self.code} — {self.name}'


class AcademicYear(models.Model):
    """An academic year like 2025–2026."""
    label = models.CharField(
        max_length=20, unique=True, verbose_name='Academic Year',
        help_text='e.g. 2025-2026'
    )
    start_date = models.DateField(verbose_name='Start Date')
    end_date = models.DateField(verbose_name='End Date')
    is_current = models.BooleanField(
        default=False, verbose_name='Current Year',
        help_text='Mark as the active academic year'
    )

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Academic Year'
        verbose_name_plural = 'Academic Years'

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicYear.objects.filter(is_current=True).exclude(
                pk=self.pk
            ).update(is_current=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.label


# ──────────────────────────────────────────────────────────────
# Infrastructure
# ──────────────────────────────────────────────────────────────

class Room(models.Model):
    """A physical room / lab / hall."""
    number = models.CharField(
        max_length=20, verbose_name='Room Number',
        help_text='e.g. A101, LAB-3'
    )
    name = models.CharField(
        max_length=80, blank=True, verbose_name='Room Name',
        help_text='Optional friendly name'
    )
    building = models.CharField(
        max_length=50, blank=True, verbose_name='Building'
    )
    seating_capacity = models.PositiveIntegerField(
        default=60, verbose_name='Seating Capacity'
    )
    room_type = models.CharField(
        max_length=15, choices=ROOM_TYPES, default='CLASSROOM',
        verbose_name='Room Type'
    )

    class Meta:
        ordering = ['building', 'number']
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'

    def __str__(self):
        label = f'{self.number}'
        if self.name:
            label += f' ({self.name})'
        return label


class TimeSlot(models.Model):
    """A fixed period in the weekly schedule."""
    slot_number = models.PositiveIntegerField(
        verbose_name='Slot Number',
        help_text='Order within the day (1, 2, 3…)'
    )
    day = models.CharField(
        max_length=3, choices=DAYS_OF_WEEK, verbose_name='Day'
    )
    start_time = models.TimeField(verbose_name='Start Time')
    end_time = models.TimeField(verbose_name='End Time')
    slot_type = models.CharField(
        max_length=10, choices=SLOT_TYPES, default='REGULAR',
        verbose_name='Slot Type'
    )
    label = models.CharField(
        max_length=40, blank=True, verbose_name='Label',
        help_text='e.g. Period 1, Lunch Break'
    )

    class Meta:
        ordering = ['day', 'slot_number']
        unique_together = [('day', 'slot_number')]
        verbose_name = 'Time Slot'
        verbose_name_plural = 'Time Slots'

    def clean(self):
        if self.start_time and self.end_time:
            if self.start_time >= self.end_time:
                raise ValidationError(
                    'Start time must be before end time.'
                )
            # Check for overlapping slots on the same day
            overlapping = TimeSlot.objects.filter(
                day=self.day,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
            ).exclude(pk=self.pk)
            if overlapping.exists():
                raise ValidationError(
                    f'This slot overlaps with: {overlapping.first()}'
                )

    @property
    def time_range(self):
        if self.start_time and self.end_time:
            return (
                f'{self.start_time.strftime("%I:%M %p")} – '
                f'{self.end_time.strftime("%I:%M %p")}'
            )
        return ''

    def __str__(self):
        day_label = self.get_day_display()
        return f'{day_label} Slot {self.slot_number} ({self.time_range})'


# ──────────────────────────────────────────────────────────────
# People
# ──────────────────────────────────────────────────────────────

class Faculty(models.Model):
    """A teaching staff member."""
    faculty_id = models.CharField(
        max_length=20, unique=True, verbose_name='Faculty ID',
        help_text='e.g. CSE001'
    )
    first_name = models.CharField(max_length=50, verbose_name='First Name')
    last_name = models.CharField(
        max_length=50, blank=True, verbose_name='Last Name'
    )
    initials = models.CharField(
        max_length=10, blank=True, verbose_name='Initials',
        help_text='e.g. Dr. RK'
    )
    email = models.EmailField(blank=True, verbose_name='Email')
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='faculty_members', verbose_name='Department'
    )
    designation = models.CharField(
        max_length=15, choices=DESIGNATION_CHOICES,
        default='ASST_PROF', verbose_name='Designation'
    )

    class Meta:
        ordering = ['department', 'last_name', 'first_name']
        verbose_name = 'Faculty'
        verbose_name_plural = 'Faculty Members'

    @property
    def full_name(self):
        parts = [self.first_name]
        if self.last_name:
            parts.append(self.last_name)
        return ' '.join(parts)

    @property
    def display_name(self):
        if self.initials:
            return self.initials
        return self.full_name

    def __str__(self):
        return f'{self.faculty_id} — {self.full_name}'


# ──────────────────────────────────────────────────────────────
# Curriculum
# ──────────────────────────────────────────────────────────────

class Subject(models.Model):
    """A course / subject in the curriculum."""
    code = models.CharField(
        max_length=15, unique=True, verbose_name='Subject Code',
        help_text='e.g. CS3491'
    )
    name = models.CharField(
        max_length=120, verbose_name='Subject Name',
        help_text='Full name, e.g. Machine Learning'
    )
    short_name = models.CharField(
        max_length=15, verbose_name='Short Name',
        help_text='Abbreviation for timetable cells, e.g. ML'
    )
    subject_type = models.CharField(
        max_length=10, choices=SUBJECT_TYPES, default='THEORY',
        verbose_name='Subject Type'
    )
    credits = models.PositiveIntegerField(
        default=3, verbose_name='Credits',
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    weekly_hours = models.PositiveIntegerField(
        default=4, verbose_name='Weekly Hours',
        help_text='Total weekly contact hours'
    )
    max_students = models.PositiveIntegerField(
        default=60, verbose_name='Maximum Students'
    )
    lab_duration_slots = models.PositiveIntegerField(
        default=1, verbose_name='Lab Duration (Slots)',
        help_text='Number of consecutive slots for lab sessions (1 for theory)',
        validators=[MinValueValidator(1), MaxValueValidator(4)]
    )

    class Meta:
        ordering = ['code']
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'

    def __str__(self):
        return f'{self.code} — {self.name} ({self.short_name})'


# ──────────────────────────────────────────────────────────────
# Sections & Course Offerings
# ──────────────────────────────────────────────────────────────

class Section(models.Model):
    """A class group like 'II Year AIML A'."""
    name = models.CharField(
        max_length=5, verbose_name='Section Name',
        help_text='e.g. A, B, C'
    )
    year_of_study = models.PositiveIntegerField(
        choices=YEAR_CHOICES, verbose_name='Year of Study'
    )
    semester = models.PositiveIntegerField(
        choices=SEMESTER_CHOICES, verbose_name='Semester'
    )
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='sections',
        verbose_name='Department'
    )
    program = models.ForeignKey(
        Program, on_delete=models.CASCADE, related_name='sections',
        verbose_name='Program'
    )
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name='sections',
        verbose_name='Academic Year'
    )
    strength = models.PositiveIntegerField(
        default=60, verbose_name='Student Strength'
    )

    class Meta:
        ordering = ['year_of_study', 'department', 'program', 'name']
        unique_together = [
            ('name', 'year_of_study', 'semester', 'program', 'academic_year')
        ]
        verbose_name = 'Section'
        verbose_name_plural = 'Sections'

    @property
    def label(self):
        year_label = self.get_year_of_study_display()
        return f'{year_label} – {self.program.code} {self.name}'

    def __str__(self):
        return self.label


class CourseOffering(models.Model):
    """Maps a subject to a section for a semester with assigned faculty."""
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name='offerings',
        verbose_name='Subject'
    )
    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, related_name='course_offerings',
        verbose_name='Section'
    )
    faculty = models.ManyToManyField(
        Faculty, related_name='course_offerings', blank=True,
        verbose_name='Assigned Faculty',
        help_text='Faculty who can teach this subject for this section'
    )
    weekly_hours_override = models.PositiveIntegerField(
        null=True, blank=True, verbose_name='Weekly Hours Override',
        help_text='Override subject default weekly hours for this offering'
    )

    class Meta:
        unique_together = [('subject', 'section')]
        ordering = ['section', 'subject']
        verbose_name = 'Course Offering'
        verbose_name_plural = 'Course Offerings'

    @property
    def effective_weekly_hours(self):
        return self.weekly_hours_override or self.subject.weekly_hours

    def __str__(self):
        return f'{self.section.label} → {self.subject.short_name}'


# ──────────────────────────────────────────────────────────────
# Timetable
# ──────────────────────────────────────────────────────────────

class Timetable(models.Model):
    """A generated timetable for a section in a semester."""
    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, related_name='timetables',
        verbose_name='Section'
    )
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name='timetables',
        verbose_name='Academic Year'
    )
    status = models.CharField(
        max_length=10, choices=TIMETABLE_STATUS, default='DRAFT',
        verbose_name='Status'
    )
    generated_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Generated At'
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name='Last Updated'
    )
    fitness_score = models.FloatField(
        default=0.0, verbose_name='Fitness Score',
        help_text='Quality score from genetic algorithm (1.0 = perfect)'
    )
    generations_run = models.PositiveIntegerField(
        default=0, verbose_name='Generations Run'
    )

    class Meta:
        ordering = ['-generated_at']
        verbose_name = 'Timetable'
        verbose_name_plural = 'Timetables'

    def __str__(self):
        return f'{self.section.label} — {self.academic_year.label} ({self.get_status_display()})'


class TimetableEntry(models.Model):
    """A single cell in a timetable: one subject in one slot."""
    timetable = models.ForeignKey(
        Timetable, on_delete=models.CASCADE, related_name='entries',
        verbose_name='Timetable'
    )
    course_offering = models.ForeignKey(
        CourseOffering, on_delete=models.CASCADE, related_name='timetable_entries',
        verbose_name='Course Offering'
    )
    time_slot = models.ForeignKey(
        TimeSlot, on_delete=models.CASCADE, related_name='timetable_entries',
        verbose_name='Time Slot'
    )
    room = models.ForeignKey(
        Room, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='timetable_entries', verbose_name='Room'
    )
    faculty = models.ForeignKey(
        Faculty, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='timetable_entries', verbose_name='Faculty'
    )
    entry_type = models.CharField(
        max_length=10, choices=[('REGULAR', 'Regular'), ('LAB', 'Lab')],
        default='REGULAR', verbose_name='Entry Type'
    )
    duration_slots = models.PositiveIntegerField(
        default=1, verbose_name='Duration (Slots)',
        help_text='Number of consecutive slots (>1 for labs)',
        validators=[MinValueValidator(1), MaxValueValidator(4)]
    )

    class Meta:
        ordering = ['timetable', 'time_slot']
        verbose_name = 'Timetable Entry'
        verbose_name_plural = 'Timetable Entries'

    def __str__(self):
        return (
            f'{self.course_offering.subject.short_name} | '
            f'{self.time_slot} | {self.room}'
        )


# ──────────────────────────────────────────────────────────────
# User Roles
# ──────────────────────────────────────────────────────────────

class UserProfile(models.Model):
    """Extends Django User with role and academic context."""
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile',
        verbose_name='User'
    )
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default='STUDENT',
        verbose_name='Role'
    )
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='user_profiles', verbose_name='Department'
    )
    faculty_profile = models.OneToOneField(
        Faculty, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='user_profile', verbose_name='Linked Faculty'
    )
    section = models.ForeignKey(
        Section, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='student_profiles', verbose_name='Section',
        help_text='For students: their enrolled section'
    )

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    @property
    def is_super_admin(self):
        return self.role == 'SUPER_ADMIN'

    @property
    def is_timetable_admin(self):
        return self.role in ('SUPER_ADMIN', 'TIMETABLE_ADMIN')

    @property
    def is_hod(self):
        return self.role == 'HOD'

    @property
    def is_faculty(self):
        return self.role in ('FACULTY', 'HOD')

    @property
    def is_student(self):
        return self.role == 'STUDENT'

    @property
    def can_manage_timetable(self):
        return self.role in ('SUPER_ADMIN', 'TIMETABLE_ADMIN', 'HOD')

    def __str__(self):
        return f'{self.user.username} ({self.get_role_display()})'
