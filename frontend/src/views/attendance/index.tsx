import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CheckCircle2,
  Clock3,
  Save,
  Search,
  UserX,
  Users,
} from "lucide-react";

import { apiFetch } from "@/api/client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "UNMARKED";


interface Classroom {
  id: number;
  school: number;
  school_name: string;
  class_name: string;
  section: string;
}


interface Student {
  id: number;
  first_name: string;
  last_name: string;
  admission_number: string;
  school: number;
  school_name: string;
  classroom: number;
  classroom_name: string;
}


interface AttendanceRecord {
  id: number;
  student: number;
  date: string;
  status:
    | "PRESENT"
    | "ABSENT"
    | "LATE";
  marked_by_name: string | null;
}


interface CurrentUser {
  role: string;
  school: number | null;
  classroom: number | null;
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


function getToday() {

  const now = new Date();

  const local = new Date(
    now.getTime() -
    now.getTimezoneOffset() * 60000
  );

  return local
    .toISOString()
    .slice(0, 10);
}


export default function AttendancePage() {

  const [
    classrooms,
    setClassrooms,
  ] = useState<Classroom[]>([]);

  const [
    students,
    setStudents,
  ] = useState<Student[]>([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<CurrentUser | null>(
    null
  );

  const [
    selectedClass,
    setSelectedClass,
  ] = useState("");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getToday()
  );

  const [
    statuses,
    setStatuses,
  ] = useState<
    Record<
      number,
      AttendanceStatus
    >
  >({});

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingAttendance,
    setLoadingAttendance,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");


  const canEdit =
    currentUser?.role === "OWNER" ||
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "TEACHER";


  useEffect(() => {

    const loadPage =
      async () => {

        try {

          setLoading(true);
          setError("");


          const [
            classData,
            studentData,
            userData,
          ] = await Promise.all([

            apiFetch(
              "/api/academics/classes/"
            ),

            apiFetch(
              "/api/students/"
            ),

            apiFetch(
              "/api/accounts/me/"
            ),

          ]);


          const allClasses =
            getList<Classroom>(
              classData
            );

          const allStudents =
            getList<Student>(
              studentData
            );

          const user =
            userData as CurrentUser;


          setCurrentUser(user);

          setStudents(
            allStudents
          );


          const visibleClasses =
            user.role === "TEACHER"
            && user.classroom
              ? allClasses.filter(
                  (classroom) =>
                    classroom.id ===
                    user.classroom
                )
              : allClasses;


          setClassrooms(
            visibleClasses
          );


          if (
            visibleClasses.length > 0
          ) {

            setSelectedClass(
              String(
                visibleClasses[0].id
              )
            );

          }


        } catch (err) {

          console.error(err);

          setError(
            "Unable to load attendance data."
          );

        } finally {

          setLoading(false);

        }

      };


    loadPage();

  }, []);


  const classStudents =
    useMemo(() => {

      if (!selectedClass) {
        return [];
      }


      return students.filter(
        (student) =>
          String(
            student.classroom
          ) ===
          selectedClass
      );

    }, [
      students,
      selectedClass,
    ]);


  useEffect(() => {

    if (
      !selectedClass ||
      !selectedDate
    ) {

      setStatuses({});

      return;
    }


    const loadAttendance =
      async () => {

        try {

          setLoadingAttendance(true);

          setError("");

          setMessage("");


          const data =
            await apiFetch(
              `/api/attendance/?classroom=${selectedClass}&date=${selectedDate}`
            );


          const records =
            getList<AttendanceRecord>(
              data
            );


          const nextStatuses:
            Record<
              number,
              AttendanceStatus
            > = {};


          classStudents.forEach(
            (student) => {

              nextStatuses[
                student.id
              ] = "UNMARKED";

            }
          );


          records.forEach(
            (record) => {

              nextStatuses[
                record.student
              ] = record.status;

            }
          );


          setStatuses(
            nextStatuses
          );


        } catch (err) {

          console.error(err);

          setError(
            "Unable to load attendance for this class and date."
          );

        } finally {

          setLoadingAttendance(
            false
          );

        }

      };


    loadAttendance();

  }, [
    selectedClass,
    selectedDate,
    classStudents,
  ]);


  const filteredStudents =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      if (!query) {
        return classStudents;
      }


      return classStudents.filter(
        (student) => {

          const fullName =
            `${student.first_name} ${student.last_name}`
              .toLowerCase();


          return (
            fullName.includes(query) ||
            student.admission_number
              .toLowerCase()
              .includes(query)
          );

        }
      );

    }, [
      classStudents,
      search,
    ]);


