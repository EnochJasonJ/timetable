from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Department, Program, AcademicYear, Room, TimeSlot, Faculty,
    Subject, Section, CourseOffering, Timetable, TimetableEntry, UserProfile
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        if hasattr(user, 'profile'):
            token['role'] = user.profile.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra responses here
        data['user'] = {
            'username': self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.profile.role if hasattr(self.user, 'profile') else 'STUDENT',
        }
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'role', 'department', 'section', 'faculty_profile',
            'username', 'first_name', 'last_name', 'department_name'
        ]


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'



class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class FacultySerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Faculty
        fields = [
            'id', 'faculty_id', 'first_name', 'last_name', 'initials', 
            'email', 'department', 'designation', 'department_name'
        ]

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class ProgramSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Program
        fields = ['id', 'department', 'name', 'code', 'duration_years', 'department_name']

class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = '__all__'

class TimetableSerializer(serializers.ModelSerializer):
    section_label = serializers.CharField(source='section.label', read_only=True)
    department_name = serializers.CharField(source='section.department.name', read_only=True)
    program_name = serializers.CharField(source='section.program.name', read_only=True)
    
    class Meta:
        model = Timetable
        fields = [
            'id', 'section', 'academic_year', 'status', 'generated_at', 
            'updated_at', 'fitness_score', 'generations_run', 'section_label', 
            'department_name', 'program_name'
        ]

class TimetableEntrySerializer(serializers.ModelSerializer):
    subject_code = serializers.CharField(source='course_offering.subject.code', read_only=True)
    subject_name = serializers.CharField(source='course_offering.subject.name', read_only=True)
    subject_type = serializers.CharField(source='course_offering.subject.subject_type', read_only=True)
    faculty_name = serializers.CharField(source='faculty.display_name', read_only=True)
    room_name = serializers.CharField(source='room.__str__', read_only=True)
    section = serializers.IntegerField(source='timetable.section.id', read_only=True)
    section_label = serializers.CharField(source='timetable.section.label', read_only=True)
    time_slot = TimeSlotSerializer(read_only=True)
    
    class Meta:
        model = TimetableEntry
        fields = [
            'id', 'timetable', 'course_offering', 'time_slot', 'room', 
            'faculty', 'entry_type', 'duration_slots', 'subject_code', 
            'subject_name', 'subject_type', 'faculty_name', 'room_name', 
            'section', 'section_label'
        ]


class SectionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)
    label = serializers.CharField(read_only=True)

    class Meta:
        model = Section
        fields = [
            'id', 'name', 'year_of_study', 'semester', 'department', 
            'program', 'academic_year', 'strength', 'department_name', 
            'program_name', 'academic_year_label', 'label'
        ]

class CourseOfferingSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    section_label = serializers.CharField(source='section.label', read_only=True)
    faculty_names = serializers.SerializerMethodField()

    class Meta:
        model = CourseOffering
        fields = [
            'id', 'subject', 'section', 'faculty', 'weekly_hours_override', 
            'subject_name', 'section_label', 'faculty_names'
        ]

    def get_faculty_names(self, obj):
        return [f.full_name for f in obj.faculty.all()]

