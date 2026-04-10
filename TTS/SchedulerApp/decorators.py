from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages
from .models import UserProfile


def get_user_profile(user):
    """Get user profile, treating superusers without profiles as super admins."""
    if not user.is_authenticated:
        return None
    try:
        return user.profile
    except UserProfile.DoesNotExist:
        if user.is_superuser:
            # Create a virtual profile object for superusers
            profile = UserProfile(user=user, role='SUPER_ADMIN')
            return profile
        return None


def role_required(*roles):
    """
    Decorator that restricts view access to users with specific roles.
    Usage: @role_required('SUPER_ADMIN', 'TIMETABLE_ADMIN')
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('login')

            profile = get_user_profile(request.user)
            if profile and profile.role in roles:
                return view_func(request, *args, **kwargs)

            messages.error(
                request,
                'You do not have permission to access this page.'
            )
            return redirect('dashboard')
        return _wrapped
    return decorator


def admin_required(view_func):
    """Shortcut: only SUPER_ADMIN and TIMETABLE_ADMIN."""
    return role_required('SUPER_ADMIN', 'TIMETABLE_ADMIN')(view_func)


def management_required(view_func):
    """Shortcut: SUPER_ADMIN, TIMETABLE_ADMIN, or HOD."""
    return role_required('SUPER_ADMIN', 'TIMETABLE_ADMIN', 'HOD')(view_func)


def staff_required(view_func):
    """Shortcut: any staff role (not student)."""
    return role_required(
        'SUPER_ADMIN', 'TIMETABLE_ADMIN', 'HOD', 'FACULTY'
    )(view_func)
