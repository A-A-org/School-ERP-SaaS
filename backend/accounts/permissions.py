from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Allow access only for Platform Owner
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "OWNER"
        )


class IsSchoolAdmin(BasePermission):
    """
    Allow access only for School Admin
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsAccountant(BasePermission):
    """
    Allow access only for Accountant
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ACCOUNTANT"
        )


class IsTeacher(BasePermission):
    """
    Allow access only for Teacher
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "TEACHER"
        )

class IsSchoolStaff(BasePermission):
    """
    Allow access for all authenticated school users
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in [
                "OWNER",
                "ADMIN",
                "ACCOUNTANT",
                "TEACHER",
                "EMPLOYEE",
            ]
        )