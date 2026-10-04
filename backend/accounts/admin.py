from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    fieldsets = UserAdmin.fieldsets + (
        (
            "ERP Information",
            {
                "fields": (
                    "role",
                    "full_name",
                    "school",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "ERP Information",
            {
                "fields": (
                    "role",
                    "full_name",
                    "school",
                )
            },
        ),
    )

    list_display = (
        "username",
        "full_name",
        "role",
        "school",
        "is_active",
    )