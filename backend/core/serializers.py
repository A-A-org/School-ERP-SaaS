from rest_framework import serializers
from decimal import Decimal

from .models import School, User, SchoolClass, Student, Employee, Fee, Attendance, Subject, Exam, Grade


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'password',
            'full_name',
            'email',
            'role',
            'school',
        ]
        extra_kwargs = {
            'password': {
                'write_only': True,
                'required': False,
            }
        }

    def validate(self, attrs):
        request = self.context.get('request')
        actor = request.user if request and request.user.is_authenticated else None

        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({
                'password': 'Password is required when creating a user.'
            })

        if actor and actor.role == 'school_admin':
            if not actor.school_id:
                raise serializers.ValidationError({
                    'school': 'School admin must be assigned to a school.'
                })

            requested_role = attrs.get(
                'role',
                self.instance.role if self.instance else 'employee'
            )

            if requested_role != 'employee':
                raise serializers.ValidationError({
                    'role': 'School admins can only manage employee accounts.'
                })

            requested_school = attrs.get(
                'school',
                self.instance.school if self.instance else actor.school
            )

            if requested_school != actor.school:
                raise serializers.ValidationError({
                    'school': 'You can only manage users in your own school.'
                })

        if actor and actor.role == 'platform_owner' and self.instance is None:
            requested_role = attrs.get('role', 'employee')
            requested_school = attrs.get('school')

            if requested_role in ('school_admin', 'employee') and not requested_school:
                raise serializers.ValidationError({
                    'school': 'A school is required for this user role.'
                })

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        actor = request.user if request and request.user.is_authenticated else None

        if actor and actor.role == 'school_admin':
            validated_data['role'] = 'employee'
            validated_data['school'] = actor.school

        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

class SchoolClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolClass
        fields = '__all__'
        extra_kwargs = {
            'school': {'read_only': True}
        }

    def create(self, validated_data):
        user = self.context['request'].user

        if user.role == 'platform_owner':
            school_id = self.initial_data.get('school')

            if not school_id:
                raise serializers.ValidationError({
                    'school': 'School is required.'
                })

            try:
                school = School.objects.get(pk=school_id)
            except (School.DoesNotExist, ValueError, TypeError):
                raise serializers.ValidationError({
                    'school': 'A valid school is required.'
                })

            validated_data['school'] = school

        else:
            if not user.school:
                raise serializers.ValidationError({
                    'school': 'User is not assigned to a school.'
                })

            validated_data['school'] = user.school

        return super().create(validated_data)

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
        extra_kwargs = {
            'school': {'read_only': True}
        }

    def _get_target_school(self):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        if not user:
            raise serializers.ValidationError({
                'school': 'Authenticated user is required.'
            })

        if self.instance:
            return self.instance.school

        if user.role == 'platform_owner':
            school_id = self.initial_data.get('school')

            if not school_id:
                raise serializers.ValidationError({
                    'school': 'School is required.'
                })

            try:
                return School.objects.get(pk=school_id)
            except (School.DoesNotExist, ValueError, TypeError):
                raise serializers.ValidationError({
                    'school': 'A valid school is required.'
                })

        if not user.school_id:
            raise serializers.ValidationError({
                'school': 'User is not assigned to a school.'
            })

        return user.school

    def validate(self, attrs):
        target_school = self._get_target_school()

        school_class = attrs.get(
            'school_class',
            self.instance.school_class if self.instance else None
        )

        if school_class and school_class.school_id != target_school.id:
            raise serializers.ValidationError({
                'school_class': 'Class must belong to the student school.'
            })

        return attrs

    def create(self, validated_data):
        validated_data['school'] = self._get_target_school()
        return super().create(validated_data)

class EmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        write_only=True, required=False, allow_blank=False
    )
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=False, min_length=8
    )

    class Meta:
        model = Employee
        fields = [
            "id", "user", "username", "password", "name",
            "email", "phone", "position", "school",
        ]
        extra_kwargs = {
            "school": {"read_only": True},
            "user": {"required": False, "allow_null": True},
        }

    def validate(self, attrs):
        request = self.context.get("request")
        actor = (
            request.user
            if request and request.user.is_authenticated
            else None
        )

        if not actor:
            raise serializers.ValidationError(
                "An authenticated user is required."
            )

        if actor.role == "platform_owner":
            if self.instance:
                target_school = self.instance.school
            else:
                school_id = self.initial_data.get("school")
                try:
                    target_school = School.objects.get(pk=school_id)
                except (School.DoesNotExist, ValueError, TypeError):
                    raise serializers.ValidationError({
                        "school": "A valid school is required."
                    })
        else:
            if not actor.school_id:
                raise serializers.ValidationError({
                    "school": "User is not assigned to a school."
                })

            target_school = actor.school

            if self.instance and self.instance.school_id != actor.school_id:
                raise serializers.ValidationError({
                    "school": "You can only manage employees in your own school."
                })

        username = attrs.get("username")
        password = attrs.get("password")

        if bool(username) != bool(password):
            raise serializers.ValidationError({
                "username": "Provide both username and password to create a login account."
            })

        if self.instance and (username or password):
            raise serializers.ValidationError({
                "username": "Login credentials can only be supplied when creating an employee."
            })

        linked_user = attrs.get(
            "user",
            self.instance.user if self.instance else None,
        )

        if username and linked_user:
            raise serializers.ValidationError({
                "user": "Provide an existing user OR new login credentials, not both."
            })

        if username and User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                "username": "This username is already in use."
            })

        if linked_user:
            if linked_user.role != "employee":
                raise serializers.ValidationError({
                    "user": "Only employee accounts can be linked to employee profiles."
                })

            if linked_user.school_id != target_school.id:
                raise serializers.ValidationError({
                    "user": "The login account and employee profile must belong to the same school."
                })

            existing = Employee.objects.filter(user=linked_user)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)

            if existing.exists():
                raise serializers.ValidationError({
                    "user": "This account is already linked to an employee profile."
                })

        return attrs

    def create(self, validated_data):
        username = validated_data.pop("username", None)
        password = validated_data.pop("password", None)

        request = self.context["request"]
        actor = request.user

        if actor.role == "platform_owner":
            school = School.objects.get(pk=self.initial_data.get("school"))
        else:
            school = actor.school

        if username and password:
            account = User(
                username=username,
                full_name=validated_data.get("name", ""),
                role="employee",
                school=school,
            )
            account.set_password(password)
            account.save()
            validated_data["user"] = account

        validated_data["school"] = school
        return super().create(validated_data)

class FeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fee
        fields = '__all__'

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None

        student = attrs.get(
            'student',
            self.instance.student if self.instance else None
        )

        if user and user.is_authenticated:
            if user.role != 'platform_owner':
                if not user.school_id:
                    raise serializers.ValidationError({
                        'student': 'User is not assigned to a school.'
                    })

                if student and student.school_id != user.school_id:
                    raise serializers.ValidationError({
                        'student': 'Student must belong to your school.'
                    })

        return attrs




class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "code", "school", "created_at"]
        extra_kwargs = {
            "school": {"read_only": True},
            "created_at": {"read_only": True},
        }

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None

        if not user:
            raise serializers.ValidationError(
                "An authenticated user is required."
            )

        if user.role == "platform_owner":
            school_id = (
                self.instance.school_id
                if self.instance
                else self.initial_data.get("school")
            )
            if not school_id or not School.objects.filter(pk=school_id).exists():
                raise serializers.ValidationError({
                    "school": "A valid school is required."
                })
        else:
            if not user.school_id:
                raise serializers.ValidationError({
                    "school": "User is not assigned to a school."
                })
            if self.instance and self.instance.school_id != user.school_id:
                raise serializers.ValidationError({
                    "school": "You can only manage subjects in your own school."
                })

        return attrs

    def create(self, validated_data):
        user = self.context["request"].user

        if user.role == "platform_owner":
            school = School.objects.get(pk=self.initial_data.get("school"))
        else:
            school = user.school

        validated_data["school"] = school
        return super().create(validated_data)


