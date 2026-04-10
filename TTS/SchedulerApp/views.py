"""
Views for the Timetable Management System.
Organized by feature area with role-based access control.
"""
from collections import defaultdict, OrderedDict
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
from .models import (
    Department, Program, AcademicYear, Room, TimeSlot,
    Faculty, Subject, Section, CourseOffering,
    Timetable, TimetableEntry, UserProfile,
    DAYS_OF_WEEK, YEAR_CHOICES, SLOT_TYPES,
)
from .forms import (
    DepartmentForm, ProgramForm, AcademicYearForm, RoomForm,
    TimeSlotForm, FacultyForm, SubjectForm, SectionForm,
    CourseOfferingForm, UserProfileForm, TimetableGenerateForm,
)
from .decorators import (
    role_required, admin_required, management_required, staff_required,
    get_user_profile,
)
from .services import TimetableGenerator, ConflictChecker, GENERATION_STATE


# ──────────────────────────────────────────────────────────────
# Dashboard
# ──────────────────────────────────────────────────────────────

def dashboard(request):
    """Role-aware dashboard with summary stats and quick actions."""
    profile = get_user_profile(request.user) if request.user.is_authenticated else None

    # Stats for admin/staff
    stats = {}
    conflicts = {'total': 0}
    recent_timetables = []

    if request.user.is_authenticated:
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
        try:
            conflicts = ConflictChecker.get_all_conflicts()
        except Exception:
            conflicts = {'total': 0}

        recent_timetables = Timetable.objects.select_related(
            'section__program', 'section__department', 'academic_year'
        ).order_by('-generated_at')[:5]

    return render(request, 'dashboard.html', {
        'stats': stats,
        'conflicts': conflicts,
        'recent_timetables': recent_timetables,
        'profile': profile,
    })


# ──────────────────────────────────────────────────────────────
# Timetable Generation & Viewing
# ──────────────────────────────────────────────────────────────

@login_required
@management_required
def timetable_generate(request):
    """Generate timetables for selected sections."""
    if request.method == 'POST':
        form = TimetableGenerateForm(request.POST)
        if form.is_valid():
            sections = form.cleaned_data['sections']
            max_gens = form.cleaned_data['max_generations']

            generator = TimetableGenerator(sections, max_gens)
            schedule = generator.generate()

            if schedule:
                timetables = generator.save_results()
                messages.success(
                    request,
                    f'Timetable generated successfully! '
                    f'Fitness: {schedule.fitness:.2%}, '
                    f'Conflicts: {schedule.conflicts}, '
                    f'Generations: {GENERATION_STATE["generation_num"]}'
                )
                if timetables:
                    return redirect('timetable_view', pk=timetables[0].id)
            else:
                messages.error(
                    request,
                    'Could not generate timetable. Ensure time slots and '
                    'course offerings are configured.'
                )
            return redirect('timetable_list')
    else:
        form = TimetableGenerateForm()

    return render(request, 'timetable_generate.html', {'form': form})


@login_required
def timetable_list(request):
    """List all timetables with filters."""
    timetables = Timetable.objects.select_related(
        'section__program', 'section__department', 'academic_year'
    ).order_by('-generated_at')

    # Filters
    year = request.GET.get('year')
    department = request.GET.get('department')
    section = request.GET.get('section')
    semester = request.GET.get('semester')
    status = request.GET.get('status')

    if year:
        timetables = timetables.filter(section__year_of_study=year)
    if department:
        timetables = timetables.filter(section__department_id=department)
    if section:
        timetables = timetables.filter(section_id=section)
    if semester:
        timetables = timetables.filter(section__semester=semester)
    if status:
        timetables = timetables.filter(status=status)

    return render(request, 'timetable_list.html', {
        'timetables': timetables,
        'departments': Department.objects.all(),
        'sections': Section.objects.all(),
        'years': YEAR_CHOICES,
        'filter_year': year,
        'filter_department': department,
        'filter_section': section,
        'filter_semester': semester,
        'filter_status': status,
    })


