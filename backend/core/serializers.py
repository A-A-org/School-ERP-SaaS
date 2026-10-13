from rest_framework import serializers

from .models import School, User, SchoolClass, Student, Employee, Fee, Attendance


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
                'required': True,
            }
        }

    def validate(self, attrs):
        request = self.context.get('request')
        actor = request.user if request else None

        if actor and actor.is_authenticated:
            if actor.role == 'school_admin':
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

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        actor = request.user if request else None

        if actor and actor.is_authenticated:
            if actor.role == 'school_admin':
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
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'full_name', 'email', 'role', 'school']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
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
        user = request.user if request else None

        if not user or not user.is_authenticated:
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

    def create(self, validated_data):
        user = self.context['request'].user

        if user.role == 'platform_owner':
            school = self.initial_data.get('school')

            if not school:
                raise serializers.ValidationError({
                    'school': 'School is required.'
                })

            validated_data['school_id'] = school

        else:
            if not user.school:
                raise serializers.ValidationError({
                    'school': 'User is not assigned to a school.'
                })

            validated_data['school'] = user.school

        return super().create(validated_data)


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
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
            if not user.school_id:
                raise serializers.ValidationError({
                    'school': 'User is not assigned to a school.'
                })

            validated_data['school'] = user.school

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
