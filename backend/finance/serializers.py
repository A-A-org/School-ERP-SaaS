from decimal import Decimal

from rest_framework import serializers

from .models import (
    Fee,
    Payment,
    Salary,
    SalaryPayment,
)

from .services import (
    create_payment,
    update_payment,
)


# ==========================
# Payment
# ==========================

class PaymentSerializer(serializers.ModelSerializer):

    received_by_name = serializers.CharField(
        source="received_by.username",
        read_only=True
    )


    class Meta:

        model = Payment

        fields = [
            "id",
            "fee",
            "amount",
            "payment_method",
            "payment_date",
            "received_by",
            "received_by_name",
            "created_at",
        ]

        read_only_fields = [
            "received_by",
            "payment_date",
            "created_at",
        ]


    def validate_amount(self, value):

        if value <= Decimal("0.00"):

            raise serializers.ValidationError(
                "Payment amount must be greater than zero."
            )

        return value


    def validate(self, attrs):

        request = self.context.get("request")

        fee = attrs.get(
            "fee",
            getattr(
                self.instance,
                "fee",
                None
            )
        )


        if request and fee:

            user = request.user

            if (
                user.role != "OWNER"
                and fee.student.school_id != user.school_id
            ):

                raise serializers.ValidationError(
                    {
                        "fee":
                        "You cannot access a fee from another school."
                    }
                )


        if not self.instance:

            amount = attrs.get("amount")

            if (
                fee
                and amount
                and amount > fee.remaining_amount
            ):

                raise serializers.ValidationError(
                    {
                        "amount":
                        "Payment amount cannot be greater than the remaining balance."
                    }
                )

        else:

            if "fee" in attrs:

                if (
                    attrs["fee"].id
                    != self.instance.fee.id
                ):

                    raise serializers.ValidationError(
                        {
                            "fee":
                            "You cannot move a payment to another fee."
                        }
                    )


        return attrs


    def create(self, validated_data):

        fee = validated_data["fee"]

        amount = validated_data["amount"]

        payment_method = validated_data.get(
            "payment_method",
            "CASH"
        )

        received_by = validated_data.get(
            "received_by"
        )


        try:

            return create_payment(
                fee=fee,
                amount=amount,
                payment_method=payment_method,
                received_by=received_by
            )

        except ValueError as error:

            raise serializers.ValidationError(
                {
                    "amount": str(error)
                }
            )


    def update(
        self,
        instance,
        validated_data
    ):

        amount = validated_data.get(
            "amount",
            instance.amount
        )

        payment_method = validated_data.get(
            "payment_method",
            instance.payment_method
        )


        try:

            return update_payment(
                payment=instance,
                amount=amount,
                payment_method=payment_method
            )

        except ValueError as error:

            raise serializers.ValidationError(
                {
                    "amount": str(error)
                }
            )


# ==========================
# Fee
# ==========================

class FeeSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.__str__",
        read_only=True
    )

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    payments = PaymentSerializer(
        many=True,
        read_only=True
    )


    class Meta:

        model = Fee

        fields = [
            "id",

            "student",
            "student_name",

            "month",
            "year",

            "total_amount",
            "previous_balance",
            "total_payable",
            "paid_amount",
            "remaining_amount",

            "status",

            "created_by",
            "created_by_name",

            "payments",

            "created_at",
        ]

        read_only_fields = [
            "previous_balance",
            "total_payable",
            "paid_amount",
            "remaining_amount",
            "status",
            "created_by",
            "created_at",
        ]


    def validate_total_amount(
        self,
        value
    ):

        if value < Decimal("0.00"):

            raise serializers.ValidationError(
                "Fee amount cannot be negative."
            )

        return value


    def validate(self, attrs):

        request = self.context.get(
            "request"
        )

        student = attrs.get(
            "student",
            getattr(
                self.instance,
                "student",
                None
            )
        )

        month = attrs.get(
            "month",
            getattr(
                self.instance,
                "month",
                None
            )
        )

        year = attrs.get(
            "year",
            getattr(
                self.instance,
                "year",
                None
            )
        )


        if (
            request
            and student
            and request.user.role != "OWNER"
            and student.school_id
            != request.user.school_id
        ):

            raise serializers.ValidationError(
                {
                    "student":
                    "You cannot manage fees for another school."
                }
            )


        if (
            student
            and month
            and year
        ):

            existing_fee = Fee.objects.filter(
                student=student,
                month=month,
                year=year
            )


            if self.instance:

                existing_fee = (
                    existing_fee.exclude(
                        pk=self.instance.pk
                    )
                )


            if existing_fee.exists():

                raise serializers.ValidationError(
                    {
                        "fee":
                        "A fee already exists for this student and month."
                    }
                )


        return attrs