@login_required
def timetable_view(request, pk):
    """View a single section's timetable as a grid."""
    timetable = get_object_or_404(
        Timetable.objects.select_related(
            'section__program', 'section__department', 'academic_year'
        ),
        pk=pk
    )

    entries = TimetableEntry.objects.filter(
        timetable=timetable
    ).select_related(
        'course_offering__subject', 'time_slot', 'room', 'faculty'
    ).order_by('time_slot__day', 'time_slot__slot_number')

    # Build grid data: grid[day][slot_number] = entry
    grid = _build_timetable_grid(entries)
    days = [d for d in DAYS_OF_WEEK if d[0] in grid]
    slots = TimeSlot.objects.values(
        'slot_number', 'start_time', 'end_time', 'slot_type'
    ).distinct().order_by('slot_number')

    # Deduplicate slots by slot_number (take first occurrence)
    seen = set()
    unique_slots = []
    for s in slots:
        if s['slot_number'] not in seen:
            seen.add(s['slot_number'])
            unique_slots.append(s)

    return render(request, 'timetable_view.html', {
        'timetable': timetable,
        'entries': entries,
        'grid': grid,
        'days': days,
        'slots': unique_slots,
    })


@login_required
@management_required
def timetable_publish(request, pk):
    """Publish or archive a timetable."""
    timetable = get_object_or_404(Timetable, pk=pk)
    action = request.POST.get('action', 'publish')

    if action == 'publish':
        # Unpublish any other published timetable for same section/year
        Timetable.objects.filter(
            section=timetable.section,
            academic_year=timetable.academic_year,
            status='PUBLISHED',
        ).exclude(pk=pk).update(status='ARCHIVED')
        timetable.status = 'PUBLISHED'
        messages.success(request, 'Timetable published successfully.')
    elif action == 'archive':
        timetable.status = 'ARCHIVED'
        messages.info(request, 'Timetable archived.')
    elif action == 'delete':
        timetable.delete()
        messages.info(request, 'Timetable deleted.')
        return redirect('timetable_list')

    timetable.save()
    return redirect('timetable_view', pk=pk)


# ──────────────────────────────────────────────────────────────
# Master Timetable
# ──────────────────────────────────────────────────────────────

@login_required
@staff_required
def master_timetable(request):
    """Consolidated master timetable view with tabs."""
    view_type = request.GET.get('view', 'section')
    department_id = request.GET.get('department')
    year = request.GET.get('year')
    section_id = request.GET.get('section')
    semester = request.GET.get('semester')

    filters = {'timetable__status__in': ['DRAFT', 'PUBLISHED']}
    if department_id:
        filters['timetable__section__department_id'] = department_id
    if year:
        filters['timetable__section__year_of_study'] = year
    if section_id:
        filters['timetable__section_id'] = section_id
    if semester:
        filters['timetable__section__semester'] = semester

    entries = TimetableEntry.objects.filter(
        **filters
    ).select_related(
        'course_offering__subject', 'time_slot', 'room', 'faculty',
        'timetable__section__program', 'timetable__section__department'
    ).order_by('time_slot__day', 'time_slot__slot_number')

    context = {
        'view_type': view_type,
        'departments': Department.objects.all(),
        'sections': Section.objects.all(),
        'years': YEAR_CHOICES,
        'filter_department': department_id,
        'filter_year': year,
        'filter_section': section_id,
        'filter_semester': semester,
    }

    slots = TimeSlot.objects.values(
        'slot_number', 'start_time', 'end_time', 'slot_type'
    ).distinct().order_by('slot_number')

    seen = set()
    unique_slots = []
    for s in slots:
        if s['slot_number'] not in seen:
            seen.add(s['slot_number'])
            unique_slots.append(s)
    context['slots'] = unique_slots
    context['days'] = DAYS_OF_WEEK

    if view_type == 'section':
        # Group by section
        sections_data = {}
        for entry in entries:
            sec = entry.timetable.section
            if sec.id not in sections_data:
                sections_data[sec.id] = {
                    'section': sec,
                    'entries': [],
                }
            sections_data[sec.id]['entries'].append(entry)

        for sec_id in sections_data:
            sections_data[sec_id]['grid'] = _build_timetable_grid(
                sections_data[sec_id]['entries']
            )
        context['sections_data'] = sections_data

    elif view_type == 'faculty':
        # Group by faculty
        faculty_data = {}
        for entry in entries:
            if not entry.faculty:
                continue
            fac = entry.faculty
            if fac.id not in faculty_data:
                faculty_data[fac.id] = {
                    'faculty': fac,
                    'entries': [],
                }
            faculty_data[fac.id]['entries'].append(entry)

        for fac_id in faculty_data:
            faculty_data[fac_id]['grid'] = _build_timetable_grid(
                faculty_data[fac_id]['entries'], include_section=True
            )
        context['faculty_data'] = faculty_data

    elif view_type == 'room':
        # Group by room
        room_data = {}
        for entry in entries:
            if not entry.room:
                continue
            rm = entry.room
            if rm.id not in room_data:
                room_data[rm.id] = {
                    'room': rm,
                    'entries': [],
                }
            room_data[rm.id]['entries'].append(entry)

        for rm_id in room_data:
            room_data[rm_id]['grid'] = _build_timetable_grid(
                room_data[rm_id]['entries'], include_section=True
            )
        context['room_data'] = room_data

    # Conflicts
    try:
        context['conflicts'] = ConflictChecker.get_all_conflicts()
    except Exception:
        context['conflicts'] = {'total': 0}

    return render(request, 'master_timetable.html', context)


