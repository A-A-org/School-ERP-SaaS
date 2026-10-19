from django.contrib.auth.models import AbstractUser
from django.db import models
from academics.models import ClassRoom


class User(AbstractUser):

    ROLE_CHOICES = (
        ('OWNER', 'Platform Owner'),
        ('ADMIN', 'School Admin'),
        ('ACCOUNTANT', 'Accountant'),
        ('TEACHER', 'Teacher'),
        ('EMPLOYEE', 'Employee'),
    )


    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='EMPLOYEE'
    )


    full_name = models.CharField(
        max_length=100
    )


    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="users"
    )


    # Teacher classroom assignment
    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teachers"
    )


    def __str__(self):
        return self.username