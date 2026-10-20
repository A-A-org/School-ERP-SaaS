from notifications.services import create_notification

from config.audit_logs.services import (
    log_create,
    log_update,
    log_delete,
)


from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied


from students.models import Student


from .models import (
    Fee,
    Payment,
    Salary,
    SalaryPayment,
)




from .serializers import (
    FeeSerializer,
    PaymentSerializer,
    SalarySerializer,
    SalaryPaymentSerializer,
)


from .services import (
    create_next_month_fee,
    delete_payment,
    generate_monthly_fees,
    generate_monthly_salaries,
)


from accounts.permissions import FinanceAccessPermission




# ==========================
# Fee Views
# ==========================


class FeeListCreateView(generics.ListCreateAPIView):

    serializer_class = FeeSerializer

    permission_classes = [
        FinanceAccessPermission
    ]



    def get_queryset(self):

        user = self.request.user


        # Platform Owner sees all fees
        if user.role == "OWNER":

            return Fee.objects.all()



        # School users see their school fees
        return Fee.objects.filter(
            student__school=user.school
        )




    def perform_create(self, serializer):

        student = serializer.validated_data["student"]

        user = self.request.user



        if user.role != "OWNER":

            if student.school != user.school:

                raise PermissionDenied(
                    "You cannot create a fee for another school."
                )


        fee = serializer.save(
            created_by=user
        )


        log_create(
           user=user,
           module="Fee",
           obj=fee
        )






class FeeDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = FeeSerializer

    permission_classes = [
        FinanceAccessPermission
    ]


    def perform_update(self, serializer):

        old_fee = self.get_object()


        old_data = {
            "total_amount": str(old_fee.total_amount),
            "previous_balance": str(old_fee.previous_balance),
            "status": old_fee.status,
        }


        fee = serializer.save()


        new_data = {
            "total_amount": str(fee.total_amount),
            "previous_balance": str(fee.previous_balance),
            "status": fee.status,
        }


        log_update(
            user=self.request.user,
            module="Fee",
            obj=fee,
            old_data=old_data,
            new_data=new_data
        )



    def perform_destroy(self, instance):

        old_data = {

            "student": str(instance.student),

            "month": instance.month,

            "year": instance.year,

            "total_amount": str(instance.total_amount),

            "remaining_amount": str(instance.remaining_amount),

            "status": instance.status,

        }


        log_delete(
            user=self.request.user,
            module="Fee",
            obj=instance,
            old_data=old_data
        )


        instance.delete()



    def get_queryset(self):

        user = self.request.user


        if user.role == "OWNER":

            return Fee.objects.all()


        return Fee.objects.filter(
            student__school=user.school
        )






# ==========================
# Payment Views
# ==========================


class PaymentListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = PaymentSerializer

    permission_classes = [
        FinanceAccessPermission
    ]



    def get_queryset(self):

        user = self.request.user



        if user.role == "OWNER":

            return Payment.objects.all()



        return Payment.objects.filter(
            fee__student__school=user.school
        )




    def perform_create(self, serializer):

        fee = serializer.validated_data["fee"]

        user = self.request.user



        if user.role != "OWNER":

            if fee.student.school != user.school:

                raise PermissionDenied(
                    "You cannot create payment for another school."
                )



        payment = serializer.save(
           received_by=user
        )


        log_create(
           user=user,
           module="Payment",
           obj=payment
        )







class PaymentDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = PaymentSerializer

    permission_classes = [
        FinanceAccessPermission
    ]


    def perform_update(self, serializer):

        old_payment = self.get_object()


        old_data = {
            "amount": str(old_payment.amount),
            "payment_method": old_payment.payment_method,
        }


        payment = serializer.save()


        new_data = {
            "amount": str(payment.amount),
            "payment_method": payment.payment_method,
        }


        log_update(
            user=self.request.user,
            module="Payment",
            obj=payment,
            old_data=old_data,
            new_data=new_data
        )



    def perform_destroy(self, instance):

        print("========== PAYMENT DELETE START ==========")


        old_data = {

            "fee": instance.fee.id,

            "amount": str(instance.amount),

            "payment_method": instance.payment_method,

        }


        log_delete(
            user=self.request.user,
            module="Payment",
            obj=instance,
            old_data=old_data
        )


        from accounts.models import User


        school_admin = User.objects.filter(
            role="ADMIN",
            school=instance.fee.student.school
        ).first()


        print("FOUND SCHOOL ADMIN:", school_admin)


        if school_admin:

            create_notification(

                recipient=school_admin,

                title="Payment Deleted",

                message=(
                    f"Payment of {instance.amount} "
                    f"was deleted for student "
                    f"{instance.fee.student}"
                ),

                notification_type="FINANCE"

            )


        delete_payment(instance)



    def get_queryset(self):

        user = self.request.user


        if user.role == "OWNER":

            return Payment.objects.all()


        return Payment.objects.filter(
            fee__student__school=user.school
        )
