from django.urls import path

from .views import (
    AttendanceListCreateView,
    AttendanceDetailView,
    BulkAttendanceView,
    StudentAttendanceReportView,
    ClassAttendanceReportView,
    MonthlyAttendanceReportView,
)


urlpatterns = [

    path(
        "",
        AttendanceListCreateView.as_view(),
        name="attendance-list"
    ),

    path(
        "bulk/",
        BulkAttendanceView.as_view(),
        name="attendance-bulk"
    ),

    path(
        "<int:pk>/",
        AttendanceDetailView.as_view(),
        name="attendance-detail"
    ),

    path(
        "report/<int:student_id>/",
        StudentAttendanceReportView.as_view(),
        name="student-attendance-report"
    ),

    path(
        "class-report/<int:classroom_id>/",
        ClassAttendanceReportView.as_view(),
        name="class-attendance-report"
    ),

    path(
        "monthly-report/<int:classroom_id>/",
        MonthlyAttendanceReportView.as_view(),
        name="monthly-attendance-report"
    ),

]