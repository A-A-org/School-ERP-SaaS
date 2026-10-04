from django.db import models
from schools.models import School


class Employee(models.Model):

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="employees"
    )

    name = models.CharField(
        max_length=100
    )

    email = models.EmailField()

    phone = models.CharField(
        max_length=20
    )

    position = models.CharField(
        max_length=100
    )


    def __str__(self):
        return self.name