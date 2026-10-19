from rest_framework import serializers

from .models import ClassRoom, Exam


class ClassRoomSerializer(serializers.ModelSerializer):

    school_name = serializers.CharField(
        source="school.school_name",
        read_only=True
    )

    class Meta:
        model = ClassRoom

        fields = [
            "id",
            "school",
            "school_name",
            "class_name",
            "section",
        ]


class ExamSerializer(serializers.ModelSerializer):

    classroom_name = serializers.CharField(
        source="classroom.__str__",
        read_only=True
    )

    class Meta:
        model = Exam

        fields = [
            "id",
            "classroom",
            "classroom_name",
            "exam_name",
            "exam_date",
        ]