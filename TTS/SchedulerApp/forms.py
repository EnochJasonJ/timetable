from django import forms
from django.contrib.auth.forms import AuthenticationForm
from .models import (
    Department, Program, AcademicYear, Room, TimeSlot,
    Faculty, Subject, Section, CourseOffering, UserProfile,
)


# ── Shared widget attrs ─────────────────────────────────────

_input_attrs = {'class': 'form-input'}
_select_attrs = {'class': 'form-select'}
_multi_attrs = {'class': 'form-select-multi'}
_time_attrs = {'class': 'form-input', 'type': 'time'}


# ── Auth ─────────────────────────────────────────────────────

class UserLoginForm(AuthenticationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={
        'class': 'form-input',
        'placeholder': 'Enter your username',
        'id': 'id_username',
        'autocomplete': 'username',
    }))
    password = forms.CharField(widget=forms.PasswordInput(attrs={
        'class': 'form-input',
        'placeholder': 'Enter your password',
        'id': 'id_password',
        'autocomplete': 'current-password',
    }))


# ── Department & Program ─────────────────────────────────────

class DepartmentForm(forms.ModelForm):
    class Meta:
        model = Department
        fields = ['code', 'name']
        labels = {
            'code': 'Department Code',
            'name': 'Department Name',
        }
        widgets = {
            'code': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. CSE'}),
            'name': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. Computer Science & Engineering'}),
        }


class ProgramForm(forms.ModelForm):
    class Meta:
        model = Program
        fields = ['department', 'code', 'name', 'duration_years']
        labels = {
            'department': 'Department',
            'code': 'Program Code',
            'name': 'Program Name',
            'duration_years': 'Duration (Years)',
        }
        widgets = {
            'department': forms.Select(attrs=_select_attrs),
            'code': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. AIML'}),
            'name': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. AI & Machine Learning'}),
            'duration_years': forms.NumberInput(attrs={**_input_attrs, 'min': 1, 'max': 6}),
        }


# ── Academic Year ────────────────────────────────────────────

class AcademicYearForm(forms.ModelForm):
    class Meta:
        model = AcademicYear
        fields = ['label', 'start_date', 'end_date', 'is_current']
        labels = {
            'label': 'Academic Year',
            'start_date': 'Start Date',
            'end_date': 'End Date',
            'is_current': 'Set as Current Year',
        }
        widgets = {
            'label': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. 2025-2026'}),
            'start_date': forms.DateInput(attrs={**_input_attrs, 'type': 'date'}),
            'end_date': forms.DateInput(attrs={**_input_attrs, 'type': 'date'}),
            'is_current': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
        }


# ── Room ─────────────────────────────────────────────────────

class RoomForm(forms.ModelForm):
    class Meta:
        model = Room
        fields = ['number', 'name', 'building', 'seating_capacity', 'room_type']
        labels = {
            'number': 'Room Number',
            'name': 'Room Name (Optional)',
            'building': 'Building',
            'seating_capacity': 'Seating Capacity',
            'room_type': 'Room Type',
        }
        widgets = {
            'number': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. A101'}),
            'name': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. CS Lab 1'}),
            'building': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. Block A'}),
            'seating_capacity': forms.NumberInput(attrs={**_input_attrs, 'min': 1}),
            'room_type': forms.Select(attrs=_select_attrs),
        }


# ── Time Slot ────────────────────────────────────────────────

class TimeSlotForm(forms.ModelForm):
    class Meta:
        model = TimeSlot
        fields = ['day', 'slot_number', 'start_time', 'end_time', 'slot_type', 'label']
        labels = {
            'day': 'Day of Week',
            'slot_number': 'Slot Number',
            'start_time': 'Start Time',
            'end_time': 'End Time',
            'slot_type': 'Slot Type',
            'label': 'Label (Optional)',
        }
        widgets = {
            'day': forms.Select(attrs=_select_attrs),
            'slot_number': forms.NumberInput(attrs={**_input_attrs, 'min': 1}),
            'start_time': forms.TimeInput(attrs=_time_attrs),
            'end_time': forms.TimeInput(attrs=_time_attrs),
            'slot_type': forms.Select(attrs=_select_attrs),
            'label': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. Period 1'}),
        }


# ── Faculty ──────────────────────────────────────────────────

