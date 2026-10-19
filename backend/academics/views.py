from rest_framework import generics

from accounts.permissions import IsSchoolStaff

from .models import ClassRoom, Exam
from .serializers import (
    ClassRoomSerializer,
    ExamSerializer,
)


# ==========================
# Classrooms
# ==========================

class ClassRoomListView(
    generics.ListAPIView
):

    serializer_class = ClassRoomSerializer

    permission_classes = [
        IsSchoolStaff
    ]


    def get_queryset(self):

        user = self.request.user

        # Platform owner can see all classes
        if user.role == "OWNER":

            return ClassRoom.objects.all()


        # School users can only see
        # classes from their own school
        return ClassRoom.objects.filter(
            school=user.school
        )


# ==========================
# Exams
# ==========================

class ExamListView(
    generics.ListAPIView
):

    serializer_class = ExamSerializer

    permission_classes = [
        IsSchoolStaff
    ]


    def get_queryset(self):

        user = self.request.user

        # Platform owner can see all exams
        if user.role == "OWNER":

            return Exam.objects.all()


        # School users can only see exams
        # from their own school
        return Exam.objects.filter(
            classroom__school=user.school
        )