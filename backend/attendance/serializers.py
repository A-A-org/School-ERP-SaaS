from rest_framework import serializers

from .models import Attendance
from students.models import Student


class AttendanceSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.__str__",
        read_only=True
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True
    )

    classroom = serializers.IntegerField(
        source="student.classroom_id",
        read_only=True
    )

    classroom_name = serializers.CharField(
        source="student.classroom.__str__",
        read_only=True
    )

    school_name = serializers.CharField(
        source="student.school.school_name",
        read_only=True
    )

    marked_by_name = serializers.CharField(
        source="marked_by.username",
        read_only=True
    )


    class Meta:
        model = Attendance

        fields = [
            "id",
            "student",
            "student_name",
            "admission_number",
            "classroom",
            "classroom_name",
            "school_name",
            "marked_by",
            "marked_by_name",
            "date",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "marked_by",
            "created_at",
        ]


    def validate(self, attrs):

        request = self.context.get("request")

        if not request:
            return attrs


        student = attrs.get(
            "student",
            getattr(
                self.instance,
                "student",
                None
            )
        )


        if student is None:
            return attrs


        user = request.user


        if user.role == "OWNER":
            return attrs


        if user.role == "TEACHER":

            if not user.classroom_id:
                raise serializers.ValidationError(
                    {
                        "student":
                        "Your teacher account is not assigned to a classroom."
                    }
                )

            if student.classroom_id != user.classroom_id:
                raise serializers.ValidationError(
                    {
                        "student":
                        "You can only mark attendance for students in your assigned classroom."
                    }
                )

            return attrs


        if not user.school_id:

            raise serializers.ValidationError(
                {
                    "student":
                    "Your account is not assigned to a school."
                }
            )


        if student.school_id != user.school_id:

            raise serializers.ValidationError(
                {
                    "student":
                    "You cannot access students from another school."
                }
            )


        return attrs


class BulkAttendanceRecordSerializer(serializers.Serializer):

    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all()
    )

    status = serializers.ChoiceField(
        choices=[
            "PRESENT",
            "ABSENT",
            "LATE",
            "UNMARKED",
        ]
    )


class BulkAttendanceSerializer(serializers.Serializer):

    classroom = serializers.IntegerField()

    date = serializers.DateField()

    records = BulkAttendanceRecordSerializer(
        many=True
    )


    def validate_records(self, records):

        student_ids = [
            record["student"].id
            for record in records
        ]


        if len(student_ids) != len(set(student_ids)):

            raise serializers.ValidationError(
                "A student cannot appear more than once."
            )


        return records