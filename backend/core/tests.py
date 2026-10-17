from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.models import School, User, Student, SchoolClass, Employee, Attendance, Fee, Subject, Exam, Grade
class RoleBasedAccessTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.school_a = School.objects.create(
            name="Test School A"
        )
        self.school_b = School.objects.create(
            name="Test School B"
        )

        self.school_admin = User.objects.create_user(
            username="schooladmin_test",
            password="TestPass123!",
            role="school_admin",
            school=self.school_a,
        )

        self.employee = User.objects.create_user(
            username="employee_test",
            password="TestPass123!",
            role="employee",
            school=self.school_a,
        )

        self.platform_owner = User.objects.create_user(
            username="owner_test",
            password="TestPass123!",
            role="platform_owner",
        )

        self.student_a = Student.objects.create(
            first_name="Student",
            last_name="SchoolA",
            gender="male",
            school=self.school_a,
        )

        self.student_b = Student.objects.create(
            first_name="Student",
            last_name="SchoolB",
            gender="female",
            school=self.school_b,
        )

    def test_employee_sees_only_own_school_students(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {
            student["id"] for student in response.data
        }

        self.assertEqual(returned_ids, {self.student_a.id})

    def test_employee_cannot_create_student(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            "/api/students/",
            {
                "first_name": "Unauthorized",
                "last_name": "Student",
                "gender": "male",
                "school": self.school_a.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_update_student(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.patch(
            f"/api/students/{self.student_a.id}/",
            {"phone": "999999999"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_access_fees(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.get("/api/fees/")

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_school_admin_cannot_access_other_school_student(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.get(
            f"/api/students/{self.student_b.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_school_admin_student_is_assigned_to_own_school(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/students/",
            {
                "first_name": "New",
                "last_name": "Student",
                "gender": "male",
                "school": self.school_b.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["school"],
            self.school_a.id,
        )

    def test_school_admin_cannot_create_fee_for_other_school_student(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/fees/",
            {
                "amount": "100.00",
                "status": "unpaid",
                "student": self.student_b.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn("student", response.data)

    def test_school_admin_cannot_record_attendance_for_other_school_student(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/attendance/",
            {
                "date": "2026-10-14",
                "status": "present",
                "student": self.student_b.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn("student", response.data)

    def test_platform_owner_can_see_students_from_all_schools(self):
        self.client.force_authenticate(user=self.platform_owner)

        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {
            student["id"] for student in response.data
        }

        self.assertEqual(
            returned_ids,
            {self.student_a.id, self.student_b.id},
        )
    def test_school_admin_can_create_employee_user_in_own_school(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/users/",
            {
                "username": "new_employee_test",
                "password": "EmployeePass123!",
                "full_name": "New Employee",
                "email": "newemployee@example.com",
                "role": "employee",
                "school": self.school_a.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        created_user = User.objects.get(
            username="new_employee_test"
        )

        self.assertEqual(created_user.role, "employee")
        self.assertEqual(created_user.school_id, self.school_a.id)
        self.assertTrue(
            created_user.check_password("EmployeePass123!")
        )

    def test_school_admin_cannot_create_another_admin(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/users/",
            {
                "username": "unauthorized_admin",
                "password": "AdminPass123!",
                "full_name": "Unauthorized Admin",
                "role": "school_admin",
                "school": self.school_a.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_school_admin_cannot_create_user_in_another_school(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/users/",
            {
                "username": "wrong_school_employee",
                "password": "EmployeePass123!",
                "full_name": "Wrong School Employee",
                "role": "employee",
                "school": self.school_b.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_school_admin_cannot_access_other_school_user(self):
        other_user = User.objects.create_user(
            username="other_school_employee",
            password="EmployeePass123!",
            role="employee",
            school=self.school_b,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.get(
            f"/api/users/{other_user.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_school_admin_cannot_promote_employee_to_admin(self):
        employee_user = User.objects.create_user(
            username="employee_to_promote",
            password="EmployeePass123!",
            role="employee",
            school=self.school_a,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.patch(
            f"/api/users/{employee_user.id}/",
            {"role": "school_admin"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        employee_user.refresh_from_db()
        self.assertEqual(employee_user.role, "employee")
    def test_employee_sees_only_own_school_classes(self):
        class_a = SchoolClass.objects.create(
            name="Class A",
            section="A",
            school=self.school_a,
        )
        SchoolClass.objects.create(
            name="Class B",
            section="B",
            school=self.school_b,
        )

        self.client.force_authenticate(user=self.employee)

        response = self.client.get("/api/classes/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            {item["id"] for item in response.data},
            {class_a.id},
        )

    def test_employee_cannot_create_class(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            "/api/classes/",
            {
                "name": "Unauthorized Class",
                "section": "X",
                "school": self.school_a.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_school_admin_cannot_access_other_school_class(self):
        other_class = SchoolClass.objects.create(
            name="Other School Class",
            section="B",
            school=self.school_b,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.get(
            f"/api/classes/{other_class.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_school_admin_class_is_assigned_to_own_school(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/classes/",
            {
                "name": "New Class",
                "section": "C",
                "school": self.school_b.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(response.data["school"], self.school_a.id)

    def test_employee_can_create_attendance_for_own_school(self):
        profile = Employee.objects.create(
            name="Attendance Teacher",
            position="Teacher",
            school=self.school_a,
            user=self.employee,
        )

        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            "/api/attendance/",
            {
                "date": "2026-10-14",
                "status": "present",
                "student": self.student_a.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(response.data["student"], self.student_a.id)
        self.assertEqual(response.data["employee"], profile.id)

    def test_employee_cannot_update_attendance(self):
        attendance = Attendance.objects.create(
            date="2026-10-14",
            status="present",
            student=self.student_a,
        )

        self.client.force_authenticate(user=self.employee)

        response = self.client.patch(
            f"/api/attendance/{attendance.id}/",
            {"status": "absent"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_delete_attendance(self):
        attendance = Attendance.objects.create(
            date="2026-10-14",
            status="present",
            student=self.student_a,
        )

        self.client.force_authenticate(user=self.employee)

        response = self.client.delete(
            f"/api/attendance/{attendance.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_school_admin_can_update_fee_in_own_school(self):
        fee = Fee.objects.create(
            amount="100.00",
            status="unpaid",
            student=self.student_a,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.patch(
            f"/api/fees/{fee.id}/",
            {"status": "paid"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        fee.refresh_from_db()
        self.assertEqual(fee.status, "paid")

    def test_school_admin_can_delete_fee_in_own_school(self):
        fee = Fee.objects.create(
            amount="100.00",
            status="unpaid",
            student=self.student_a,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.delete(
            f"/api/fees/{fee.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Fee.objects.filter(id=fee.id).exists()
        )

    def test_school_admin_cannot_update_fee_for_other_school(self):
        fee = Fee.objects.create(
            amount="200.00",
            status="unpaid",
            student=self.student_b,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.patch(
            f"/api/fees/{fee.id}/",
            {"status": "paid"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_school_admin_cannot_delete_fee_for_other_school(self):
        fee = Fee.objects.create(
            amount="200.00",
            status="unpaid",
            student=self.student_b,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.delete(
            f"/api/fees/{fee.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertTrue(
            Fee.objects.filter(id=fee.id).exists()
        )

    def test_employee_cannot_list_users(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.get("/api/users/")

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_school_admin_sees_only_employee_users_in_own_school(self):
        own_user = User.objects.create_user(
            username="own_school_employee",
            password="EmployeePass123!",
            role="employee",
            school=self.school_a,
        )

        User.objects.create_user(
            username="other_school_employee",
            password="EmployeePass123!",
            role="employee",
            school=self.school_b,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {user["id"] for user in response.data}

        self.assertEqual(
            returned_ids,
            {self.employee.id, own_user.id},
        )

    def test_school_admin_cannot_move_employee_to_another_school(self):
        employee_user = User.objects.create_user(
            username="employee_move_test",
            password="EmployeePass123!",
            role="employee",
            school=self.school_a,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.patch(
            f"/api/users/{employee_user.id}/",
            {"school": self.school_b.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        employee_user.refresh_from_db()

        self.assertEqual(employee_user.school_id, self.school_a.id)

    def test_school_admin_cannot_delete_user_from_another_school(self):
        other_user = User.objects.create_user(
            username="other_school_delete_test",
            password="EmployeePass123!",
            role="employee",
            school=self.school_b,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.delete(
            f"/api/users/{other_user.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertTrue(
            User.objects.filter(id=other_user.id).exists()
        )
    def test_platform_owner_can_create_admin_for_any_school(self):
        self.client.force_authenticate(user=self.platform_owner)

        response = self.client.post(
            "/api/users/",
            {
                "username": "platform_created_admin",
                "password": "OwnerAdminPass123!",
                "full_name": "Platform Created Admin",
                "role": "school_admin",
                "school": self.school_b.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        created_user = User.objects.get(
            username="platform_created_admin"
        )

        self.assertEqual(created_user.role, "school_admin")
        self.assertEqual(created_user.school_id, self.school_b.id)
        self.assertTrue(
            created_user.check_password("OwnerAdminPass123!")
        )

    def test_platform_owner_can_update_user_password_securely(self):
        self.client.force_authenticate(user=self.platform_owner)

        response = self.client.patch(
            f"/api/users/{self.employee.id}/",
            {"password": "NewSecurePass123!"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.employee.refresh_from_db()

        self.assertTrue(
            self.employee.check_password("NewSecurePass123!")
        )
        self.assertNotEqual(
            self.employee.password,
            "NewSecurePass123!",
        )

    def test_school_admin_employee_school_is_assigned_when_omitted(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/users/",
            {
                "username": "auto_school_employee",
                "password": "EmployeePass123!",
                "full_name": "Auto School Employee",
                "role": "employee",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        created_user = User.objects.get(
            username="auto_school_employee"
        )

        self.assertEqual(
            created_user.school_id,
            self.school_a.id,
        )
        self.assertEqual(created_user.role, "employee")
        self.assertTrue(
            created_user.check_password("EmployeePass123!")
        )
    def test_school_admin_can_create_subject_in_own_school(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.post(
            "/api/subjects/",
            {"name": "Mathematics", "code": "MATH"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        subject = Subject.objects.get(code="MATH")
        self.assertEqual(subject.school_id, self.school_a.id)

    def test_platform_owner_can_create_subject_for_another_school(self):
        self.client.force_authenticate(user=self.platform_owner)
        response = self.client.post(
            "/api/subjects/",
            {
                "name": "Physics",
                "code": "PHY",
                "school": self.school_b.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Subject.objects.get(code="PHY").school_id, self.school_b.id
        )

    def test_school_admin_cannot_retrieve_other_school_subject(self):
        subject = Subject.objects.create(
            name="Foreign Subject",
            code="FOR",
            school=self.school_b,
        )
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get(f"/api/subjects/{subject.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_school_admin_can_create_exam_for_own_class(self):
        school_class = SchoolClass.objects.create(
            name="Math Class", section="A", school=self.school_a
        )
        subject = Subject.objects.create(
            name="Mathematics", code="MTH", school=self.school_a
        )
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.post(
            "/api/exams/",
            {
                "title": "Midterm",
                "subject": subject.id,
                "school_class": school_class.id,
                "exam_date": "2026-10-14",
                "total_marks": "100.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Exam.objects.get(title="Midterm").school_id, self.school_a.id
        )

    def test_school_admin_cannot_create_exam_for_another_school_class(self):
        school_class = SchoolClass.objects.create(
            name="Foreign Class", section="B", school=self.school_b
        )
        subject = Subject.objects.create(
            name="Mathematics", code="MTH2", school=self.school_a
        )
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.post(
            "/api/exams/",
            {
                "title": "Invalid Exam",
                "subject": subject.id,
                "school_class": school_class.id,
                "exam_date": "2026-10-14",
                "total_marks": "100.00",
            },
            format="json",
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST
        )

    def test_school_admin_cannot_retrieve_other_school_exam(self):
        school_class = SchoolClass.objects.create(
            name="Foreign Class", section="B", school=self.school_b
        )
        subject = Subject.objects.create(
            name="Biology", code="BIO", school=self.school_b
        )
        exam = Exam.objects.create(
            title="Foreign Exam",
            school=self.school_b,
            school_class=school_class,
            subject=subject,
            exam_date="2026-10-14",
            total_marks="100.00",
        )
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get(f"/api/exams/{exam.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_school_admin_can_create_grade_for_student_in_exam_class(self):
        school_class = SchoolClass.objects.create(
            name="Grade Class", section="A", school=self.school_a
        )
        self.student_a.school_class = school_class
        self.student_a.save()
        subject = Subject.objects.create(
            name="Mathematics", code="MTH3", school=self.school_a
        )
        exam = Exam.objects.create(
            title="Math Exam",
            school=self.school_a,
            school_class=school_class,
            subject=subject,
            exam_date="2026-10-14",
            total_marks="100.00",
        )
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.post(
            "/api/grades/",
            {
                "exam": exam.id,
                "student": self.student_a.id,
                "marks_obtained": "85.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Grade.objects.get(exam=exam, student=self.student_a).marks_obtained,
            85,
        )

    def test_school_admin_cannot_grade_student_outside_exam_class(self):
        school_class = SchoolClass.objects.create(
            name="Exam Class", section="A", school=self.school_a
        )
        subject = Subject.objects.create(
            name="Mathematics", code="MTH4", school=self.school_a
        )
        exam = Exam.objects.create(
            title="Math Exam",
            school=self.school_a,
            school_class=school_class,
            subject=subject,
            exam_date="2026-10-14",
            total_marks="100.00",
        )
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.post(
            "/api/grades/",
            {
                "exam": exam.id,
                "student": self.student_b.id,
                "marks_obtained": "70.00",
            },
            format="json",
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST
        )

    def test_school_admin_report_is_limited_to_own_school(self):
        class_a = SchoolClass.objects.create(
            name="Report A", section="A", school=self.school_a
        )
        class_b = SchoolClass.objects.create(
            name="Report B", section="B", school=self.school_b
        )
        self.student_a.school_class = class_a
        self.student_a.save()
        self.student_b.school_class = class_b
        self.student_b.save()

        subject_a = Subject.objects.create(
            name="Math A", code="RA", school=self.school_a
        )
        subject_b = Subject.objects.create(
            name="Math B", code="RB", school=self.school_b
        )
        exam_a = Exam.objects.create(
            title="Report Exam A",
            school=self.school_a,
            school_class=class_a,
            subject=subject_a,
            exam_date="2026-10-14",
            total_marks="100.00",
        )
        exam_b = Exam.objects.create(
            title="Report Exam B",
            school=self.school_b,
            school_class=class_b,
            subject=subject_b,
            exam_date="2026-10-14",
            total_marks="100.00",
        )
        grade_a = Grade.objects.create(
            exam=exam_a, student=self.student_a, marks_obtained="90.00"
        )
        Grade.objects.create(
            exam=exam_b, student=self.student_b, marks_obtained="80.00"
        )

        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/reports/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item["id"] for item in response.data], [grade_a.id]
        )

    def test_employee_can_list_only_own_school_exams(self):
        class_a = SchoolClass.objects.create(
            name="Employee Exam A", section="A", school=self.school_a
        )
        class_b = SchoolClass.objects.create(
            name="Employee Exam B", section="B", school=self.school_b
        )
        subject_a = Subject.objects.create(
            name="Math A", code="EMP-MA", school=self.school_a
        )
        subject_b = Subject.objects.create(
            name="Math B", code="EMP-MB", school=self.school_b
        )
        exam_a = Exam.objects.create(
            title="Own Exam",
            school=self.school_a,
            school_class=class_a,
            subject=subject_a,
            exam_date="2026-10-14",
            total_marks="100.00",
        )
        Exam.objects.create(
            title="Foreign Exam",
            school=self.school_b,
            school_class=class_b,
            subject=subject_b,
            exam_date="2026-10-14",
            total_marks="100.00",
        )

        self.client.force_authenticate(user=self.employee)
        response = self.client.get("/api/exams/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [exam_a.id])

    def test_employee_cannot_create_exam(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            "/api/exams/",
            {"title": "Forbidden Exam"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_create_subject(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            "/api/subjects/",
            {"name": "Forbidden Subject", "code": "NO-SUB"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_school_admin_cannot_grade_other_school_exam(self):
        class_b = SchoolClass.objects.create(
            name="Foreign Grade Class", section="B", school=self.school_b
        )
        self.student_b.school_class = class_b
        self.student_b.save()

        subject_b = Subject.objects.create(
            name="Foreign Grade Subject",
            code="FGS",
            school=self.school_b,
        )
        exam_b = Exam.objects.create(
            title="Foreign Grade Exam",
            school=self.school_b,
            school_class=class_b,
            subject=subject_b,
            exam_date="2026-10-14",
            total_marks="100.00",
        )

        self.client.force_authenticate(user=self.school_admin)
        response = self.client.post(
            "/api/grades/",
            {
                "exam": exam_b.id,
                "student": self.student_b.id,
                "marks_obtained": "75.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_school_admin_cannot_submit_marks_above_exam_total(self):
        class_a = SchoolClass.objects.create(
            name="Marks Limit Class", section="A", school=self.school_a
        )
        self.student_a.school_class = class_a
        self.student_a.save()

        subject_a = Subject.objects.create(
            name="Marks Limit Subject",
            code="MLS",
            school=self.school_a,
        )
        exam_a = Exam.objects.create(
            title="Marks Limit Exam",
            school=self.school_a,
            school_class=class_a,
            subject=subject_a,
            exam_date="2026-10-14",
            total_marks="100.00",
        )

        self.client.force_authenticate(user=self.school_admin)
        response = self.client.post(
            "/api/grades/",
            {
                "exam": exam_a.id,
                "student": self.student_a.id,
                "marks_obtained": "101.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("marks_obtained", response.data)

    def test_employee_cannot_retrieve_other_school_grade(self):
        class_b = SchoolClass.objects.create(
            name="Foreign Report Class", section="B", school=self.school_b
        )
        self.student_b.school_class = class_b
        self.student_b.save()

        subject_b = Subject.objects.create(
            name="Foreign Report Subject",
            code="FRS",
            school=self.school_b,
        )
        exam_b = Exam.objects.create(
            title="Foreign Report Exam",
            school=self.school_b,
            school_class=class_b,
            subject=subject_b,
            exam_date="2026-10-14",
            total_marks="100.00",
        )
        grade_b = Grade.objects.create(
            exam=exam_b,
            student=self.student_b,
            marks_obtained="80.00",
        )

        self.client.force_authenticate(user=self.employee)
        response = self.client.get(f"/api/grades/{grade_b.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_employee_cannot_create_grade(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            "/api/grades/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_school_admin_can_link_own_employee_login_to_profile(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/employees/",
            {
                "name": "Linked Employee",
                "position": "Teacher",
                "user": self.employee.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        profile = Employee.objects.get(name="Linked Employee")
        self.assertEqual(profile.school_id, self.school_a.id)
        self.assertEqual(profile.user_id, self.employee.id)

    def test_school_admin_cannot_link_other_school_employee_login(self):
        other_employee = User.objects.create_user(
            username="employee_account_school_b",
            password="EmployeePass123!",
            role="employee",
            school=self.school_b,
        )
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/employees/",
            {
                "name": "Invalid Linked Employee",
                "user": other_employee.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_school_admin_cannot_link_admin_login_to_employee_profile(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/employees/",
            {
                "name": "Invalid Admin Profile",
                "user": self.school_admin.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_platform_owner_can_link_employee_login_to_profile(self):
        other_employee = User.objects.create_user(
            username="platform_link_employee",
            password="EmployeePass123!",
            role="employee",
            school=self.school_b,
        )
        self.client.force_authenticate(user=self.platform_owner)

        response = self.client.post(
            "/api/employees/",
            {
                "name": "Platform Linked Employee",
                "school": self.school_b.id,
                "user": other_employee.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        profile = Employee.objects.get(name="Platform Linked Employee")
        self.assertEqual(profile.school_id, self.school_b.id)
        self.assertEqual(profile.user_id, other_employee.id)

    def test_employee_login_cannot_be_linked_to_multiple_profiles(self):
        Employee.objects.create(
            name="Existing Employee Profile",
            school=self.school_a,
            user=self.employee,
        )
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/employees/",
            {
                "name": "Duplicate Employee Profile",
                "user": self.employee.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_school_admin_can_create_employee_and_login_together(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/employees/",
            {
                "name": "New Login Teacher",
                "position": "Teacher",
                "username": "new_login_teacher",
                "password": "TeacherPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        profile = Employee.objects.get(name="New Login Teacher")
        account = User.objects.get(username="new_login_teacher")

        self.assertEqual(profile.school_id, self.school_a.id)
        self.assertEqual(profile.user_id, account.id)
        self.assertEqual(account.role, "employee")
        self.assertEqual(account.school_id, self.school_a.id)
        self.assertTrue(account.check_password("TeacherPass123!"))
        self.assertNotEqual(account.password, "TeacherPass123!")

    def test_platform_owner_can_create_employee_and_login_together(self):
        self.client.force_authenticate(user=self.platform_owner)

        response = self.client.post(
            "/api/employees/",
            {
                "name": "School B Teacher",
                "school": self.school_b.id,
                "username": "school_b_login_teacher",
                "password": "TeacherPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        profile = Employee.objects.get(name="School B Teacher")
        account = User.objects.get(username="school_b_login_teacher")

        self.assertEqual(profile.school_id, self.school_b.id)
        self.assertEqual(profile.user_id, account.id)
        self.assertEqual(account.school_id, self.school_b.id)
        self.assertEqual(account.role, "employee")

    def test_employee_creation_rejects_missing_password(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/employees/",
            {
                "name": "Incomplete Login",
                "username": "incomplete_login_teacher",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            Employee.objects.filter(name="Incomplete Login").exists()
        )
        self.assertFalse(
            User.objects.filter(username="incomplete_login_teacher").exists()
        )

    def test_employee_creation_rejects_duplicate_username(self):
        self.client.force_authenticate(user=self.school_admin)

        response = self.client.post(
            "/api/employees/",
            {
                "name": "Duplicate Login",
                "username": self.employee.username,
                "password": "TeacherPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            Employee.objects.filter(name="Duplicate Login").exists()
        )

    def test_employee_cannot_record_attendance_as_another_employee(self):
        own_profile = Employee.objects.create(
            name="Own Teacher",
            school=self.school_a,
            user=self.employee,
        )
        other_profile = Employee.objects.create(
            name="Other Teacher",
            school=self.school_a,
        )

        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            "/api/attendance/",
            {
                "date": "2026-10-14",
                "status": "present",
                "student": self.student_a.id,
                "employee": other_profile.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertFalse(
            Attendance.objects.filter(
                student=self.student_a,
                date="2026-10-14",
            ).exists()
        )
        self.assertIsNotNone(own_profile.id)

    def test_employee_without_profile_cannot_record_attendance(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            "/api/attendance/",
            {
                "date": "2026-10-14",
                "status": "present",
                "student": self.student_a.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertFalse(
            Attendance.objects.filter(
                student=self.student_a,
                date="2026-10-14",
            ).exists()
        )
    def test_student_summary_calculates_average_and_is_school_scoped(self):
        class_a = SchoolClass.objects.create(
            name="Summary A",
            section="A",
            school=self.school_a,
        )
        class_b = SchoolClass.objects.create(
            name="Summary B",
            section="B",
            school=self.school_b,
        )

        self.student_a.school_class = class_a
        self.student_a.save()
        self.student_b.school_class = class_b
        self.student_b.save()

        subject_a = Subject.objects.create(
            name="Math A",
            code="SUM-MA",
            school=self.school_a,
        )
        subject_b = Subject.objects.create(
            name="Math B",
            code="SUM-MB",
            school=self.school_b,
        )

        exam_a = Exam.objects.create(
            title="Summary Exam A",
            school=self.school_a,
            school_class=class_a,
            subject=subject_a,
            exam_date="2026-10-14",
            total_marks="100.00",
        )
        exam_b = Exam.objects.create(
            title="Summary Exam B",
            school=self.school_b,
            school_class=class_b,
            subject=subject_b,
            exam_date="2026-10-14",
            total_marks="100.00",
        )

        Grade.objects.create(
            exam=exam_a,
            student=self.student_a,
            marks_obtained="80.00",
        )
        Grade.objects.create(
            exam=exam_b,
            student=self.student_b,
            marks_obtained="99.00",
        )

        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/reports/student-summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["student_id"],
            self.student_a.id,
        )
        self.assertEqual(response.data[0]["average_marks"], 80.0)
        self.assertEqual(response.data[0]["average_percentage"], 80.0)

    def test_class_summary_calculates_average_and_is_school_scoped(self):
        class_a = SchoolClass.objects.create(
            name="Average Class A",
            section="A",
            school=self.school_a,
        )
        class_b = SchoolClass.objects.create(
            name="Average Class B",
            section="B",
            school=self.school_b,
        )

        self.student_a.school_class = class_a
        self.student_a.save()
        self.student_b.school_class = class_b
        self.student_b.save()

        subject_a = Subject.objects.create(
            name="Math A",
            code="CLASS-AVG-A",
            school=self.school_a,
        )
        subject_b = Subject.objects.create(
            name="Math B",
            code="CLASS-AVG-B",
            school=self.school_b,
        )

        exam_a = Exam.objects.create(
            title="Average Exam A",
            school=self.school_a,
            school_class=class_a,
            subject=subject_a,
            exam_date="2026-10-14",
            total_marks="100.00",
        )
        exam_b = Exam.objects.create(
            title="Average Exam B",
            school=self.school_b,
            school_class=class_b,
            subject=subject_b,
            exam_date="2026-10-14",
            total_marks="100.00",
        )

        Grade.objects.create(
            exam=exam_a,
            student=self.student_a,
            marks_obtained="75.00",
        )
        Grade.objects.create(
            exam=exam_b,
            student=self.student_b,
            marks_obtained="95.00",
        )

        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/reports/class-summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["class_id"], class_a.id)
        self.assertEqual(response.data[0]["student_count"], 1)
        self.assertEqual(response.data[0]["average_percentage"], 75.0)

    def test_class_summary_calculates_average(self):
        school_class = SchoolClass.objects.create(
            name="Average Class",
            section="A",
            school=self.school_a,
        )

        self.student_a.school_class = school_class
        self.student_a.save()

        subject = Subject.objects.create(
            name="Mathematics",
            code="AVG-MATH",
            school=self.school_a,
        )

        exam = Exam.objects.create(
            title="Math Exam",
            school=self.school_a,
            school_class=school_class,
            subject=subject,
            exam_date="2026-10-14",
            total_marks="100.00",
        )

        Grade.objects.create(
            exam=exam,
            student=self.student_a,
            marks_obtained="75.00",
        )

        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/reports/class-summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["class_id"],
            school_class.id,
        )
        self.assertEqual(
            response.data[0]["average_percentage"],
            75.0,
        )
    def test_class_summary_only_returns_own_school_classes(self):
        class_a = SchoolClass.objects.create(
            name="School A Class",
            section="A",
            school=self.school_a,
        )
        class_b = SchoolClass.objects.create(
            name="School B Class",
            section="B",
            school=self.school_b,
        )

        self.student_a.school_class = class_a
        self.student_a.save()
        self.student_b.school_class = class_b
        self.student_b.save()

        subject_a = Subject.objects.create(
            name="Math A",
            code="ISO-MATH-A",
            school=self.school_a,
        )
        subject_b = Subject.objects.create(
            name="Math B",
            code="ISO-MATH-B",
            school=self.school_b,
        )

        exam_a = Exam.objects.create(
            title="Exam A",
            school=self.school_a,
            school_class=class_a,
            subject=subject_a,
            exam_date="2026-10-14",
            total_marks="100.00",
        )
        exam_b = Exam.objects.create(
            title="Exam B",
            school=self.school_b,
            school_class=class_b,
            subject=subject_b,
            exam_date="2026-10-14",
            total_marks="100.00",
        )

        Grade.objects.create(
            exam=exam_a,
            student=self.student_a,
            marks_obtained="70.00",
        )
        Grade.objects.create(
            exam=exam_b,
            student=self.student_b,
            marks_obtained="95.00",
        )

        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/reports/class-summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["class_id"],
            class_a.id,
        )
        self.assertEqual(
            response.data[0]["average_percentage"],
            70.0,
        )
    def test_financial_summary_only_counts_fees_from_own_school(self):
        Fee.objects.create(
            amount="120.00",
            status="paid",
            student=self.student_a,
        )
        Fee.objects.create(
            amount="80.00",
            status="unpaid",
            student=self.student_a,
        )
        Fee.objects.create(
            amount="900.00",
            status="paid",
            student=self.student_b,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.get("/api/fees/financial-summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["fee_count"], 2)
        self.assertEqual(response.data["paid_count"], 1)
        self.assertEqual(response.data["unpaid_count"], 1)
        self.assertEqual(response.data["total_amount"], 200.0)
        self.assertEqual(response.data["paid_amount"], 120.0)
        self.assertEqual(response.data["unpaid_amount"], 80.0)
    def test_attendance_summary_only_counts_own_school_records(self):
        Attendance.objects.create(
            date="2026-10-14",
            status="present",
            student=self.student_a,
        )
        Attendance.objects.create(
            date="2026-10-15",
            status="absent",
            student=self.student_a,
        )
        Attendance.objects.create(
            date="2026-10-14",
            status="late",
            student=self.student_b,
        )

        self.client.force_authenticate(user=self.school_admin)

        response = self.client.get("/api/attendance/summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["record_count"], 2)
        self.assertEqual(response.data["present_count"], 1)
        self.assertEqual(response.data["absent_count"], 1)
        self.assertEqual(response.data["late_count"], 0)