# ──────────────────────────────────────────────────────────────
# Helper: build timetable grid
# ──────────────────────────────────────────────────────────────

def _build_timetable_grid(entries, include_section=False):
    """Build a dict: grid[day_code][slot_number] = entry_info.

    Multi-slot entries (labs) are expanded so that continuation slots
    also contain cell data instead of appearing empty.
    """
    grid = OrderedDict()
    day_order = [d[0] for d in DAYS_OF_WEEK]

    for day_code in day_order:
        grid[day_code] = {}

    for entry in entries:
        day = entry.time_slot.day
        slot_num = entry.time_slot.slot_number
        if day not in grid:
            grid[day] = {}

        info = {
            'entry': entry,
            'subject_short': entry.course_offering.subject.short_name,
            'subject_name': entry.course_offering.subject.name,
            'subject_code': entry.course_offering.subject.code,
            'subject_type': entry.course_offering.subject.subject_type,
            'faculty_name': entry.faculty.display_name if entry.faculty else '–',
            'room': str(entry.room) if entry.room else '–',
            'entry_type': entry.entry_type,
            'duration': entry.duration_slots,
        }
        if include_section:
            info['section'] = entry.timetable.section.label

        grid[day][slot_num] = info

        # Expand multi-slot entries (labs) into continuation cells
        if entry.duration_slots > 1:
            for offset in range(1, entry.duration_slots):
                cont_slot = slot_num + offset
                # Only fill if the cell is not already occupied
                if cont_slot not in grid[day]:
                    cont_info = dict(info)
                    cont_info['is_continuation'] = True
                    grid[day][cont_slot] = cont_info

    return grid


# ──────────────────────────────────────────────────────────────
# CRUD: Departments
# ──────────────────────────────────────────────────────────────

@login_required
@admin_required
def department_list(request):
    form = DepartmentForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Department added successfully.')
        return redirect('department_list')

    departments = Department.objects.prefetch_related('programs').all()
    return render(request, 'department_list.html', {
        'form': form,
        'departments': departments,
    })


@login_required
@admin_required
def department_delete(request, pk):
    if request.method == 'POST':
        Department.objects.filter(pk=pk).delete()
        messages.success(request, 'Department deleted.')
    return redirect('department_list')


# ──────────────────────────────────────────────────────────────
# CRUD: Programs
# ──────────────────────────────────────────────────────────────

@login_required
@admin_required
def program_list(request):
    form = ProgramForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Program added successfully.')
        return redirect('program_list')

    programs = Program.objects.select_related('department').all()
    return render(request, 'program_list.html', {
        'form': form,
        'programs': programs,
    })


@login_required
@admin_required
def program_delete(request, pk):
    if request.method == 'POST':
        Program.objects.filter(pk=pk).delete()
        messages.success(request, 'Program deleted.')
    return redirect('program_list')


# ──────────────────────────────────────────────────────────────
# CRUD: Academic Years
# ──────────────────────────────────────────────────────────────

@login_required
@admin_required
def academic_year_list(request):
    form = AcademicYearForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Academic year added successfully.')
        return redirect('academic_year_list')

    years = AcademicYear.objects.all()
    return render(request, 'academic_year_list.html', {
        'form': form,
        'years': years,
    })


@login_required
@admin_required
def academic_year_delete(request, pk):
    if request.method == 'POST':
        AcademicYear.objects.filter(pk=pk).delete()
        messages.success(request, 'Academic year deleted.')
    return redirect('academic_year_list')


# ──────────────────────────────────────────────────────────────
# CRUD: Rooms
# ──────────────────────────────────────────────────────────────

@login_required
@management_required
def room_list(request):
    form = RoomForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Room added successfully.')
        return redirect('room_list')

    rooms = Room.objects.all()
    return render(request, 'room_list.html', {
        'form': form,
        'rooms': rooms,
    })


@login_required
@management_required
def room_delete(request, pk):
    if request.method == 'POST':
        Room.objects.filter(pk=pk).delete()
        messages.success(request, 'Room deleted.')
    return redirect('room_list')


# ──────────────────────────────────────────────────────────────
# CRUD: Time Slots
# ──────────────────────────────────────────────────────────────

