from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from students.models import Student
from accounts.models import User


class Fee(models.Model):

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="fees"
    )

    month = models.CharField(
        max_length=20
    )

    year = models.IntegerField()

    # Monthly fee amount
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))]
    )

    # Previous unpaid balance from old month
    previous_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal("0.00"))]
    )

    # Monthly fee + previous balance
    total_payable = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # Total amount paid
    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal("0.00"))]
    )

    # Remaining amount
    remaining_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    STATUS_CHOICES = [
        ("PAID", "Paid"),
        ("PARTIAL", "Partial"),
        ("PENDING", "Pending"),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="fees_created"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        ordering = ["-year", "-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["student", "month", "year"],
                name="unique_student_fee_per_month"
            )
        ]

    def save(self, *args, **kwargs):

        # Calculate total amount the student must pay
        self.total_payable = (
            self.total_amount + self.previous_balance
        )

        # Calculate remaining amount
        self.remaining_amount = (
            self.total_payable - self.paid_amount
        )

        # Prevent negative remaining balance
        if self.remaining_amount <= 0:

            self.remaining_amount = Decimal("0.00")

            self.status = "PAID"

        elif self.paid_amount > 0:

            self.status = "PARTIAL"

        else:

            self.status = "PENDING"

        super().save(*args, **kwargs)

    def __str__(self):

        return f"{self.student} - {self.month} {self.year}"


class Payment(models.Model):

    fee = models.ForeignKey(
        Fee,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"))
        ]
    )

    PAYMENT_METHODS = [
        ("CASH", "Cash"),
        ("BANK", "Bank Transfer"),
        ("ONLINE", "Online"),
    ]

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default="CASH"
    )

    payment_date = models.DateField(
        auto_now_add=True
    )

    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="payments_received"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return f"{self.fee.student} - {self.amount}"


# ==========================
# Employee Salary
# ==========================

from employees.models import Employee



class Salary(models.Model):


    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="salaries"
    )


    month = models.CharField(
        max_length=20
    )


    year = models.IntegerField()



    basic_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )


    allowance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )


    deduction = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )


    net_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )


    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )


    remaining_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )



    STATUS_CHOICES = [

        ("PAID","Paid"),

        ("PARTIAL","Partial"),

        ("PENDING","Pending"),

    ]


    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )



    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="salary_created"
    )



    created_at = models.DateTimeField(
        auto_now_add=True
    )



    def save(self,*args,**kwargs):


        self.net_salary = (
            self.basic_salary
            +
            self.allowance
            -
            self.deduction
        )


        self.remaining_amount = (
            self.net_salary
            -
            self.paid_amount
        )


        if self.remaining_amount <= 0:

            self.status = "PAID"


        elif self.paid_amount > 0:

            self.status = "PARTIAL"


        else:

            self.status = "PENDING"



        super().save(
            *args,
            **kwargs
        )



    def __str__(self):

        return (
            f"{self.employee} - "
            f"{self.month} {self.year}"
        )

        # ==========================
# Salary Payment History
# ==========================

class SalaryPayment(models.Model):


    salary = models.ForeignKey(
        Salary,
        on_delete=models.CASCADE,
        related_name="payments"
    )


    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )


    PAYMENT_METHODS = [

        ("CASH", "Cash"),

        ("BANK", "Bank Transfer"),

        ("ONLINE", "Online"),

    ]


    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default="CASH"
    )


    payment_date = models.DateField(
        auto_now_add=True
    )


    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="salary_payments_received"
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )



    def save(self, *args, **kwargs):

        super().save(
            *args,
            **kwargs
        )


        salary = self.salary


        total_paid = sum(
            payment.amount
            for payment in salary.payments.all()
        )


        salary.paid_amount = total_paid


        salary.save()



    def __str__(self):

        return (
            f"{self.salary.employee} - "
            f"{self.amount}"
        )