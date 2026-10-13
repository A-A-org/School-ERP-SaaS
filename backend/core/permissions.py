from rest_framework.permissions import BasePermission


ALL_ACTIONS = {
    'list',
    'retrieve',
    'create',
    'update',
    'partial_update',
    'destroy',
}

READ_ACTIONS = {
    'list',
    'retrieve',
}


class RoleBasedPermission(BasePermission):
    """
    Restrict API actions according to the user's role
    and the type of resource being accessed.
    """

    ROLE_PERMISSIONS = {
        'platform_owner': {
            'School': ALL_ACTIONS,
            'User': ALL_ACTIONS,
            'SchoolClass': ALL_ACTIONS,
            'Student': ALL_ACTIONS,
            'Employee': ALL_ACTIONS,
            'Fee': ALL_ACTIONS,
            'Attendance': ALL_ACTIONS,
        },

        'school_admin': {
            'School': READ_ACTIONS | {'update', 'partial_update'},
            'SchoolClass': ALL_ACTIONS,
            'Student': ALL_ACTIONS,
            'Employee': ALL_ACTIONS,
            'Fee': ALL_ACTIONS,
            'Attendance': ALL_ACTIONS,
        },

        'employee': {
            'SchoolClass': READ_ACTIONS,
            'Student': READ_ACTIONS,
           'Attendance': READ_ACTIONS | {'create'},
        },
    }

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        queryset = getattr(view, 'queryset', None)

        if queryset is None:
            return False

        model_name = queryset.model.__name__

        allowed_actions = self.ROLE_PERMISSIONS.get(
            user.role, {}
        ).get(model_name, set())

        return view.action in allowed_actions