  const countStatus = (
    status: AttendanceStatus
  ) => {

    return classStudents.filter(
      (student) =>
        (
          statuses[
            student.id
          ] || "UNMARKED"
        ) === status
    ).length;

  };


  const presentCount =
    countStatus("PRESENT");

  const absentCount =
    countStatus("ABSENT");

  const lateCount =
    countStatus("LATE");

  const unmarkedCount =
    countStatus("UNMARKED");


  const selectedClassData =
    classrooms.find(
      (classroom) =>
        String(
          classroom.id
        ) ===
        selectedClass
    );


  const setStudentStatus = (
    studentId: number,
    status: AttendanceStatus
  ) => {

    setStatuses(
      (previous) => ({
        ...previous,
        [studentId]: status,
      })
    );

    setMessage("");

  };


  const markAllPresent =
    () => {

      const next = {
        ...statuses,
      };


      classStudents.forEach(
        (student) => {

          next[
            student.id
          ] = "PRESENT";

        }
      );


      setStatuses(next);

      setMessage("");

    };


  const saveAttendance =
    async () => {

      if (
        !selectedClass ||
        !selectedDate
      ) {
        return;
      }


      try {

        setSaving(true);

        setError("");

        setMessage("");


        await apiFetch(
          "/api/attendance/bulk/",
          {
            method: "POST",

            body:
              JSON.stringify({

                classroom:
                  Number(
                    selectedClass
                  ),

                date:
                  selectedDate,

                records:
                  classStudents.map(
                    (student) => ({
                      student:
                        student.id,

                      status:
                        statuses[
                          student.id
                        ] ||
                        "UNMARKED",
                    })
                  ),

              }),
          }
        );


        setMessage(
          "Attendance saved successfully."
        );


      } catch (err) {

        console.error(err);

        setError(
          "Unable to save attendance."
        );

      } finally {

        setSaving(false);

      }

    };