@login_required
@admin_required
def timeslot_list(request):
    form = TimeSlotForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Time slot added successfully.')
        return redirect('timeslot_list')

    # Group slots by day for visual display
    slots_by_day = OrderedDict()
    for day_code, day_name in DAYS_OF_WEEK:
        slots_by_day[day_name] = TimeSlot.objects.filter(day=day_code).order_by('slot_number')

    return render(request, 'timeslot_list.html', {
        'form': form,
        'slots_by_day': slots_by_day,
        'all_slots': TimeSlot.objects.all(),
    })


@login_required
@admin_required
def timeslot_delete(request, pk):
    if request.method == 'POST':
        TimeSlot.objects.filter(pk=pk).delete()
        messages.success(request, 'Time slot deleted.')
    return redirect('timeslot_list')


# ──────────────────────────────────────────────────────────────
# CRUD: Faculty
# ──────────────────────────────────────────────────────────────

@login_required
@management_required
def faculty_list(request):
    form = FacultyForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Faculty member added successfully.')
        return redirect('faculty_list')

    faculty = Faculty.objects.select_related('department').all()

    # Filter by department
    dept_filter = request.GET.get('department')
    if dept_filter:
        faculty = faculty.filter(department_id=dept_filter)

    return render(request, 'faculty_list.html', {
        'form': form,
        'faculty_members': faculty,
        'departments': Department.objects.all(),
        'filter_department': dept_filter,
    })


@login_required
@management_required
def faculty_delete(request, pk):
    if request.method == 'POST':
        Faculty.objects.filter(pk=pk).delete()
        messages.success(request, 'Faculty member deleted.')
    return redirect('faculty_list')


# ──────────────────────────────────────────────────────────────
# CRUD: Subjects
# ──────────────────────────────────────────────────────────────

@login_required
@management_required
def subject_list(request):
    form = SubjectForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Subject added successfully.')
        return redirect('subject_list')

    subjects = Subject.objects.all()

    type_filter = request.GET.get('type')
    if type_filter:
        subjects = subjects.filter(subject_type=type_filter)

    return render(request, 'subject_list.html', {
        'form': form,
        'subjects': subjects,
        'filter_type': type_filter,
    })


@login_required
@management_required
def subject_delete(request, pk):
    if request.method == 'POST':
        Subject.objects.filter(pk=pk).delete()
        messages.success(request, 'Subject deleted.')
    return redirect('subject_list')


# ──────────────────────────────────────────────────────────────
# CRUD: Sections
# ──────────────────────────────────────────────────────────────

@login_required
@management_required
def section_list(request):
    form = SectionForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Section added successfully.')
        return redirect('section_list')

    sections = Section.objects.select_related(
        'department', 'program', 'academic_year'
    ).all()

    year_filter = request.GET.get('year')
    dept_filter = request.GET.get('department')
    if year_filter:
        sections = sections.filter(year_of_study=year_filter)
    if dept_filter:
        sections = sections.filter(department_id=dept_filter)

    return render(request, 'section_list.html', {
        'form': form,
        'sections': sections,
        'departments': Department.objects.all(),
        'years': YEAR_CHOICES,
        'filter_year': year_filter,
        'filter_department': dept_filter,
    })


@login_required
@management_required
def section_delete(request, pk):
    if request.method == 'POST':
        Section.objects.filter(pk=pk).delete()
        messages.success(request, 'Section deleted.')
    return redirect('section_list')


# ──────────────────────────────────────────────────────────────
# CRUD: Course Offerings
# ──────────────────────────────────────────────────────────────

@login_required
@management_required
def offering_list(request):
    form = CourseOfferingForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Course offering added successfully.')
        return redirect('offering_list')

    offerings = CourseOffering.objects.select_related(
        'subject', 'section__program', 'section__department'
    ).prefetch_related('faculty').all()

    year_filter = request.GET.get('year')
    dept_filter = request.GET.get('department')
    sec_filter = request.GET.get('section')
    if year_filter:
        offerings = offerings.filter(section__year_of_study=year_filter)
    if dept_filter:
        offerings = offerings.filter(section__department_id=dept_filter)
    if sec_filter:
        offerings = offerings.filter(section_id=sec_filter)

    return render(request, 'offering_list.html', {
        'form': form,
        'offerings': offerings,
        'departments': Department.objects.all(),
        'sections': Section.objects.all(),
        'years': YEAR_CHOICES,
        'filter_year': year_filter,
        'filter_department': dept_filter,
        'filter_section': sec_filter,
    })


