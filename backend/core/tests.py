from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.models import School, User, Student, SchoolClass

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