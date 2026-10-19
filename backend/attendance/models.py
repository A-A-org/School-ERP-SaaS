from django.db import models
from students.models import Student
from accounts.models import User


class Attendance(models.Model):

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="attendance_records"
    )


    marked_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="attendance_marked"
    )


    date = models.DateField()


    STATUS_CHOICES = [
        ("PRESENT", "Present"),
        ("ABSENT", "Absent"),
        ("LATE", "Late"),
    ]


    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    class Meta:
        unique_together = (
            "student",
            "date",
        )


    def __str__(self):
        return f"{self.student} - {self.date}"