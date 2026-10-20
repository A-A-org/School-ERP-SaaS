from rest_framework import serializers

from .models import School


class SchoolSerializer(serializers.ModelSerializer):

    student_count = serializers.SerializerMethodField()

    teacher_count = serializers.SerializerMethodField()

    class_count = serializers.SerializerMethodField()

    employee_count = serializers.SerializerMethodField()


    class Meta:

        model = School

        fields = [
            "id",

            "school_name",

            "address",

            "phone",

            "email",

            "create_date",

            "student_count",

            "teacher_count",

            "class_count",

            "employee_count",
        ]

        read_only_fields = [
            "id",
            "create_date",

            "student_count",
            "teacher_count",
            "class_count",
            "employee_count",
        ]


    def get_student_count(
        self,
        obj
    ):

        from students.models import Student

        return Student.objects.filter(
            school=obj
        ).count()


    def get_teacher_count(
        self,
        obj
    ):

        from accounts.models import User

        return User.objects.filter(
            school=obj,
            role="TEACHER"
        ).count()


    def get_class_count(
        self,
        obj
    ):

        from academics.models import ClassRoom

        return ClassRoom.objects.filter(
            school=obj
        ).count()


    def get_employee_count(
        self,
        obj
    ):

        from employees.models import Employee

        return Employee.objects.filter(
            school=obj
        ).count()


    def validate_school_name(
        self,
        value
    ):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "School name is required."
            )


        queryset = School.objects.filter(
            school_name__iexact=value
        )


        if self.instance:

            queryset = queryset.exclude(
                pk=self.instance.pk
            )


        if queryset.exists():

            raise serializers.ValidationError(
                "A school with this name already exists."
            )


        return value