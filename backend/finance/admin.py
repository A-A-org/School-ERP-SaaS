from django.contrib import admin

from .models import Fee



@admin.register(Fee)
class FeeAdmin(admin.ModelAdmin):

    list_display = (
        "student",
        "month",
        "year",
        "total_amount",
        "paid_amount",
        "remaining_amount",
        "status",
    )


    list_filter = (
        "status",
        "month",
        "year",
    )