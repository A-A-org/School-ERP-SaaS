from rest_framework.permissions import BasePermission, SAFE_METHODS
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

class StudentAccessPermission(BasePermission):
    """
    All school staff can view students.
    Only OWNER and ADMIN can create, update, or delete students.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return request.user.role in [
                "OWNER",
                "ADMIN",
                "ACCOUNTANT",
                "TEACHER",
                "EMPLOYEE",
            ]

        return request.user.role in [
            "OWNER",
            "ADMIN",
        ]
class TeacherAccessPermission(BasePermission):
     """
     All authenticated school staff can view teachers.
     Only OWNER and ADMIN can create, update, or delete teachers.
     """
     def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return request.user.role in [
                "OWNER",
                "ADMIN",
                "ACCOUNTANT",
                "TEACHER",
                "EMPLOYEE",
            ]

        return request.user.role in [
            "OWNER",
            "ADMIN",
        ]


class ClassroomAccessPermission(BasePermission):
    """
    All authenticated school staff can view classes.
    Only OWNER and ADMIN can create, update, or delete classes.
    """

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return request.user.role in [
                "OWNER",
                "ADMIN",
                "ACCOUNTANT",
                "TEACHER",
                "EMPLOYEE",
            ]

        return request.user.role in [
            "OWNER",
            "ADMIN",
        ]
class AttendanceAccessPermission(BasePermission):
    """
    School staff can view attendance.
    OWNER, ADMIN and TEACHER can create/update attendance.
    """

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return request.user.role in [
                "OWNER",
                "ADMIN",
                "ACCOUNTANT",
                "TEACHER",
                "EMPLOYEE",
            ]

        return request.user.role in [
            "OWNER",
            "ADMIN",
            "TEACHER",
        ]