from django.db import models
from accounts.models import User


class AuditLog(models.Model):


    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="audit_logs"
    )


    action = models.CharField(
        max_length=100
    )


    module = models.CharField(
        max_length=100,
        default=""
    )


    object_id = models.IntegerField(
        null=True,
        blank=True
    )


    description = models.TextField()


    old_data = models.JSONField(
        null=True,
        blank=True
    )


    new_data = models.JSONField(
        null=True,
        blank=True
    )


    created_date = models.DateTimeField(
        auto_now_add=True
    )



    def __str__(self):

        return f"{self.user} - {self.action}"