  return (

    <div className="space-y-6">


      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-semibold">
            Attendance
          </h1>

          <p className="text-sm text-muted-foreground">
            Record and review daily student attendance.
          </p>

        </div>


        {canEdit &&
          selectedClass && (

          <div className="flex gap-2">

            <Button
              variant="outline"
              onClick={
                markAllPresent
              }
              disabled={
                classStudents.length ===
                0
              }
            >

              <CheckCircle2 className="mr-2 h-4 w-4" />

              Mark All Present

            </Button>


            <Button
              onClick={
                saveAttendance
              }
              disabled={
                saving ||
                classStudents.length === 0
              }
            >

              <Save className="mr-2 h-4 w-4" />

              {saving
                ? "Saving..."
                : "Save Attendance"}

            </Button>

          </div>

        )}

      </div>


      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Present"
          value={presentCount}
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
        />

        <StatCard
          title="Absent"
          value={absentCount}
          icon={
            <UserX className="h-5 w-5" />
          }
        />

        <StatCard
          title="Late"
          value={lateCount}
          icon={
            <Clock3 className="h-5 w-5" />
          }
        />

        <StatCard
          title="Unmarked"
          value={unmarkedCount}
          icon={
            <Users className="h-5 w-5" />
          }
        />

      </div>


      <Card>

        <CardHeader className="space-y-4">

          <CardTitle>
            Daily Attendance
          </CardTitle>


          <div className="flex flex-col gap-3 lg:flex-row">


            <Select
              value={selectedClass}
              onValueChange={(value) => {

                setSelectedClass(
                  value ?? ""
                );

                setSearch("");

              }}
            >

              <SelectTrigger className="w-full lg:w-72">

                <span>

                  {selectedClassData
                    ? `${selectedClassData.class_name} - ${selectedClassData.section}`
                    : "Select class"}

                </span>

              </SelectTrigger>


              <SelectContent>

                {classrooms.map(
                  (classroom) => (

                    <SelectItem
                      key={
                        classroom.id
                      }
                      value={String(
                        classroom.id
                      )}
                    >

                      {classroom.class_name}
                      {" - "}
                      {classroom.section}

                      {currentUser?.role ===
                        "OWNER"
                        ? ` • ${classroom.school_name}`
                        : ""}

                    </SelectItem>

                  )
                )}

              </SelectContent>

            </Select>


            <Input
              type="date"
              value={
                selectedDate
              }
              onChange={(event) =>
                setSelectedDate(
                  event.target.value
                )
              }
              className="w-full lg:w-48"
            />


            <div className="relative w-full max-w-md">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search students..."
                style={{
                  paddingLeft:
                    "2.5rem",
                }}
              />

            </div>

          </div>

        </CardHeader>


        <CardContent>


          {message && (

            <div className="mb-4 rounded-lg border px-4 py-3">

              <p className="text-sm font-medium">
                {message}
              </p>

            </div>

          )}


          {error && (

            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">

              <p className="text-sm text-destructive">
                {error}
              </p>

            </div>

          )}


          {loading ||
          loadingAttendance ? (

            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading attendance...
            </div>

          ) : !selectedClass ? (

            <div className="py-10 text-center text-sm text-muted-foreground">
              Select a class to manage attendance.
            </div>

          ) : classStudents.length ===
            0 ? (

            <div className="py-10 text-center text-sm text-muted-foreground">
              No students are assigned to this class.
            </div>

          ) : filteredStudents.length ===
            0 ? (

            <div className="py-10 text-center text-sm text-muted-foreground">
              No students match your search.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>
                      Student
                    </TableHead>

                    <TableHead>
                      Admission Number
                    </TableHead>

                    <TableHead>
                      Class
                    </TableHead>

                    <TableHead>
                      Date
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>

                  </TableRow>

                </TableHeader>


                <TableBody>

                  {filteredStudents.map(
                    (student) => {

                      const status =
                        statuses[
                          student.id
                        ] ||
                        "UNMARKED";


                      return (

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
                            {student.classroom_name}
                          </TableCell>


                          <TableCell>
                            {selectedDate}
                          </TableCell>


                          <TableCell>

                            {canEdit ? (

                              <Select
                                value={status}
                                onValueChange={(value) =>
                                  setStudentStatus(
                                    student.id,
                                    (
                                      value ??
                                      "UNMARKED"
                                    ) as AttendanceStatus
                                  )
                                }
                              >

                                <SelectTrigger className="w-36">

                                  <span>
                                    {statusLabel(
                                      status
                                    )}
                                  </span>

                                </SelectTrigger>


                                <SelectContent>

                                  <SelectItem value="PRESENT">
                                    Present
                                  </SelectItem>

                                  <SelectItem value="ABSENT">
                                    Absent
                                  </SelectItem>

                                  <SelectItem value="LATE">
                                    Late
                                  </SelectItem>

                                  <SelectItem value="UNMARKED">
                                    Unmarked
                                  </SelectItem>

                                </SelectContent>

                              </Select>

                            ) : (

                              <StatusBadge
                                status={
                                  status
                                }
                              />

                            )}

                          </TableCell>

                        </TableRow>

                      );

                    }
                  )}

                </TableBody>

              </Table>

            </div>

          )}

        </CardContent>

      </Card>

    </div>

  );

}


function statusLabel(
  status: AttendanceStatus
) {

  switch (status) {

    case "PRESENT":
      return "Present";

    case "ABSENT":
      return "Absent";

    case "LATE":
      return "Late";

    default:
      return "Unmarked";

  }

}


function StatusBadge({
  status,
}: {
  status: AttendanceStatus;
}) {

  if (status === "ABSENT") {

    return (
      <Badge variant="destructive">
        Absent
      </Badge>
    );

  }


  if (status === "LATE") {

    return (
      <Badge variant="secondary">
        Late
      </Badge>
    );

  }


  if (status === "PRESENT") {

    return (
      <Badge>
        Present
      </Badge>
    );

  }


  return (
    <Badge variant="outline">
      Unmarked
    </Badge>
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