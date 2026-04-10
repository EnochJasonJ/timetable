from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import api_views

router = DefaultRouter()
router.register(r'departments', api_views.DepartmentViewSet)
router.register(r'faculty', api_views.FacultyViewSet)
router.register(r'subjects', api_views.SubjectViewSet)
router.register(r'rooms', api_views.RoomViewSet)
router.register(r'programs', api_views.ProgramViewSet)
router.register(r'sections', api_views.SectionViewSet)
router.register(r'course-offerings', api_views.CourseOfferingViewSet)
router.register(r'timetables', api_views.TimetableViewSet)
router.register(r'timeslots', api_views.TimeSlotViewSet)
router.register(r'academic-years', api_views.AcademicYearViewSet)
router.register(r'user-profiles', api_views.UserProfileViewSet)

urlpatterns = [
    path('auth/login/', api_views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('dashboard/', api_views.api_dashboard_stats, name='api_dashboard'),
    path('timetables/generate/', api_views.api_generate_timetable, name='api_generate_timetable'),
    path('timetables/progress/', api_views.api_gen_progress_v1, name='api_gen_progress'),
    path('timetables/stop/', api_views.api_stop_generation_v1, name='api_stop_generation'),
    path('timetables/master/', api_views.api_master_timetable, name='api_master_timetable'),
    path('', include(router.urls)),
]
