from rest_framework import viewsets

from .models import School, User, SchoolClass, Student, Employee, Fee, Attendance, Subject, Exam, Grade
from .permissions import RoleBasedPermission

from .serializers import (
    SchoolSerializer,
    UserSerializer,
    SchoolClassSerializer,
    StudentSerializer,
    EmployeeSerializer,
    FeeSerializer,
    AttendanceSerializer,
    SubjectSerializer,
    ExamSerializer,
    GradeSerializer,
    GradeReportSerializer,
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

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return User.objects.all()

        if user.role == 'school_admin' and user.school_id:
            return User.objects.filter(
                school=user.school,
                role='employee'
            )

        return User.objects.none()


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



class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == "platform_owner":
            return Subject.objects.all()
        if user.school_id:
            return Subject.objects.filter(school_id=user.school_id)
        return Subject.objects.none()


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == "platform_owner":
            return Exam.objects.all()
        if user.school_id:
            return Exam.objects.filter(school_id=user.school_id)
        return Exam.objects.none()


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == "platform_owner":
            return Grade.objects.select_related("exam", "student")
        if user.school_id:
            return Grade.objects.filter(
                exam__school_id=user.school_id
            ).select_related("exam", "student")
        return Grade.objects.none()


class ReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Grade.objects.select_related(
        "exam", "exam__subject", "exam__school_class", "student"
    )
    serializer_class = GradeReportSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        if user.role != "platform_owner":
            if not user.school_id:
                return queryset.none()
            queryset = queryset.filter(exam__school_id=user.school_id)

        exam_id = self.request.query_params.get("exam_id")
        student_id = self.request.query_params.get("student_id")
        class_id = self.request.query_params.get("class_id")

        if exam_id and exam_id.isdigit():
            queryset = queryset.filter(exam_id=int(exam_id))
        if student_id and student_id.isdigit():
            queryset = queryset.filter(student_id=int(student_id))
        if class_id and class_id.isdigit():
            queryset = queryset.filter(exam__school_class_id=int(class_id))

        return queryset


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