class ExamSerializer(serializers.ModelSerializer):
    total_marks = serializers.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal('0.01')
    )

    class Meta:
        model = Exam
        fields = [
            "id", "title", "subject", "school_class", "school",
            "exam_date", "total_marks", "created_by", "created_at",
        ]
        extra_kwargs = {
            "school": {"read_only": True},
            "created_by": {"read_only": True},
            "created_at": {"read_only": True},
        }

    def _target_school(self):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None

        if not user:
            raise serializers.ValidationError(
                "An authenticated user is required."
            )

        if user.role == "platform_owner":
            school_id = (
                self.instance.school_id
                if self.instance
                else self.initial_data.get("school")
            )
            try:
                return School.objects.get(pk=school_id)
            except (School.DoesNotExist, ValueError, TypeError):
                raise serializers.ValidationError({
                    "school": "A valid school is required."
                })

        if not user.school_id:
            raise serializers.ValidationError({
                "school": "User is not assigned to a school."
            })

        if self.instance and self.instance.school_id != user.school_id:
            raise serializers.ValidationError({
                "school": "You can only manage exams in your own school."
            })

        return user.school

    def validate(self, attrs):
        school = self._target_school()
        subject = attrs.get(
            "subject", self.instance.subject if self.instance else None
        )
        school_class = attrs.get(
            "school_class",
            self.instance.school_class if self.instance else None,
        )

        if subject and subject.school_id != school.id:
            raise serializers.ValidationError({
                "subject": "Subject must belong to the exam school."
            })

        if school_class and school_class.school_id != school.id:
            raise serializers.ValidationError({
                "school_class": "Class must belong to the exam school."
            })

        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["school"] = self._target_school()
        validated_data["created_by"] = user
        return super().create(validated_data)


class GradeSerializer(serializers.ModelSerializer):
    marks_obtained = serializers.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal('0')
    )

    class Meta:
        model = Grade
        fields = [
            "id", "exam", "student", "marks_obtained",
            "remarks", "created_at",
        ]
        extra_kwargs = {
            "created_at": {"read_only": True},
        }

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None

        exam = attrs.get(
            "exam", self.instance.exam if self.instance else None
        )
        student = attrs.get(
            "student", self.instance.student if self.instance else None
        )
        marks = attrs.get(
            "marks_obtained",
            self.instance.marks_obtained if self.instance else None,
        )

        if exam and student:
            if student.school_id != exam.school_id:
                raise serializers.ValidationError({
                    "student": "Student and exam must belong to the same school."
                })

            if student.school_class_id != exam.school_class_id:
                raise serializers.ValidationError({
                    "student": "Student must belong to the exam class."
                })

        if user and user.role != "platform_owner":
            if not user.school_id or (exam and exam.school_id != user.school_id):
                raise serializers.ValidationError({
                    "exam": "Exam must belong to your school."
                })

        if exam and marks is not None and marks > exam.total_marks:
            raise serializers.ValidationError({
                "marks_obtained": "Marks cannot exceed the exam total."
            })

        return attrs


class GradeReportSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source="exam.title", read_only=True)
    subject_name = serializers.CharField(
        source="exam.subject.name", read_only=True
    )
    class_name = serializers.CharField(
        source="exam.school_class.name", read_only=True
    )
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    student_name = serializers.SerializerMethodField()
    total_marks = serializers.DecimalField(
        source="exam.total_marks",
        max_digits=8,
        decimal_places=2,
        read_only=True,
    )
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            "id", "exam_title", "subject_name", "class_name",
            "student_id", "student_name", "marks_obtained",
            "total_marks", "percentage", "remarks",
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_percentage(self, obj):
        if not obj.exam.total_marks:
            return 0
        return round(
            float(obj.marks_obtained / obj.exam.total_marks * 100), 2
        )


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None

        student = attrs.get(
            'student',
            self.instance.student if self.instance else None
        )

        employee = attrs.get(
            'employee',
            self.instance.employee if self.instance else None
        )

        if user and user.is_authenticated:
            if user.role != 'platform_owner':
                if not user.school_id:
                    raise serializers.ValidationError({
                        'school': 'User is not assigned to a school.'
                    })

                if student and student.school_id != user.school_id:
                    raise serializers.ValidationError({
                        'student': 'Student must belong to your school.'
                    })

        if student and employee:
            if employee.school_id != student.school_id:
                raise serializers.ValidationError({
                    'employee': 'Employee and student must belong to the same school.'
                })

        return attrs
