from datetime import date
from calendar import monthrange

from .models import Attendance
from academics.models import ClassRoom



def student_attendance_report(student_id):

    attendance = Attendance.objects.filter(
        student_id=student_id
    )


    total_days = attendance.count()


    present = attendance.filter(
        status="PRESENT"
    ).count()


    absent = attendance.filter(
        status="ABSENT"
    ).count()


    late = attendance.filter(
        status="LATE"
    ).count()


    percentage = 0

    if total_days > 0:
        percentage = round(
            (present / total_days) * 100,
            2
        )


    return {
        "total_days": total_days,
        "present": present,
        "absent": absent,
        "late": late,
        "percentage": percentage,
    }




def class_attendance_report(classroom_id, date):

    attendance = Attendance.objects.filter(
        student__classroom_id=classroom_id,
        date=date
    )


    total_students = ClassRoom.objects.get(
        id=classroom_id
    ).students.count()


    present = attendance.filter(
        status="PRESENT"
    ).count()


    absent = attendance.filter(
        status="ABSENT"
    ).count()


    late = attendance.filter(
        status="LATE"
    ).count()


    return {
        "classroom": classroom_id,
        "date": date,
        "total_students": total_students,
        "present": present,
        "absent": absent,
        "late": late,
    }




def monthly_attendance_report(classroom_id, month, year):

    start_date = date(
        year,
        month,
        1
    )

    end_date = date(
        year,
        month,
        monthrange(year, month)[1]
    )


    attendance = Attendance.objects.filter(
        student__classroom_id=classroom_id,
        date__range=[
            start_date,
            end_date
        ]
    )


    total_records = attendance.count()


    present = attendance.filter(
        status="PRESENT"
    ).count()


    absent = attendance.filter(
        status="ABSENT"
    ).count()


    late = attendance.filter(
        status="LATE"
    ).count()


    percentage = 0

    if total_records > 0:
        percentage = round(
            (present / total_records) * 100,
            2
        )


    return {
        "classroom": classroom_id,
        "month": month,
        "year": year,
        "total_records": total_records,
        "present": present,
        "absent": absent,
        "late": late,
        "attendance_percentage": percentage,
    }