class FacultyForm(forms.ModelForm):
    class Meta:
        model = Faculty
        fields = [
            'faculty_id', 'first_name', 'last_name', 'initials',
            'email', 'department', 'designation',
        ]
        labels = {
            'faculty_id': 'Faculty ID',
            'first_name': 'First Name',
            'last_name': 'Last Name',
            'initials': 'Initials / Short Name',
            'email': 'Email Address',
            'department': 'Department',
            'designation': 'Designation',
        }
        widgets = {
            'faculty_id': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. CSE001'}),
            'first_name': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'First name'}),
            'last_name': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'Last name'}),
            'initials': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. Dr. RK'}),
            'email': forms.EmailInput(attrs={**_input_attrs, 'placeholder': 'email@college.edu'}),
            'department': forms.Select(attrs=_select_attrs),
            'designation': forms.Select(attrs=_select_attrs),
        }


# ── Subject ──────────────────────────────────────────────────

class SubjectForm(forms.ModelForm):
    class Meta:
        model = Subject
        fields = [
            'code', 'name', 'short_name', 'subject_type',
            'credits', 'weekly_hours', 'max_students', 'lab_duration_slots',
        ]
        labels = {
            'code': 'Subject Code',
            'name': 'Subject Name',
            'short_name': 'Short Name',
            'subject_type': 'Subject Type',
            'credits': 'Credits',
            'weekly_hours': 'Weekly Hours',
            'max_students': 'Maximum Students',
            'lab_duration_slots': 'Lab Duration (Slots)',
        }
        widgets = {
            'code': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. CS3491'}),
            'name': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. Machine Learning'}),
            'short_name': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. ML'}),
            'subject_type': forms.Select(attrs=_select_attrs),
            'credits': forms.NumberInput(attrs={**_input_attrs, 'min': 0, 'max': 10}),
            'weekly_hours': forms.NumberInput(attrs={**_input_attrs, 'min': 1}),
            'max_students': forms.NumberInput(attrs={**_input_attrs, 'min': 1}),
            'lab_duration_slots': forms.NumberInput(attrs={**_input_attrs, 'min': 1, 'max': 4}),
        }


# ── Section ──────────────────────────────────────────────────

class SectionForm(forms.ModelForm):
    class Meta:
        model = Section
        fields = [
            'name', 'year_of_study', 'semester', 'department',
            'program', 'academic_year', 'strength',
        ]
        labels = {
            'name': 'Section Name',
            'year_of_study': 'Year of Study',
            'semester': 'Semester',
            'department': 'Department',
            'program': 'Program',
            'academic_year': 'Academic Year',
            'strength': 'Student Strength',
        }
        widgets = {
            'name': forms.TextInput(attrs={**_input_attrs, 'placeholder': 'e.g. A'}),
            'year_of_study': forms.Select(attrs=_select_attrs),
            'semester': forms.Select(attrs=_select_attrs),
            'department': forms.Select(attrs=_select_attrs),
            'program': forms.Select(attrs=_select_attrs),
            'academic_year': forms.Select(attrs=_select_attrs),
            'strength': forms.NumberInput(attrs={**_input_attrs, 'min': 1}),
        }


# ── Course Offering ──────────────────────────────────────────

class CourseOfferingForm(forms.ModelForm):
    class Meta:
        model = CourseOffering
        fields = ['subject', 'section', 'faculty', 'weekly_hours_override']
        labels = {
            'subject': 'Subject',
            'section': 'Section',
            'faculty': 'Assigned Faculty',
            'weekly_hours_override': 'Weekly Hours Override (Optional)',
        }
        widgets = {
            'subject': forms.Select(attrs=_select_attrs),
            'section': forms.Select(attrs=_select_attrs),
            'faculty': forms.SelectMultiple(attrs=_multi_attrs),
            'weekly_hours_override': forms.NumberInput(attrs={**_input_attrs, 'min': 1}),
        }


# ── User Profile / Role ─────────────────────────────────────

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['role', 'department', 'faculty_profile', 'section']
        labels = {
            'role': 'Role',
            'department': 'Department',
            'faculty_profile': 'Linked Faculty Profile',
            'section': 'Student Section',
        }
        widgets = {
            'role': forms.Select(attrs=_select_attrs),
            'department': forms.Select(attrs=_select_attrs),
            'faculty_profile': forms.Select(attrs=_select_attrs),
            'section': forms.Select(attrs=_select_attrs),
        }


# ── Timetable Generation ────────────────────────────────────

class TimetableGenerateForm(forms.Form):
    """Form for selecting which sections to generate timetables for."""
    sections = forms.ModelMultipleChoiceField(
        queryset=Section.objects.all(),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'form-checkbox-group'}),
        label='Select Sections',
        help_text='Choose one or more sections to generate timetables for.',
    )
    max_generations = forms.IntegerField(
        initial=200,
        min_value=50,
        max_value=1000,
        widget=forms.NumberInput(attrs={**_input_attrs, 'min': 50, 'max': 1000}),
        label='Maximum Generations',
        help_text='Higher = better quality but slower.',
    )