# ==========================
# Generate Single Student Fee
# ==========================


class GenerateFeeView(APIView):

    permission_classes = [
        FinanceAccessPermission
    ]



    def post(self, request):

        student_id = request.data.get(
            "student"
        )

        month = request.data.get(
            "month"
        )

        year = request.data.get(
            "year"
        )

        amount = request.data.get(
            "amount"
        )



        if not student_id:

            return Response(
                {
                    "error": "student is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )



        if not month:

            return Response(
                {
                    "error": "month is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )



        if not year:

            return Response(
                {
                    "error": "year is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )



        if amount is None:

            return Response(
                {
                    "error": "amount is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )



        user = request.user




        if user.role == "OWNER":

            student = get_object_or_404(
                Student,
                id=student_id
            )


        else:

            student = get_object_or_404(
                Student,
                id=student_id,
                school=user.school
            )




        try:


            fee = create_next_month_fee(

                student=student,

                month=month,

                year=year,

                monthly_amount=amount,

                created_by=user

            )


        except ValueError as error:


            return Response(

                {
                    "error": str(error)
                },

                status=status.HTTP_400_BAD_REQUEST

            )





        return Response(

            {

                "message": "Fee generated successfully",

                "fee_id": fee.id,

                "student": str(student),

                "month": fee.month,

                "year": fee.year,

                "total_amount": fee.total_amount,

                "previous_balance": fee.previous_balance,

                "total_payable": fee.total_payable,

                "paid_amount": fee.paid_amount,

                "remaining_amount": fee.remaining_amount,

                "status": fee.status,

            },

            status=status.HTTP_201_CREATED

        )









# ==========================
# Generate Monthly Fees
# ==========================


class GenerateMonthlyFeesView(APIView):

    permission_classes = [
        FinanceAccessPermission
    ]



    def post(self, request):


        month = request.data.get(
            "month"
        )


        year = request.data.get(
            "year"
        )


        amount = request.data.get(
            "amount"
        )




        if not month:

            return Response(
                {
                    "error": "month is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )



        if not year:

            return Response(
                {
                    "error": "year is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )



        if amount is None:

            return Response(
                {
                    "error": "amount is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )



        user = request.user



        # Owner can select school manually
        if user.role == "OWNER":


            school_id = request.data.get(
                "school"
            )


            if not school_id:

                return Response(
                    {
                        "error":
                        "school is required for owner."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            from schools.models import School


            school = get_object_or_404(
                School,
                id=school_id
            )


        else:

            # Accountant/Admin use their own school
            school = user.school




        result = generate_monthly_fees(

            school=school,

            month=month,

            year=year,

            monthly_amount=amount,

            created_by=user

        )



        return Response(

            {

                "message":
                "Monthly fees generated successfully",


                "students_created":
                result["created"],


                "skipped":
                result["skipped"],

            },

            status=status.HTTP_201_CREATED

        )

        # ==========================
# Salary Views
# ==========================


class SalaryListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = SalarySerializer

    permission_classes = [
        FinanceAccessPermission
    ]



    def get_queryset(self):

        user = self.request.user


        # Platform Owner sees all salaries
        if user.role == "OWNER":

            return Salary.objects.all()



        # School users see their school employees salaries
        return Salary.objects.filter(
            employee__school=user.school
        )




    def perform_create(self, serializer):

     employee = serializer.validated_data["employee"]

     user = self.request.user


     if user.role != "OWNER":

        if employee.school != user.school:

            raise PermissionDenied(
                "You cannot create salary for another school."
            )


     salary = serializer.save(
        created_by=user
     )


     log_create(
        user=user,
        module="Salary",
        obj=salary
     )


class SalaryDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = SalarySerializer

    permission_classes = [
        FinanceAccessPermission
    ]


    def delete(self, request, *args, **kwargs):
        print("========== SALARY DELETE METHOD HIT ==========")
        return super().delete(request, *args, **kwargs)


    def perform_update(self, serializer):

        old_salary = self.get_object()


        old_data = {

            "basic_salary": str(
                old_salary.basic_salary
            ),

            "allowance": str(
                old_salary.allowance
            ),

            "deduction": str(
                old_salary.deduction
            ),

            "net_salary": str(
                old_salary.net_salary
            ),

        }


        salary = serializer.save()


        new_data = {

            "basic_salary": str(
                salary.basic_salary
            ),

            "allowance": str(
                salary.allowance
            ),

            "deduction": str(
                salary.deduction
            ),

            "net_salary": str(
                salary.net_salary
            ),

        }


        log_update(

            user=self.request.user,

            module="Salary",

            obj=salary,

            old_data=old_data,

            new_data=new_data

        )



    def perform_destroy(self, instance):

        print("========== SALARY DELETE START ==========")


        old_data = {

            "employee": instance.employee.name,

            "month": instance.month,

            "year": instance.year,

            "basic_salary": str(
                instance.basic_salary
            ),

            "net_salary": str(
                instance.net_salary
            ),

        }


        log_delete(

            user=self.request.user,

            module="Salary",

            obj=instance,

            old_data=old_data

        )


        print("AUDIT LOG CREATED")


        from accounts.models import User


        school_admin = User.objects.filter(

            role="ADMIN",

            school=instance.employee.school

        ).first()


        print(
            "FOUND SCHOOL ADMIN:",
            school_admin
        )


        if school_admin:


            create_notification(

                recipient=school_admin,

                title="Salary Deleted",

                message=(

                    f"Salary of "
                    f"{instance.employee.name} "

                    f"for {instance.month} "
                    f"{instance.year} "

                    f"was deleted"

                ),

                notification_type="FINANCE"

            )


            print("NOTIFICATION CREATED")


        instance.delete()


        print("========== SALARY DELETE END ==========")




    def get_queryset(self):

        user = self.request.user


        if user.role == "OWNER":

            return Salary.objects.all()


        return Salary.objects.filter(

            employee__school=user.school

        )
# ==========================
# Salary Payment Views
# ==========================
class SalaryPaymentListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = SalaryPaymentSerializer

    permission_classes = [
        FinanceAccessPermission
    ]


    def get_queryset(self):

        user = self.request.user


        if user.role == "OWNER":

            return SalaryPayment.objects.all()


        return SalaryPayment.objects.filter(
            salary__employee__school=user.school
        )


    def perform_create(
        self,
        serializer
    ):

        salary = (
            serializer.validated_data[
                "salary"
            ]
        )

        user = self.request.user


        if (
            user.role != "OWNER"
            and salary.employee.school_id
            != user.school_id
        ):

            raise PermissionDenied(
                "You cannot pay salary for another school."
            )


        serializer.save(
            received_by=user
        )

class SalaryPaymentDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = SalaryPaymentSerializer

    permission_classes = [
        FinanceAccessPermission
    ]


    def perform_update(self, serializer):

        old_payment = self.get_object()


        old_data = {

            "salary": old_payment.salary.id,

            "amount": str(
                old_payment.amount
            ),

            "payment_method": old_payment.payment_method,

        }


        payment = serializer.save()


        new_data = {

            "salary": payment.salary.id,

            "amount": str(
                payment.amount
            ),

            "payment_method": payment.payment_method,

        }


        log_update(

            user=self.request.user,

            module="Salary Payment",

            obj=payment,

            old_data=old_data,

            new_data=new_data

        )



    def perform_destroy(self, instance):

        print(
            "========== SALARY PAYMENT DELETE START =========="
        )


        old_data = {

            "salary": instance.salary.id,

            "employee": instance.salary.employee.name,

            "amount": str(
                instance.amount
            ),

            "payment_method": instance.payment_method,

        }


        log_delete(

            user=self.request.user,

            module="Salary Payment",

            obj=instance,

            old_data=old_data

        )


        print("AUDIT LOG CREATED")


        from accounts.models import User


        school_admin = User.objects.filter(

            role="ADMIN",

            school=instance.salary.employee.school

        ).first()


        print(
            "FOUND SCHOOL ADMIN:",
            school_admin
        )


        if school_admin:


            create_notification(

                recipient=school_admin,

                title="Salary Payment Deleted",

                message=(

                    f"Salary payment of "
                    f"{instance.amount} "

                    f"was deleted for employee "
                    f"{instance.salary.employee.name}"

                ),

                notification_type="FINANCE"

            )


            print("NOTIFICATION CREATED")


        instance.delete()


        print(
            "========== SALARY PAYMENT DELETE END =========="
        )



    def get_queryset(self):

        user = self.request.user


        if user.role == "OWNER":

            return SalaryPayment.objects.all()


        return SalaryPayment.objects.filter(

            salary__employee__school=user.school

        )


# ==========================
# Generate Monthly Salaries
# ==========================


class GenerateMonthlySalariesView(APIView):

    permission_classes = [
        FinanceAccessPermission
    ]


    def post(self, request):

        month = request.data.get(
            "month"
        )


        year = request.data.get(
            "year"
        )


        user = request.user



        if not month:

            return Response(
                {
                    "error": "month is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        if not year:

            return Response(
                {
                    "error": "year is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )



        # Owner selects school
        if user.role == "OWNER":


            school_id = request.data.get(
                "school"
            )


            if not school_id:

                return Response(
                    {
                        "error":
                        "school is required for owner."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            from schools.models import School


            school = get_object_or_404(
                School,
                id=school_id
            )


        else:

            school = user.school



        result = generate_monthly_salaries(

            school=school,

            month=month,

            year=year,

            created_by=user

        )



        return Response(

            {
                "message":
                "Monthly salaries generated successfully",

                "employees_created":
                result["created"],

                "skipped":
                result["skipped"],

            },

            status=status.HTTP_201_CREATED

        )