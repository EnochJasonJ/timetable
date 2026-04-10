from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('', views.dashboard, name='dashboard'),

    # Timetables
    path('timetables/', views.timetable_list, name='timetable_list'),
    path('timetables/generate/', views.timetable_generate, name='timetable_generate'),
    path('timetables/<int:pk>/', views.timetable_view, name='timetable_view'),
    path('timetables/<int:pk>/action/', views.timetable_publish, name='timetable_publish'),
    path('timetables/<int:pk>/download/', views.timetable_download, name='timetable_download'),
    path('timetables/master/', views.master_timetable, name='master_timetable'),

    # Departments
    path('departments/', views.department_list, name='department_list'),
    path('departments/<int:pk>/delete/', views.department_delete, name='department_delete'),

    # Programs
    path('programs/', views.program_list, name='program_list'),
    path('programs/<int:pk>/delete/', views.program_delete, name='program_delete'),

    # Academic Years
    path('academic-years/', views.academic_year_list, name='academic_year_list'),
    path('academic-years/<int:pk>/delete/', views.academic_year_delete, name='academic_year_delete'),

    # Rooms
    path('rooms/', views.room_list, name='room_list'),
    path('rooms/<int:pk>/delete/', views.room_delete, name='room_delete'),

    # Time Slots
    path('time-slots/', views.timeslot_list, name='timeslot_list'),
    path('time-slots/<int:pk>/delete/', views.timeslot_delete, name='timeslot_delete'),

    # Faculty
    path('faculty/', views.faculty_list, name='faculty_list'),
    path('faculty/<int:pk>/delete/', views.faculty_delete, name='faculty_delete'),

    # Subjects
    path('subjects/', views.subject_list, name='subject_list'),
    path('subjects/<int:pk>/delete/', views.subject_delete, name='subject_delete'),

    # Sections
    path('sections/', views.section_list, name='section_list'),
    path('sections/<int:pk>/delete/', views.section_delete, name='section_delete'),

    # Course Offerings
    path('course-offerings/', views.offering_list, name='offering_list'),
    path('course-offerings/<int:pk>/delete/', views.offering_delete, name='offering_delete'),

    # Users & Roles
    path('users/', views.user_list, name='user_list'),
    path('users/<int:pk>/role/', views.user_role_edit, name='user_role_edit'),

    # API
    path('api/gen-progress/', views.api_gen_progress, name='api_gen_progress'),
    path('api/stop-generation/', views.api_stop_generation, name='api_stop_generation'),
]
