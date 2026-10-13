from rest_framework import viewsets

from .models import School, User, SchoolClass, Student, Employee, Fee, Attendance
from .permissions import RoleBasedPermission

from .serializers import (
    SchoolSerializer,
    UserSerializer,
    SchoolClassSerializer,
    StudentSerializer,
    EmployeeSerializer,
    FeeSerializer,
    AttendanceSerializer,
)



class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return School.objects.all()

        if user.school_id:
            return School.objects.filter(id=user.school_id)

        return School.objects.none()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [RoleBasedPermission]



class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.all()
    serializer_class = SchoolClassSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return SchoolClass.objects.all()

        return SchoolClass.objects.filter(school=user.school)


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return Student.objects.all()

        return Student.objects.filter(school=user.school)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return Employee.objects.all()

        if user.school_id:
            return Employee.objects.filter(school=user.school)

        return Employee.objects.none()


class FeeViewSet(viewsets.ModelViewSet):
    queryset = Fee.objects.all()
    serializer_class = FeeSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return Fee.objects.all()

        if user.school_id:
            return Fee.objects.filter(student__school=user.school)

        return Fee.objects.none()


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return Attendance.objects.all()

        if user.school_id:
            return Attendance.objects.filter(student__school=user.school)

        return Attendance.objects.none()