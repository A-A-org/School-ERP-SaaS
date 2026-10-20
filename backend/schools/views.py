from rest_framework import generics
from rest_framework.exceptions import ValidationError

from accounts.permissions import SchoolAccessPermission

from .models import School
from .serializers import SchoolSerializer


class SchoolListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = SchoolSerializer

    permission_classes = [
        SchoolAccessPermission
    ]


    def get_queryset(self):

        user = self.request.user


        if user.role == "OWNER":

            return School.objects.all().order_by(
                "school_name"
            )


        if not user.school_id:

            return School.objects.none()


        return School.objects.filter(
            id=user.school_id
        )


class SchoolDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = SchoolSerializer

    permission_classes = [
        SchoolAccessPermission
    ]


    def get_queryset(self):

        user = self.request.user


        if user.role == "OWNER":

            return School.objects.all()


        if not user.school_id:

            return School.objects.none()


        return School.objects.filter(
            id=user.school_id
        )


    def perform_destroy(
        self,
        instance
    ):

        from accounts.models import User
        from academics.models import ClassRoom
        from employees.models import Employee
        from students.models import Student


        students = Student.objects.filter(
            school=instance
        ).count()


        users = User.objects.filter(
            school=instance
        ).count()


        classes = ClassRoom.objects.filter(
            school=instance
        ).count()


        employees = Employee.objects.filter(
            school=instance
        ).count()


        if (
            students > 0
            or users > 0
            or classes > 0
            or employees > 0
        ):

            raise ValidationError(
                {
                    "detail": (
                        "This school cannot be deleted "
                        "while it still has students, "
                        "users, classes or employees."
                    )
                }
            )


        instance.delete()