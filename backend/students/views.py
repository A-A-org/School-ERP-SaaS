from rest_framework import generics
from .models import Student
from .serializers import StudentSerializer
from accounts.permissions import StudentAccessPermission

class StudentListCreateView(generics.ListCreateAPIView):

    serializer_class = StudentSerializer

    permission_classes = [StudentAccessPermission]


    def get_queryset(self):

        user = self.request.user

        # Platform Owner can see all students
        if user.role == "OWNER":
            return Student.objects.all()

        # Other users see only their school's students
        return Student.objects.filter(
            school=user.school
        )


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = StudentSerializer

    permission_classes = [StudentAccessPermission]


    def get_queryset(self):

        user = self.request.user

        # Platform Owner can manage all students
        if user.role == "OWNER":
            return Student.objects.all()

        # School users only manage their own school students
        return Student.objects.filter(
            school=user.school
        )