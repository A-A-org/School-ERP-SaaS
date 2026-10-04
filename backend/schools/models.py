from django.db import models


class School(models.Model):

    school_name = models.CharField(
        max_length=200
    )

    address = models.TextField()

    phone = models.CharField(
        max_length=20
    )

    email = models.EmailField()

    create_date = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return self.school_name
