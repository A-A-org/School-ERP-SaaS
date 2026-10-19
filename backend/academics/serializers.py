from rest_framework import serializers

from .models import ClassRoom, Exam


class ClassRoomSerializer(serializers.ModelSerializer):

    school_name = serializers.CharField(
        source="school.school_name",
        read_only=True
    )

    student_count = serializers.IntegerField(
        read_only=True
    )

    teacher_count = serializers.IntegerField(
        read_only=True
    )

    subject_count = serializers.IntegerField(
        read_only=True
    )

    exam_count = serializers.IntegerField(
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
            "student_count",
            "teacher_count",
            "subject_count",
            "exam_count",
        ]


    def validate(self, attrs):

        request = self.context.get("request")


        school = attrs.get(
            "school",
            getattr(
                self.instance,
                "school",
                None
            )
        )


        class_name = attrs.get(
            "class_name",
            getattr(
                self.instance,
                "class_name",
                ""
            )
        )


        section = attrs.get(
            "section",
            getattr(
                self.instance,
                "section",
                ""
            )
        )


        if class_name:
            class_name = class_name.strip()
            attrs["class_name"] = class_name


        if section:
            section = section.strip()
            attrs["section"] = section


        # School Admin can only create/edit
        # classes inside their own school
        if (
            request
            and request.user.role == "ADMIN"
        ):

            if not request.user.school:
                raise serializers.ValidationError(
                    {
                        "school":
                        "Your account is not assigned to a school."
                    }
                )

            school = request.user.school

            attrs["school"] = school


        if school is None:

            raise serializers.ValidationError(
                {
                    "school":
                    "A school is required."
                }
            )


        # Prevent duplicate class + section
        duplicate = ClassRoom.objects.filter(
            school=school,
            class_name__iexact=class_name,
            section__iexact=section,
        )


        if self.instance:

            duplicate = duplicate.exclude(
                pk=self.instance.pk
            )


        if duplicate.exists():

            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        "This class and section already exist in the selected school."
                    ]
                }
            )


        return attrs


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