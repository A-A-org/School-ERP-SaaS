from django.db.models import Count

from rest_framework import (
    generics,
    status,
)

from rest_framework.response import Response

from accounts.permissions import (
    IsSchoolStaff,
    ClassroomAccessPermission,
)

from .models import (
    ClassRoom,
    Exam,
)

from .serializers import (
    ClassRoomSerializer,
    ExamSerializer,
)


def classroom_queryset():

    return (
        ClassRoom.objects
        .select_related("school")
        .annotate(
            student_count=Count(
                "students",
                distinct=True
            ),
            teacher_count=Count(
                "teachers",
                distinct=True
            ),
            subject_count=Count(
                "subjects",
                distinct=True
            ),
            exam_count=Count(
                "exams",
                distinct=True
            ),
        )
    )


# ==========================
# Classrooms
# ==========================

class ClassRoomListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = (
        ClassRoomSerializer
    )

    permission_classes = [
        ClassroomAccessPermission
    ]


    def get_queryset(self):

        user = self.request.user

        queryset = classroom_queryset()


        if user.role == "OWNER":

            return queryset


        if not user.school_id:

            return ClassRoom.objects.none()


        return queryset.filter(
            school=user.school
        )


class ClassRoomDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = (
        ClassRoomSerializer
    )

    permission_classes = [
        ClassroomAccessPermission
    ]


    def get_queryset(self):

        user = self.request.user

        queryset = classroom_queryset()


        if user.role == "OWNER":

            return queryset


        if not user.school_id:

            return ClassRoom.objects.none()


        return queryset.filter(
            school=user.school
        )


    def destroy(
        self,
        request,
        *args,
        **kwargs
    ):

        classroom = self.get_object()


        # Important:
        # Never cascade-delete active school data
        if (
            classroom.students.exists()
            or classroom.teachers.exists()
            or classroom.subjects.exists()
            or classroom.exams.exists()
        ):

            return Response(
                {
                    "detail":
                    "This class cannot be deleted while it has students, teachers, subjects, or exams."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        return super().destroy(
            request,
            *args,
            **kwargs
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


        queryset = (
            Exam.objects
            .select_related(
                "classroom",
                "classroom__school"
            )
        )


        if user.role == "OWNER":

            return queryset


        if not user.school_id:

            return Exam.objects.none()


        return queryset.filter(
            classroom__school=user.school
        )