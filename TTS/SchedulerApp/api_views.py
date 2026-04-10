from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import (
    Department, Program, AcademicYear, Room, TimeSlot, Faculty,
    Subject, Section, CourseOffering, Timetable, TimetableEntry, UserProfile
)
from .serializers import (
    DepartmentSerializer, FacultySerializer, SubjectSerializer, RoomSerializer,
    ProgramSerializer, SectionSerializer, CourseOfferingSerializer,
    TimetableSerializer, TimetableEntrySerializer, TimeSlotSerializer,
    AcademicYearSerializer, UserProfileSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from .services import TimetableGenerator, ConflictChecker, GENERATION_STATE
from rest_framework.decorators import action, api_view, permission_classes

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_dashboard_stats(request):
    """Return dashboard summary stats, conflicts, and recent activity."""
    
    # Simple count stats
    stats = {
        'departments': Department.objects.count(),
        'programs': Program.objects.count(),
        'faculty': Faculty.objects.count(),
        'subjects': Subject.objects.count(),
        'sections': Section.objects.count(),
        'rooms': Room.objects.count(),
        'timetables': Timetable.objects.count(),
        'offerings': CourseOffering.objects.count(),
    }
    
    # Recent activity
    recent_timetables = Timetable.objects.select_related(
        'section__program', 'academic_year'
    ).order_by('-generated_at')[:5]
    recent_serializer = TimetableSerializer(recent_timetables, many=True)
    
    # Conflict Summary
    conflicts = ConflictChecker.get_all_conflicts()
    # Format conflicts for UI (serializing types that aren't JSON serializable)
    formatted_conflicts = []
    
    for f_conf in conflicts.get('faculty', []):
        formatted_conflicts.append({
            'type': 'FACULTY',
            'severity': 'HIGH',
            'title': f'Faculty Clash: {f_conf["faculty"].full_name}',
            'description': f'Multiple assignments on {f_conf["day"]} at {f_conf["slot"].start_time.strftime("%H:%M")}',
            'count': len(f_conf['entries'])
        })
    
    for r_conf in conflicts.get('room', []):
        formatted_conflicts.append({
            'type': 'ROOM',
            'severity': 'MEDIUM',
            'title': f'Room Overflow: {r_conf["room"].number}',
            'description': f'Double booked on {r_conf["day"]} at {r_conf["slot"].start_time.strftime("%H:%M")}',
             'count': len(r_conf['entries'])
        })

    return Response({
        'stats': stats,
        'recent_timetables': recent_serializer.data,
        'conflicts': {
            'items': formatted_conflicts,
            'total': conflicts['total']
        },
        'user': {
            'username': request.user.username,
            'role': request.user.profile.role if hasattr(request.user, 'profile') else 'STUDENT'
        }
    })


# Generic Viewsets for CRUD
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAuthenticated]

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]

class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated]

class CourseOfferingViewSet(viewsets.ModelViewSet):
    queryset = CourseOffering.objects.all()
    serializer_class = CourseOfferingSerializer
    permission_classes = [IsAuthenticated]

class TimeSlotViewSet(viewsets.ModelViewSet):
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAuthenticated]

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.select_related(
        'section__program', 'section__department', 'academic_year'
    ).order_by('-generated_at')
    serializer_class = TimetableSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def entries(self, request, pk=None):
        timetable = self.get_object()
        entries = TimetableEntry.objects.filter(timetable=timetable).select_related(
            'course_offering__subject', 'time_slot', 'room', 'faculty'
        ).order_by('time_slot__day', 'time_slot__slot_number')
        serializer = TimetableEntrySerializer(entries, many=True)
        return Response(serializer.data)


import threading
from django.db import close_old_connections

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_generate_timetable(request):
    """Trigger the genetic algorithm to generate timetables in the background."""
    section_ids = request.data.get('sections', [])
    max_gens = request.data.get('max_generations', 300)

    if not section_ids:
        return Response({'success': False, 'message': 'No sections provided.'}, status=400)

    sections = list(Section.objects.filter(id__in=section_ids))
    if not sections:
        return Response({'success': False, 'message': 'Invalid sections.'}, status=400)
    
    generator = TimetableGenerator(sections, int(max_gens))
    task_id = generator.task_id

    def run_generation():
        try:
            schedule = generator.generate()
            if schedule:
                generator.save_results()
        finally:
            close_old_connections()

    thread = threading.Thread(target=run_generation)
    thread.daemon = True
    thread.start()

    return Response({
        'success': True,
        'message': 'Generation started in background.',
        'task_id': task_id
    })


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated]


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.select_related('user', 'department').all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Allow filtering by role
        role = self.request.query_params.get('role')
        if role:
            return self.queryset.filter(role=role)
        return self.queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_gen_progress_v1(request):
    """Return current generation progress for a specific task."""
    task_id = request.query_params.get('task_id')
    if not task_id:
        return Response({'success': False, 'message': 'task_id required.'}, status=400)
    
    if task_id in GENERATION_STATE:
        state = GENERATION_STATE[task_id]
        return Response({
            'running': state['running'],
            'generation': state['generation_num'],
            'fitness': round(state['fitness'] * 100, 1),
            'total': state['total_generations'],
            'terminate': state['terminate'],
        })
    return Response({'running': False, 'message': 'Task not found.'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_stop_generation_v1(request):
    """Signal the generator to stop for a specific task."""
    task_id = request.data.get('task_id')
    if task_id in GENERATION_STATE:
        GENERATION_STATE[task_id]['terminate'] = True
        return Response({'success': True, 'message': 'Termination signal sent.'})
    return Response({'success': False, 'message': 'Task not found.'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_master_timetable(request):
    """Return consolidated entries for all active timetables with filters."""
    filters = {'timetable__status__in': ['DRAFT', 'PUBLISHED']}
    
    dept_id = request.query_params.get('department')
    year = request.query_params.get('year')
    section_id = request.query_params.get('section')
    
    if dept_id:
        filters['timetable__section__department_id'] = dept_id
    if year:
        filters['timetable__section__year_of_study'] = year
    if section_id:
        filters['timetable__section_id'] = section_id

    entries = TimetableEntry.objects.filter(
        **filters
    ).select_related(
        'course_offering__subject', 'time_slot', 'room', 'faculty',
        'timetable__section__program'
    ).order_by('time_slot__day', 'time_slot__slot_number')
    
    serializer = TimetableEntrySerializer(entries, many=True)
    return Response(serializer.data)



