from rest_framework import permissions

class IsAdminOrHOD(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if hasattr(request.user, 'profile'):
            return request.user.profile.role in ['SUPER_ADMIN', 'TIMETABLE_ADMIN', 'HOD']
        return request.user.is_superuser

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if hasattr(request.user, 'profile'):
            return request.user.profile.role in ['SUPER_ADMIN', 'TIMETABLE_ADMIN']
        return request.user.is_superuser
