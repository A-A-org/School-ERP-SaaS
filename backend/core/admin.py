from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import School, User, SchoolClass, Student, Employee, Fee, Attendance


class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('School info', {'fields': ('full_name', 'role', 'school')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('School info', {'fields': ('full_name', 'role', 'school')}),
    )
    list_display = ('username', 'full_name', 'role', 'school', 'is_staff')


admin.site.register(User, CustomUserAdmin)
admin.site.register(School)
admin.site.register(SchoolClass)
admin.site.register(Student)
admin.site.register(Employee)
admin.site.register(Fee)
admin.site.register(Attendance)