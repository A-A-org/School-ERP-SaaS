from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):

    school_name = serializers.CharField(
        source="school.school_name",
        read_only=True
    )

    classroom_name = serializers.CharField(
        source="classroom.class_name",
        read_only=True
    )

    section = serializers.CharField(
        source="classroom.section",
        read_only=True
    )


    class Meta:
        model = Student

        fields = [
            "id",

            "first_name",
            "last_name",

            "admission_number",

            "date_of_birth",
            "gender",

            "phone",
            "address",

            "parent_name",
            "parent_phone",

            "school",
            "school_name",

            "classroom",
            "classroom_name",
            "section",

            "created_at",
        ]