from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "role",
        ]


class TeacherSerializer(serializers.ModelSerializer):

    school_name = serializers.CharField(
        source="school.school_name",
        read_only=True
    )

    classroom_name = serializers.CharField(
        source="classroom.class_name",
        read_only=True
    )

    classroom_section = serializers.CharField(
        source="classroom.section",
        read_only=True
    )

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=6
    )

    role = serializers.CharField(
        read_only=True
    )


    class Meta:

        model = User

        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "role",

            "school",
            "school_name",

            "classroom",
            "classroom_name",
            "classroom_section",

            "password",
        ]


    def validate(self, attrs):

        request = self.context.get(
            "request"
        )

        school = attrs.get(
            "school",
            getattr(
                self.instance,
                "school",
                None
            )
        )

        classroom = attrs.get(
            "classroom",
            getattr(
                self.instance,
                "classroom",
                None
            )
        )


        # School Admin can only manage
        # teachers from their own school
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
                    "A teacher must be assigned to a school."
                }
            )


        if (
            classroom is not None
            and classroom.school_id
            != school.id
        ):

            raise serializers.ValidationError(
                {
                    "classroom":
                    "The selected classroom does not belong to the selected school."
                }
            )


        if (
            self.instance is None
            and not attrs.get("password")
        ):

            raise serializers.ValidationError(
                {
                    "password":
                    "Password is required when creating a teacher."
                }
            )


        return attrs


    def create(self, validated_data):

        password = validated_data.pop(
            "password"
        )

        teacher = User(
            **validated_data
        )

        teacher.role = "TEACHER"

        teacher.set_password(
            password
        )

        teacher.save()

        return teacher


    def update(
        self,
        instance,
        validated_data
    ):

        password = validated_data.pop(
            "password",
            None
        )


        for field, value in (
            validated_data.items()
        ):

            setattr(
                instance,
                field,
                value
            )


        instance.role = "TEACHER"


        if password:

            instance.set_password(
                password
            )


        instance.save()

        return instance