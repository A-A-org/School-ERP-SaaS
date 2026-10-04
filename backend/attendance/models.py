from django.db import models
from students.models import Student
from employees.models import Employee


class Attendance(models.Model):

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="attendance_records"
    )

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
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


    def __str__(self):
        return f"{self.student} - {self.date}"