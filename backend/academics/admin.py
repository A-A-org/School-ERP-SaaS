from django.contrib import admin
from .models import ClassRoom, Subject, Exam, Result


admin.site.register(ClassRoom)
admin.site.register(Subject)
admin.site.register(Exam)
admin.site.register(Result)