from django.db import models
from accounts.models import User


class Notification(models.Model):

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )


    title = models.CharField(
        max_length=200
    )


    message = models.TextField()


    notification_type = models.CharField(
        max_length=50
    )


    is_read = models.BooleanField(
        default=False
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return f"{self.recipient} - {self.title}"