from django.contrib import admin
from .models import (
    Department, Program, AcademicYear, Room, TimeSlot,
    Faculty, Subject, Section, CourseOffering,
    Timetable, TimetableEntry, UserProfile,
)


# ── Inlines ──────────────────────────────────────────────────

class ProgramInline(admin.TabularInline):
    model = Program
    extra = 1


class CourseOfferingInline(admin.TabularInline):
    model = CourseOffering
    extra = 1
    autocomplete_fields = ['subject', 'section']


class TimetableEntryInline(admin.TabularInline):
    model = TimetableEntry
    extra = 0
    readonly_fields = ['time_slot', 'course_offering', 'room', 'faculty']


# ── Model Admins ─────────────────────────────────────────────

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['code', 'name']
    search_fields = ['name', 'code']
    inlines = [ProgramInline]


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'department', 'duration_years']
    list_filter = ['department']
    search_fields = ['name', 'code']


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['label', 'start_date', 'end_date', 'is_current']
    list_filter = ['is_current']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['number', 'name', 'building', 'seating_capacity', 'room_type']
    list_filter = ['room_type', 'building']
    search_fields = ['number', 'name']


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['day', 'slot_number', 'start_time', 'end_time', 'slot_type', 'label']
    list_filter = ['day', 'slot_type']
    ordering = ['day', 'slot_number']


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ['faculty_id', 'full_name', 'initials', 'department', 'designation']
    list_filter = ['department', 'designation']
    search_fields = ['faculty_id', 'first_name', 'last_name', 'initials']

    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Name'


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'short_name', 'subject_type', 'credits', 'weekly_hours']
    list_filter = ['subject_type']
    search_fields = ['code', 'name', 'short_name']


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['label', 'year_of_study', 'semester', 'program', 'academic_year', 'strength']
    list_filter = ['year_of_study', 'semester', 'department', 'program', 'academic_year']
    search_fields = ['name']

    def label(self, obj):
        return obj.label
    label.short_description = 'Section'


@admin.register(CourseOffering)
class CourseOfferingAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'subject', 'section', 'effective_weekly_hours']
    list_filter = ['section__year_of_study', 'section__department', 'subject__subject_type']
    autocomplete_fields = ['subject', 'section']
    filter_horizontal = ['faculty']

    def effective_weekly_hours(self, obj):
        return obj.effective_weekly_hours
    effective_weekly_hours.short_description = 'Weekly Hours'


@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ['section', 'academic_year', 'status', 'fitness_score', 'generated_at']
    list_filter = ['status', 'academic_year']
    readonly_fields = ['generated_at', 'updated_at']
    inlines = [TimetableEntryInline]


@admin.register(TimetableEntry)
class TimetableEntryAdmin(admin.ModelAdmin):
    list_display = ['timetable', 'course_offering', 'time_slot', 'room', 'faculty', 'entry_type']
    list_filter = ['entry_type', 'time_slot__day']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'department']
    list_filter = ['role', 'department']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    autocomplete_fields = ['faculty_profile']


# Admin site branding
admin.site.site_header = 'Timetable Management System'
admin.site.site_title = 'TMS Admin'
admin.site.index_title = 'Administration'
