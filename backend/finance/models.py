from django.db import models
from students.models import Student


class Fee(models.Model):

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="fees"
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_date = models.DateField()

    STATUS_CHOICES = [
        ("PAID", "Paid"),
        ("PENDING", "Pending"),
        ("PARTIAL", "Partial"),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES
    )


    def __str__(self):
        return f"{self.student} - {self.amount}"