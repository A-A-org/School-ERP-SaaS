import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  School as SchoolIcon,
  Users,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router";

import { apiFetch } from "@/api/client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface School {
  id: number;
  school_name: string;
  address: string;
  phone: string;
  email: string;
  create_date: string;

  student_count: number;
  teacher_count: number;
  class_count: number;
  employee_count: number;
}


interface Student {
  id: number;
  school: number;

  first_name: string;
  last_name: string;

  admission_number: string;

  classroom_name?: string;
}


interface Teacher {
  id: number;

  full_name: string;

  username: string;

  school: number | null;

  classroom_name?: string;
}


interface Classroom {
  id: number;

  school: number;

  school_name: string;

  class_name: string;

  section: string;

  student_count: number;
  teacher_count: number;
}


function getList<T>(
  data: unknown
): T[] {

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray(
      (
        data as {
          results?: unknown;
        }
      ).results
    )
  ) {
    return (
      data as {
        results: T[];
      }
    ).results;
  }

  return [];
}


export default function SchoolDetailsPage() {

  const { id } = useParams();

  const schoolId =
    Number(id);


  const [
    school,
    setSchool,
  ] = useState<School | null>(
    null
  );


  const [
    students,
    setStudents,
  ] = useState<Student[]>([]);


  const [
    teachers,
    setTeachers,
  ] = useState<Teacher[]>([]);


  const [
    classes,
    setClasses,
  ] = useState<Classroom[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {

    const loadPage =
      async () => {

        try {

          setLoading(true);

          setError("");


          const [
            schoolData,
            studentData,
            teacherData,
            classData,
          ] = await Promise.all([

            apiFetch(
              `/api/schools/${schoolId}/`
            ),

            apiFetch(
              "/api/students/"
            ),

            apiFetch(
              "/api/accounts/teachers/"
            ),

            apiFetch(
              "/api/academics/classes/"
            ),

          ]);


          setSchool(
            schoolData as School
          );


          setStudents(
            getList<Student>(
              studentData
            )
          );


          setTeachers(
            getList<Teacher>(
              teacherData
            )
          );


          setClasses(
            getList<Classroom>(
              classData
            )
          );


        } catch (err) {

          console.error(err);

          setError(
            "Unable to load school information."
          );

        } finally {

          setLoading(false);

        }

      };


    if (
      Number.isFinite(
        schoolId
      )
    ) {
      loadPage();
    }

  }, [schoolId]);


  const schoolStudents =
    useMemo(
      () =>
        students.filter(
          (student) =>
            student.school ===
            schoolId
        ),
      [
        students,
        schoolId,
      ]
    );


  const schoolTeachers =
    useMemo(
      () =>
        teachers.filter(
          (teacher) =>
            teacher.school ===
            schoolId
        ),
      [
        teachers,
        schoolId,
      ]
    );


  const schoolClasses =
    useMemo(
      () =>
        classes.filter(
          (classroom) =>
            classroom.school ===
            schoolId
        ),
      [
        classes,
        schoolId,
      ]
    );


  if (loading) {

    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading school...
      </div>
    );

  }


  if (
    error ||
    !school
  ) {

    return (
      <div className="space-y-4">

        <Link
  to="/schools"
  className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
>
  <ArrowLeft className="mr-2 h-4 w-4" />
  Back to Schools
</Link>

        <p className="text-destructive">
          {error || "School not found."}
        </p>

      </div>
    );

  }


  return (

    <div className="space-y-6">


      <div>

        <Link
  to="/schools"
  className="mb-3 inline-flex h-9 items-center rounded-md px-3 text-sm font-medium hover:bg-muted"
>
  <ArrowLeft className="mr-2 h-4 w-4" />
  Schools
</Link>


        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">

                <SchoolIcon className="h-6 w-6" />

              </div>

              <div>

                <h1 className="text-2xl font-semibold">
                  {school.school_name}
                </h1>

                <p className="text-sm text-muted-foreground">
                  School overview and management
                </p>

              </div>

            </div>

          </div>


         <Link
  to="/schools"
  className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
>
  Edit from Schools
</Link>

        </div>

      </div>


      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Students"
          value={
            school.student_count
          }
          icon={
            <GraduationCap className="h-5 w-5" />
          }
        />

        <StatCard
          title="Teachers"
          value={
            school.teacher_count
          }
          icon={
            <Users className="h-5 w-5" />
          }
        />

        <StatCard
          title="Classes"
          value={
            school.class_count
          }
          icon={
            <BookOpen className="h-5 w-5" />
          }
        />

        <StatCard
          title="Employees"
          value={
            school.employee_count
          }
          icon={
            <Users className="h-5 w-5" />
          }
        />

      </div>


      <Card>

        <CardHeader>

          <CardTitle>
            School Information
          </CardTitle>

        </CardHeader>


        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <Info
            icon={
              <MapPin className="h-4 w-4" />
            }
            label="Address"
            value={
              school.address
            }
          />

          <Info
            icon={
              <Phone className="h-4 w-4" />
            }
            label="Phone"
            value={
              school.phone
            }
          />

          <Info
            icon={
              <Mail className="h-4 w-4" />
            }
            label="Email"
            value={
              school.email
            }
          />

          <Info
            icon={
              <SchoolIcon className="h-4 w-4" />
            }
            label="Created"
            value={
              new Date(
                school.create_date
              ).toLocaleDateString()
            }
          />

        </CardContent>

      </Card>


      <div className="grid gap-6 xl:grid-cols-2">


        <Card>

          <CardHeader className="flex flex-row items-center justify-between">

            <CardTitle>
              Students
            </CardTitle>

            <Link
  to="/students"
  className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
>
  All Students
</Link>

          </CardHeader>


          <CardContent>

            {schoolStudents.length ===
              0 ? (

              <EmptyText text="No students in this school." />

            ) : (

              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>
                      Student
                    </TableHead>

                    <TableHead>
                      Admission No.
                    </TableHead>

                    <TableHead>
                      Class
                    </TableHead>

                  </TableRow>

                </TableHeader>


                <TableBody>

                  {schoolStudents
                    .slice(
                      0,
                      6
                    )
                    .map(
                      (student) => (

                        <TableRow
                          key={
                            student.id
                          }
                        >

                          <TableCell className="font-medium">

                            {student.first_name}
                            {" "}
                            {student.last_name}

                          </TableCell>

                          <TableCell>
                            {student.admission_number}
                          </TableCell>

                          <TableCell>
                            {student.classroom_name || "—"}
                          </TableCell>

                        </TableRow>

                      )
                    )}

                </TableBody>

              </Table>

            )}

          </CardContent>

        </Card>


        <Card>

          <CardHeader className="flex flex-row items-center justify-between">

            <CardTitle>
              Teachers
            </CardTitle>

            <Link
  to="/teachers"
  className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
>
  All Teachers
</Link>

          </CardHeader>


          <CardContent>

            {schoolTeachers.length ===
              0 ? (

              <EmptyText text="No teachers in this school." />

            ) : (

              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>
                      Teacher
                    </TableHead>

                    <TableHead>
                      Username
                    </TableHead>

                    <TableHead>
                      Class
                    </TableHead>

                  </TableRow>

                </TableHeader>


                <TableBody>

                  {schoolTeachers
                    .slice(
                      0,
                      6
                    )
                    .map(
                      (teacher) => (

                        <TableRow
                          key={
                            teacher.id
                          }
                        >

                          <TableCell className="font-medium">

                            {teacher.full_name ||
                              teacher.username}

                          </TableCell>

                          <TableCell>
                            {teacher.username}
                          </TableCell>

                          <TableCell>
                            {teacher.classroom_name || "—"}
                          </TableCell>

                        </TableRow>

                      )
                    )}

                </TableBody>

              </Table>

            )}

          </CardContent>

        </Card>


      </div>


      <Card>

        <CardHeader className="flex flex-row items-center justify-between">

          <CardTitle>
            Classes
          </CardTitle>

          <Link
  to="/classes"
  className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
>
  All Classes
</Link>

        </CardHeader>


        <CardContent>

          {schoolClasses.length ===
            0 ? (

            <EmptyText text="No classes in this school." />

          ) : (

            <Table>

              <TableHeader>

                <TableRow>

                  <TableHead>
                    Class
                  </TableHead>

                  <TableHead>
                    Section
                  </TableHead>

                  <TableHead>
                    Students
                  </TableHead>

                  <TableHead>
                    Teachers
                  </TableHead>

                </TableRow>

              </TableHeader>


              <TableBody>

                {schoolClasses.map(
                  (classroom) => (

                    <TableRow
                      key={
                        classroom.id
                      }
                    >

                      <TableCell className="font-medium">
                        {classroom.class_name}
                      </TableCell>

                      <TableCell>
                        {classroom.section}
                      </TableCell>

                      <TableCell>
                        {classroom.student_count}
                      </TableCell>

                      <TableCell>
                        {classroom.teacher_count}
                      </TableCell>

                    </TableRow>

                  )
                )}

              </TableBody>

            </Table>

          )}

        </CardContent>

      </Card>


      <div className="grid gap-4 md:grid-cols-3">

        <QuickLink
          title="Attendance"
          description="Open attendance management"
          to="/attendance"
        />

        <QuickLink
          title="Finance"
          description="Fees and payroll"
          to="/finance"
        />

        <QuickLink
          title="Students"
          description="Manage student records"
          to="/students"
        />

      </div>


    </div>

  );

}


function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) {

  return (

    <Card>

      <CardContent className="flex items-center gap-8 p-5">

        <div>

          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {value}
          </p>

        </div>


        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>

      </CardContent>

    </Card>

  );

}


function Info({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-lg border p-4">

      <div className="mb-2 flex items-center gap-2 text-muted-foreground">

        {icon}

        <span className="text-xs font-medium uppercase">
          {label}
        </span>

      </div>

      <p className="text-sm font-medium">
        {value}
      </p>

    </div>

  );

}


function EmptyText({
  text,
}: {
  text: string;
}) {

  return (

    <div className="py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>

  );

}


function QuickLink({
  title,
  description,
  to,
}: {
  title: string;
  description: string;
  to: string;
}) {

  return (

    <Link to={to}>

      <Card className="h-full transition hover:bg-muted/40">

        <CardContent className="p-5">

          <p className="font-medium">
            {title}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>

        </CardContent>

      </Card>

    </Link>

  );

}