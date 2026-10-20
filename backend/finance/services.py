from decimal import Decimal

from django.db import transaction
from django.db.models import Sum

from .models import (
    Fee,
    Payment,
    Salary,
)





# ==========================
# Fee Helpers
# ==========================

def recalculate_fee_paid_amount(fee):
    """
    Recalculate the total amount paid for a fee
    based on payment records.
    """

    total_paid = (
        fee.payments.aggregate(
            total=Sum("amount")
        )["total"]
        or Decimal("0.00")
    )


    fee.paid_amount = total_paid


    fee.save(
        update_fields=[
            "paid_amount",
            "total_payable",
            "remaining_amount",
            "status",
        ]
    )


    return fee







# ==========================
# Single Student Fee Generation
# ==========================


@transaction.atomic
def create_next_month_fee(
    student,
    month,
    year,
    monthly_amount,
    created_by
):

    monthly_amount = Decimal(
        str(monthly_amount)
    )


    # Prevent duplicate fee
    existing_fee = Fee.objects.filter(
        student=student,
        month=month,
        year=year
    ).first()


    if existing_fee:

        raise ValueError(
            "A fee for this student and month already exists."
        )



    # Get latest previous fee
    last_fee = (
        Fee.objects
        .filter(student=student)
        .exclude(
            month=month,
            year=year
        )
        .order_by(
            "-year",
            "-created_at"
        )
        .first()
    )



    previous_balance = Decimal(
        "0.00"
    )



    if last_fee:

        if last_fee.remaining_amount > 0:

            previous_balance = (
                last_fee.remaining_amount
            )




    fee = Fee.objects.create(

        student=student,

        month=month,

        year=year,

        total_amount=monthly_amount,

        previous_balance=previous_balance,

        created_by=created_by

    )


    return fee







# ==========================
# Generate Monthly Fees For School
# ==========================


@transaction.atomic
def generate_monthly_fees(
    school,
    month,
    year,
    monthly_amount,
    created_by
):


    from students.models import Student



    monthly_amount = Decimal(
        str(monthly_amount)
    )



    students = Student.objects.filter(
        school=school
    )



    created = 0

    skipped = 0




    for student in students:



        # Check duplicate
        exists = Fee.objects.filter(

            student=student,

            month=month,

            year=year

        ).exists()



        if exists:

            skipped += 1

            continue





        # Find previous fee
        last_fee = (

            Fee.objects

            .filter(
                student=student
            )

            .exclude(
                month=month,
                year=year
            )

            .order_by(
                "-year",
                "-created_at"
            )

            .first()

        )




        previous_balance = Decimal(
            "0.00"
        )




        if last_fee:


            if last_fee.remaining_amount > 0:

                previous_balance = (
                    last_fee.remaining_amount
                )






        Fee.objects.create(

            student=student,

            month=month,

            year=year,

            total_amount=monthly_amount,

            previous_balance=previous_balance,

            created_by=created_by

        )



        created += 1






    return {

        "created": created,

        "skipped": skipped

    }









# ==========================
# Payment Services
# ==========================


@transaction.atomic
def create_payment(
    fee,
    amount,
    payment_method,
    received_by
):

    amount = Decimal(
        str(amount)
    )


    fee.refresh_from_db()



    if amount > fee.remaining_amount:

        raise ValueError(
            "Payment amount cannot be greater than remaining balance."
        )



    payment = Payment.objects.create(

        fee=fee,

        amount=amount,

        payment_method=payment_method,

        received_by=received_by

    )



    recalculate_fee_paid_amount(
        fee
    )



    return payment







@transaction.atomic
def update_payment(
    payment,
    amount,
    payment_method
):


    amount = Decimal(
        str(amount)
    )



    fee = payment.fee


    fee.refresh_from_db()



    available_balance = (

        fee.remaining_amount

        +

        payment.amount

    )



    if amount > available_balance:

        raise ValueError(
            "Payment amount cannot be greater than remaining balance."
        )



    payment.amount = amount

    payment.payment_method = payment_method



    payment.save(
        update_fields=[
            "amount",
            "payment_method",
        ]
    )



    recalculate_fee_paid_amount(
        fee
    )



    return payment







@transaction.atomic
def delete_payment(payment):


    fee = payment.fee



    payment.delete()



    recalculate_fee_paid_amount(
        fee
    )



    return fee

    # ==========================
# Generate Monthly Salaries
# ==========================

@transaction.atomic
def generate_monthly_salaries(
    school,
    month,
    year,
    created_by
):

    from employees.models import Employee


    employees = Employee.objects.filter(
        school=school
    )


    created = 0
    skipped = 0


    for employee in employees:


        exists = Salary.objects.filter(
            employee=employee,
            month=month,
            year=year
        ).exists()


        if exists:
            skipped += 1
            continue



        Salary.objects.create(

            employee=employee,

            month=month,

            year=year,

            basic_salary=employee.basic_salary,

            created_by=created_by

        )


        created += 1



    return {

        "created": created,

        "skipped": skipped

    }