@login_required
@management_required
def offering_delete(request, pk):
    if request.method == 'POST':
        CourseOffering.objects.filter(pk=pk).delete()
        messages.success(request, 'Course offering deleted.')
    return redirect('offering_list')


# ──────────────────────────────────────────────────────────────
# User Management
# ──────────────────────────────────────────────────────────────

@login_required
@admin_required
def user_list(request):
    profiles = UserProfile.objects.select_related(
        'user', 'department'
    ).order_by('role', 'user__username')

    return render(request, 'user_list.html', {
        'profiles': profiles,
    })


@login_required
@admin_required
def user_role_edit(request, pk):
    profile = get_object_or_404(UserProfile, pk=pk)
    form = UserProfileForm(request.POST or None, instance=profile)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, f'Role updated for {profile.user.username}.')
        return redirect('user_list')

    return render(request, 'user_role_edit.html', {
        'form': form,
        'profile': profile,
    })


# ──────────────────────────────────────────────────────────────
# API Endpoints
# ──────────────────────────────────────────────────────────────

def api_gen_progress(request):
    """Return current generation progress for the loader."""
    return JsonResponse({
        'running': GENERATION_STATE['running'],
        'generation': GENERATION_STATE['generation_num'],
        'fitness': round(GENERATION_STATE['fitness'] * 100, 1),
        'total': GENERATION_STATE['total_generations'],
        'terminate': GENERATION_STATE['terminate'],
    })


def api_stop_generation(request):
    """Signal the generator to stop."""
    GENERATION_STATE['terminate'] = True
    return redirect('dashboard')


# ──────────────────────────────────────────────────────────────
# Timetable PDF / Print Download
# ──────────────────────────────────────────────────────────────

@login_required
def timetable_download(request, pk):
    """Download a section timetable as PDF matching college format."""
    timetable = get_object_or_404(
        Timetable.objects.select_related(
            'section__program', 'section__department', 'academic_year'
        ),
        pk=pk
    )

    entries = TimetableEntry.objects.filter(
        timetable=timetable
    ).select_related(
        'course_offering__subject', 'time_slot', 'room', 'faculty'
    ).order_by('time_slot__day', 'time_slot__slot_number')

    grid = _build_timetable_grid(entries)

    slots = TimeSlot.objects.values(
        'slot_number', 'start_time', 'end_time', 'slot_type'
    ).distinct().order_by('slot_number')
    seen = set()
    unique_slots = []
    for s in slots:
        if s['slot_number'] not in seen:
            seen.add(s['slot_number'])
            unique_slots.append(s)

    days_with_data = [d for d in DAYS_OF_WEEK if d[0] in grid]

    # Build subject legend (unique subjects in this timetable)
    subjects_legend = []
    seen_subjects = set()
    for entry in entries:
        subj = entry.course_offering.subject
        if subj.id not in seen_subjects:
            seen_subjects.add(subj.id)
            def format_fac(f):
                if f.initials:
                    return f"{f.full_name} ({f.initials})"
                return f.full_name
                
            faculty_names = ', '.join(
                format_fac(f) for f in entry.course_offering.faculty.all()
            )
            subjects_legend.append({
                'short_name': subj.short_name,
                'name': subj.name,
                'code': subj.code,
                'type': subj.get_subject_type_display(),
                'category': 'PC' if subj.subject_type in ['THEORY', 'LAB'] else subj.get_subject_type_display(),
                'credits': subj.credits,
                'weekly_hours': subj.weekly_hours,
                'faculty': faculty_names,
            })

    context = {
        'timetable': timetable,
        'grid': grid,
        'slots': unique_slots,
        'days': days_with_data,
        'subjects_legend': subjects_legend,
    }

    fmt = request.GET.get('format', 'pdf')

    if fmt == 'html':
        return render(request, 'timetable_pdf.html', context)

    # PDF via xhtml2pdf
    try:
        from xhtml2pdf import pisa
        html_string = render_to_string('timetable_pdf.html', context, request=request)
        response = HttpResponse(content_type='application/pdf')
        filename = f'timetable_{timetable.section.label.replace(" ", "_")}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        pisa_status = pisa.CreatePDF(html_string, dest=response)
        if pisa_status.err:
            return render(request, 'timetable_pdf.html', context)
        return response
    except ImportError:
        # Fallback: serve as printable HTML page
        return render(request, 'timetable_pdf.html', context)


# ──────────────────────────────────────────────────────────────
# Error pages
# ──────────────────────────────────────────────────────────────

def error_404(request, exception):
    return render(request, 'errors/404.html', {}, status=404)


def error_500(request, *args, **kwargs):
    return render(request, 'errors/500.html', {}, status=500)
