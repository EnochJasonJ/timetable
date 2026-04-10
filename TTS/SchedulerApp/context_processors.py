from .models import AcademicYear, UserProfile


def global_context(request):
    """Inject role info and academic context into all templates."""
    ctx = {
        'active_academic_year': None,
        'user_role': 'STUDENT',
        'user_role_display': 'Student',
        'user_department': None,
        'user_profile': None,
        'can_manage': False,
        'is_admin': False,
    }

    try:
        ctx['active_academic_year'] = AcademicYear.objects.filter(
            is_current=True
        ).first()
    except Exception:
        pass

    if request.user.is_authenticated:
        try:
            profile = request.user.profile
            ctx['user_profile'] = profile
            ctx['user_role'] = profile.role
            ctx['user_role_display'] = profile.get_role_display()
            ctx['user_department'] = profile.department
            ctx['can_manage'] = profile.can_manage_timetable
            ctx['is_admin'] = profile.is_super_admin
        except UserProfile.DoesNotExist:
            # Superuser without profile — treat as super admin
            if request.user.is_superuser:
                ctx['user_role'] = 'SUPER_ADMIN'
                ctx['user_role_display'] = 'Super Admin'
                ctx['can_manage'] = True
                ctx['is_admin'] = True

    return ctx
