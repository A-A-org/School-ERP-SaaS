from django.db import models
from schools.models import School
from academics.models import ClassRoom


class Student(models.Model):

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="students"
    )

    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.CASCADE,
        related_name="students"
    )

    first_name = models.CharField(
        max_length=100
    )

    last_name = models.CharField(
        max_length=100
    )

    admission_number = models.CharField(
        max_length=50,
        unique=True
    )

    date_of_birth = models.DateField()

    gender = models.CharField(
        max_length=20
    )

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    address = models.TextField(
        blank=True
    )

    parent_name = models.CharField(
        max_length=100
    )

    parent_phone = models.CharField(
        max_length=20
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return f"{self.first_name} {self.last_name}"