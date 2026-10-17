from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import School, User, SchoolClass, Student, Employee, Fee, Attendance, Subject, Exam, Grade
from .permissions import RoleBasedPermission

from .serializers import (
    SchoolSerializer,
    UserSerializer,
    SchoolClassSerializer,
    StudentSerializer,
    EmployeeSerializer,
    FeeSerializer,
    AttendanceSerializer,
    SubjectSerializer,
    ExamSerializer,
    GradeSerializer,
    GradeReportSerializer,
)



class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return School.objects.all()

        if user.school_id:
            return School.objects.filter(id=user.school_id)

        return School.objects.none()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return User.objects.all()

        if user.role == 'school_admin' and user.school_id:
            return User.objects.filter(
                school=user.school,
                role='employee'
            )

        return User.objects.none()


class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.all()
    serializer_class = SchoolClassSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return SchoolClass.objects.all()

        return SchoolClass.objects.filter(school=user.school)


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return Student.objects.all()

        return Student.objects.filter(school=user.school)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return Employee.objects.all()

        if user.school_id:
            return Employee.objects.filter(school=user.school)

        return Employee.objects.none()


class FeeViewSet(viewsets.ModelViewSet):
    queryset = Fee.objects.all()
    serializer_class = FeeSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'platform_owner':
            return Fee.objects.all()

        if user.school_id:
            return Fee.objects.filter(student__school=user.school)

        return Fee.objects.none()
    @action(detail=False, methods=["get"], url_path="financial-summary")
    def financial_summary(self, request):
        fees = self.get_queryset()

        summary = {
            "fee_count": 0,
            "paid_count": 0,
            "unpaid_count": 0,
            "total_amount": 0.0,
            "paid_amount": 0.0,
            "unpaid_amount": 0.0,
        }

        for fee in fees:
            amount = float(fee.amount)

            summary["fee_count"] += 1
            summary["total_amount"] += amount

            if fee.status == "paid":
                summary["paid_count"] += 1
                summary["paid_amount"] += amount
            elif fee.status == "unpaid":
                summary["unpaid_count"] += 1
                summary["unpaid_amount"] += amount

        summary["total_amount"] = round(summary["total_amount"], 2)
        summary["paid_amount"] = round(summary["paid_amount"], 2)
        summary["unpaid_amount"] = round(summary["unpaid_amount"], 2)

        return Response(summary)



class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == "platform_owner":
            return Subject.objects.all()
        if user.school_id:
            return Subject.objects.filter(school_id=user.school_id)
        return Subject.objects.none()


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == "platform_owner":
            return Exam.objects.all()
        if user.school_id:
            return Exam.objects.filter(school_id=user.school_id)
        return Exam.objects.none()


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == "platform_owner":
            return Grade.objects.select_related("exam", "student")
        if user.school_id:
            return Grade.objects.filter(
                exam__school_id=user.school_id
            ).select_related("exam", "student")
        return Grade.objects.none()


class ReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Grade.objects.select_related(
        "exam", "exam__subject", "exam__school_class", "student"
    )
    serializer_class = GradeReportSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        if user.role != "platform_owner":
            if not user.school_id:
                return queryset.none()
            queryset = queryset.filter(exam__school_id=user.school_id)

        exam_id = self.request.query_params.get("exam_id")
        student_id = self.request.query_params.get("student_id")
        class_id = self.request.query_params.get("class_id")

        if exam_id and exam_id.isdigit():
            queryset = queryset.filter(exam_id=int(exam_id))
        if student_id and student_id.isdigit():
            queryset = queryset.filter(student_id=int(student_id))
        if class_id and class_id.isdigit():
            queryset = queryset.filter(exam__school_class_id=int(class_id))

        return queryset

    @action(detail=False, methods=["get"], url_path="student-summary")
    def student_summary(self, request):
        grades = self.get_queryset().select_related("student", "exam")
        summaries = {}

        for grade in grades:
            student_id = grade.student_id

            if student_id not in summaries:
                summaries[student_id] = {
                    "student_id": student_id,
                    "student_name": (
                        f"{grade.student.first_name} "
                        f"{grade.student.last_name}"
                    ).strip(),
                    "exam_ids": set(),
                    "grade_count": 0,
                    "marks_total": 0.0,
                    "percentage_total": 0.0,
                }

            row = summaries[student_id]
            row["exam_ids"].add(grade.exam_id)
            row["grade_count"] += 1
            row["marks_total"] += float(grade.marks_obtained)

            total = float(grade.exam.total_marks)
            if total > 0:
                row["percentage_total"] += (
                    float(grade.marks_obtained) / total * 100
                )

        result = []
        for row in summaries.values():
            count = row["grade_count"]
            result.append({
                "student_id": row["student_id"],
                "student_name": row["student_name"],
                "exam_count": len(row["exam_ids"]),
                "grade_count": count,
                "average_marks": round(row["marks_total"] / count, 2),
                "average_percentage": round(
                    row["percentage_total"] / count, 2
                ),
            })

        return Response(
            sorted(result, key=lambda item: item["student_id"])
        )

    @action(detail=False, methods=["get"], url_path="class-summary")
    def class_summary(self, request):
        grades = self.get_queryset().select_related(
            "student", "exam", "exam__school_class"
        )
        summaries = {}

        for grade in grades:
            school_class = grade.exam.school_class
            class_id = school_class.id

            if class_id not in summaries:
                summaries[class_id] = {
                    "class_id": class_id,
                    "class_name": school_class.name,
                    "section": school_class.section,
                    "student_ids": set(),
                    "exam_ids": set(),
                    "grade_count": 0,
                    "marks_total": 0.0,
                    "percentage_total": 0.0,
                }

            row = summaries[class_id]
            row["student_ids"].add(grade.student_id)
            row["exam_ids"].add(grade.exam_id)
            row["grade_count"] += 1
            row["marks_total"] += float(grade.marks_obtained)

            total = float(grade.exam.total_marks)
            if total > 0:
                row["percentage_total"] += (
                    float(grade.marks_obtained) / total * 100
                )

        result = []
        for row in summaries.values():
            count = row["grade_count"]
            result.append({
                "class_id": row["class_id"],
                "class_name": row["class_name"],
                "section": row["section"],
                "student_count": len(row["student_ids"]),
                "exam_count": len(row["exam_ids"]),
                "grade_count": count,
                "average_marks": round(row["marks_total"] / count, 2),
                "average_percentage": round(
                    row["percentage_total"] / count, 2
                ),
            })

        return Response(
            sorted(result, key=lambda item: item["class_id"])
        )


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        user = self.request.user

        if user.role == "platform_owner":
            return Attendance.objects.all()

        if user.school_id:
            return Attendance.objects.filter(
                student__school=user.school
            )

        return Attendance.objects.none()

    @action(detail=False, methods=["get"], url_path="summary")
    def attendance_summary(self, request):
        records = self.get_queryset()

        summary = {
            "record_count": 0,
            "present_count": 0,
            "absent_count": 0,
            "late_count": 0,
        }

        for record in records:
            summary["record_count"] += 1

            if record.status == "present":
                summary["present_count"] += 1
            elif record.status == "absent":
                summary["absent_count"] += 1
            elif record.status == "late":
                summary["late_count"] += 1

        return Response(summary)
