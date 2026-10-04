from django.db import models
from schools.models import School


class ClassRoom(models.Model):

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="classes"
    )

    class_name = models.CharField(
        max_length=100
    )

    section = models.CharField(
        max_length=50
    )


    def __str__(self):
        return f"{self.class_name} - {self.section}"



class Subject(models.Model):

    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.CASCADE,
        related_name="subjects"
    )

    subject_name = models.CharField(
        max_length=100
    )


    def __str__(self):
        return self.subject_name


class Exam(models.Model):

    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.CASCADE,
        related_name="exams"
    )

    exam_name = models.CharField(
        max_length=100
    )

    exam_date = models.DateField()


    def __str__(self):
        return self.exam_name


class Result(models.Model):

    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name="results"
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="results"
    )

    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name="results"
    )

    marks = models.DecimalField(
        max_digits=5,
        decimal_places=2
    )

    grade = models.CharField(
        max_length=5
    )


    def __str__(self):
        return f"{self.student} - {self.subject}"