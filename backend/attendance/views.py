from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import (
    generics,
    status,
)

from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Attendance

from .serializers import (
    AttendanceSerializer,
    BulkAttendanceSerializer,
)

from .reports import (
    student_attendance_report,
    class_attendance_report,
    monthly_attendance_report,
)

from accounts.permissions import (
    IsSchoolStaff,
    AttendanceAccessPermission,
)

from academics.models import ClassRoom
from students.models import Student


def accessible_classrooms(user):

    queryset = ClassRoom.objects.all()


    if user.role == "OWNER":
        return queryset


    if user.role == "TEACHER":

        if not user.classroom_id:
            return queryset.none()

        return queryset.filter(
            id=user.classroom_id
        )


    if not user.school_id:
        return queryset.none()


    return queryset.filter(
        school=user.school
    )


def accessible_students(user):

    queryset = Student.objects.all()


    if user.role == "OWNER":
        return queryset


    if user.role == "TEACHER":

        if not user.classroom_id:
            return queryset.none()

        return queryset.filter(
            classroom_id=user.classroom_id
        )


    if not user.school_id:
        return queryset.none()


    return queryset.filter(
        school=user.school
    )


def attendance_queryset(user):

    queryset = (
        Attendance.objects
        .select_related(
            "student",
            "student__school",
            "student__classroom",
            "marked_by",
        )
    )


    if user.role == "OWNER":
        return queryset


    if user.role == "TEACHER":

        if not user.classroom_id:
            return queryset.none()

        return queryset.filter(
            student__classroom_id=user.classroom_id
        )


    if not user.school_id:
        return queryset.none()


    return queryset.filter(
        student__school=user.school
    )


# ==========================
# Attendance List / Create
# ==========================

class AttendanceListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = AttendanceSerializer

    permission_classes = [
        AttendanceAccessPermission
    ]


    def get_queryset(self):

        queryset = attendance_queryset(
            self.request.user
        )


        classroom = (
            self.request
            .query_params
            .get("classroom")
        )

        attendance_date = (
            self.request
            .query_params
            .get("date")
        )

        student = (
            self.request
            .query_params
            .get("student")
        )


        if classroom:
            queryset = queryset.filter(
                student__classroom_id=classroom
            )


        if attendance_date:
            queryset = queryset.filter(
                date=attendance_date
            )


        if student:
            queryset = queryset.filter(
                student_id=student
            )


        return queryset.order_by(
            "-date",
            "student__first_name",
            "student__last_name",
        )


    def perform_create(
        self,
        serializer
    ):

        serializer.save(
            marked_by=self.request.user
        )


# ==========================
# Attendance Detail
# ==========================

class AttendanceDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = AttendanceSerializer

    permission_classes = [
        AttendanceAccessPermission
    ]


    def get_queryset(self):

        return attendance_queryset(
            self.request.user
        )


    def perform_update(
        self,
        serializer
    ):

        serializer.save(
            marked_by=self.request.user
        )


# ==========================
# Bulk Attendance
# ==========================

class BulkAttendanceView(APIView):

    permission_classes = [
        AttendanceAccessPermission
    ]


    @transaction.atomic
    def post(self, request):

        serializer = BulkAttendanceSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )


        classroom_id = (
            serializer.validated_data[
                "classroom"
            ]
        )

        attendance_date = (
            serializer.validated_data[
                "date"
            ]
        )

        records = (
            serializer.validated_data[
                "records"
            ]
        )


        classroom = get_object_or_404(
            accessible_classrooms(
                request.user
            ),
            id=classroom_id
        )


        allowed_students = Student.objects.filter(
            classroom=classroom
        )


        allowed_student_ids = set(
            allowed_students.values_list(
                "id",
                flat=True
            )
        )


        for record in records:

            student = record["student"]

            attendance_status = (
                record["status"]
            )


            if student.id not in allowed_student_ids:

                return Response(
                    {
                        "detail":
                        "One or more students do not belong to the selected classroom."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            if attendance_status == "UNMARKED":

                Attendance.objects.filter(
                    student=student,
                    date=attendance_date
                ).delete()

                continue


            Attendance.objects.update_or_create(
                student=student,
                date=attendance_date,
                defaults={
                    "status":
                    attendance_status,

                    "marked_by":
                    request.user,
                }
            )


        updated_records = (
            attendance_queryset(
                request.user
            )
            .filter(
                student__classroom=classroom,
                date=attendance_date
            )
            .order_by(
                "student__first_name",
                "student__last_name",
            )
        )


        return Response(
            AttendanceSerializer(
                updated_records,
                many=True,
                context={
                    "request": request
                }
            ).data
        )


# ==========================
# Student Report
# ==========================

class StudentAttendanceReportView(APIView):

    permission_classes = [
        IsSchoolStaff
    ]


    def get(
        self,
        request,
        student_id
    ):

        student = get_object_or_404(
            accessible_students(
                request.user
            ),
            id=student_id
        )


        data = student_attendance_report(
            student.id
        )


        return Response(data)


# ==========================
# Class Report
# ==========================

class ClassAttendanceReportView(APIView):

    permission_classes = [
        IsSchoolStaff
    ]


    def get(
        self,
        request,
        classroom_id
    ):

        classroom = get_object_or_404(
            accessible_classrooms(
                request.user
            ),
            id=classroom_id
        )


        attendance_date = (
            request.query_params.get(
                "date"
            )
        )


        if not attendance_date:

            return Response(
                {
                    "error":
                    "Date is required"
                },
                status=400
            )


        data = class_attendance_report(
            classroom.id,
            attendance_date
        )


        return Response(data)


# ==========================
# Monthly Report
# ==========================

class MonthlyAttendanceReportView(APIView):

    permission_classes = [
        IsSchoolStaff
    ]


    def get(
        self,
        request,
        classroom_id
    ):

        classroom = get_object_or_404(
            accessible_classrooms(
                request.user
            ),
            id=classroom_id
        )


        month = request.query_params.get(
            "month"
        )

        year = request.query_params.get(
            "year"
        )


        if not month or not year:

            return Response(
                {
                    "error":
                    "Month and year are required"
                },
                status=400
            )


        try:

            month_number = int(month)
            year_number = int(year)


            if month_number < 1 or month_number > 12:
                raise ValueError


        except ValueError:

            return Response(
                {
                    "error":
                    "Invalid month or year"
                },
                status=400
            )


        data = monthly_attendance_report(
            classroom.id,
            month_number,
            year_number
        )


        return Response(data)