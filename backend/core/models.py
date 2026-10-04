from django.contrib.auth.models import AbstractUser
from django.db import models


class School(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_CHOICES = [
        ('platform_owner', 'Platform Owner'),
        ('school_admin', 'School Admin'),
        ('employee', 'Employee'),
    ]

    full_name = models.CharField(max_length=200, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='users')

    def __str__(self):
        return self.username


class SchoolClass(models.Model):
    name = models.CharField(max_length=100)
    section = models.CharField(max_length=50, blank=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classes')

    def __str__(self):
        return f"{self.name} {self.section}"


class Student(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=30, blank=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Employee(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    position = models.CharField(max_length=100, blank=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='employees')

    def __str__(self):
        return self.name


class Fee(models.Model):
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('unpaid', 'Unpaid'),
    ]

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unpaid')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fees')

    def __str__(self):
        return f"{self.student} - {self.amount}"


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
    ]

    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='present')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendances')
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances')

    def __str__(self):
        return f"{self.student} - {self.date} - {self.status}"