# ==========================
# Salary
# ==========================

class SalarySerializer(serializers.ModelSerializer):

    employee_name = serializers.CharField(
        source="employee.__str__",
        read_only=True
    )

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True
    )


    class Meta:

        model = Salary

        fields = [
            "id",

            "employee",
            "employee_name",

            "month",
            "year",

            "basic_salary",
            "allowance",
            "deduction",

            "net_salary",
            "paid_amount",
            "remaining_amount",

            "status",

            "created_by",
            "created_by_name",

            "created_at",
        ]

        read_only_fields = [
            "net_salary",
            "paid_amount",
            "remaining_amount",
            "status",
            "created_by",
            "created_at",
        ]


    def validate(self, attrs):

        request = self.context.get(
            "request"
        )

        employee = attrs.get(
            "employee",
            getattr(
                self.instance,
                "employee",
                None
            )
        )


        if (
            request
            and employee
            and request.user.role != "OWNER"
            and employee.school_id
            != request.user.school_id
        ):

            raise serializers.ValidationError(
                {
                    "employee":
                    "You cannot manage salaries for another school."
                }
            )


        month = attrs.get(
            "month",
            getattr(
                self.instance,
                "month",
                None
            )
        )

        year = attrs.get(
            "year",
            getattr(
                self.instance,
                "year",
                None
            )
        )


        if (
            employee
            and month
            and year
        ):

            queryset = Salary.objects.filter(
                employee=employee,
                month=month,
                year=year
            )


            if self.instance:

                queryset = queryset.exclude(
                    pk=self.instance.pk
                )


            if queryset.exists():

                raise serializers.ValidationError(
                    {
                        "salary":
                        "A salary already exists for this employee and month."
                    }
                )


        return attrs


# ==========================
# Salary Payment
# ==========================

class SalaryPaymentSerializer(
    serializers.ModelSerializer
):

    received_by_name = serializers.CharField(
        source="received_by.username",
        read_only=True
    )


    class Meta:

        model = SalaryPayment

        fields = [
            "id",
            "salary",
            "amount",
            "payment_method",
            "payment_date",
            "received_by",
            "received_by_name",
            "created_at",
        ]

        read_only_fields = [
            "payment_date",
            "received_by",
            "created_at",
        ]


    def validate_amount(
        self,
        value
    ):

        if value <= Decimal("0.00"):

            raise serializers.ValidationError(
                "Salary payment must be greater than zero."
            )

        return value


    def validate(self, attrs):

        request = self.context.get(
            "request"
        )

        salary = attrs.get(
            "salary",
            getattr(
                self.instance,
                "salary",
                None
            )
        )

        amount = attrs.get(
            "amount",
            getattr(
                self.instance,
                "amount",
                None
            )
        )


        if (
            request
            and salary
            and request.user.role != "OWNER"
            and salary.employee.school_id
            != request.user.school_id
        ):

            raise serializers.ValidationError(
                {
                    "salary":
                    "You cannot manage salary payments for another school."
                }
            )


        if (
            self.instance
            and "salary" in attrs
            and attrs["salary"].id
            != self.instance.salary.id
        ):

            raise serializers.ValidationError(
                {
                    "salary":
                    "You cannot move a payment to another salary."
                }
            )


        if salary and amount:

            if self.instance:

                available_balance = (
                    salary.remaining_amount
                    + self.instance.amount
                )

            else:

                available_balance = (
                    salary.remaining_amount
                )


            if amount > available_balance:

                raise serializers.ValidationError(
                    {
                        "amount":
                        "Salary payment cannot exceed the remaining salary balance."
                    }
                )


        return attrs