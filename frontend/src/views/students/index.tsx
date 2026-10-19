import { useEffect, useMemo, useState } from "react";
import { Eye, Search, Users } from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface Student {
  id: number;

  first_name: string;
  last_name: string;
  admission_number: string;

  date_of_birth: string | null;
  gender: string | null;

  phone: string | null;
  address: string | null;

  school: number | null;
  school_name: string | null;

  classroom: number | null;
  classroom_name: string | null;

  parent_name: string | null;
  parent_phone: string | null;

  created_at: string;
}


export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiFetch("/api/students/");

        const studentList = Array.isArray(data)
          ? data
          : data.results || [];

        setStudents(studentList);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load students. Please make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);


  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const fullName =
        `${student.first_name} ${student.last_name}`.toLowerCase();

      return (
        fullName.includes(query) ||
        student.admission_number
          ?.toLowerCase()
          .includes(query) ||
        student.school_name
          ?.toLowerCase()
          .includes(query) ||
        student.classroom_name
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [students, search]);


  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-semibold">
            Students
          </h1>

          <p className="text-sm text-muted-foreground">
            View and manage students in the school system.
          </p>
        </div>

        <Badge
          variant="secondary"
          className="w-fit px-3 py-1.5"
        >
          <Users className="mr-2 h-4 w-4" />
          {students.length} Students
        </Badge>

      </div>


      <Card>

        <CardHeader className="space-y-4">

          <CardTitle>
            Student Directory
          </CardTitle>

          <div className="relative max-w-md">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search students..."
              style={{ paddingLeft: "2.5rem" }}
            />

          </div>

        </CardHeader>


        <CardContent>

          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading students...
            </div>
          )}


          {!loading && error && (
            <div className="py-10 text-center text-sm text-destructive">
              {error}
            </div>
          )}


          {!loading &&
            !error &&
            filteredStudents.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No students found.
              </div>
            )}


          {!loading &&
            !error &&
            filteredStudents.length > 0 && (

              <div className="overflow-x-auto">

                <Table>

                  <TableHeader>

                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Parent</TableHead>

                      <TableHead className="text-right">
                        Actions
                      </TableHead>
                    </TableRow>

                  </TableHeader>


                  <TableBody>

                    {filteredStudents.map((student) => (

                      <TableRow key={student.id}>

                        <TableCell className="font-medium">
                          {student.first_name}{" "}
                          {student.last_name}
                        </TableCell>


                        <TableCell>
                          {student.admission_number || "-"}
                        </TableCell>


                        <TableCell>
                          {student.school_name || "-"}
                        </TableCell>


                        <TableCell>
                          {student.classroom_name || "-"}
                        </TableCell>


                        <TableCell>

                          {student.gender ? (
                            <Badge variant="outline">
                              {student.gender}
                            </Badge>
                          ) : (
                            "-"
                          )}

                        </TableCell>


                        <TableCell>
                          {student.phone || "-"}
                        </TableCell>


                        <TableCell>

                          <div className="flex flex-col">

                            <span>
                              {student.parent_name || "-"}
                            </span>

                            {student.parent_phone && (
                              <span className="text-xs text-muted-foreground">
                                {student.parent_phone}
                              </span>
                            )}

                          </div>

                        </TableCell>


                        <TableCell className="text-right">

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedStudent(student)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>

                        </TableCell>

                      </TableRow>

                    ))}

                  </TableBody>

                </Table>

              </div>

            )}

        </CardContent>

      </Card>


      <Dialog
        open={selectedStudent !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStudent(null);
          }
        }}
      >

        <DialogContent className="sm:max-w-2xl">

          {selectedStudent && (
            <>

              <DialogHeader>

                <DialogTitle>
                  {selectedStudent.first_name}{" "}
                  {selectedStudent.last_name}
                </DialogTitle>

                <DialogDescription>
                  Student information and enrollment details.
                </DialogDescription>

              </DialogHeader>


              <div className="grid gap-5 py-4 sm:grid-cols-2">

                <StudentDetail
                  label="Admission Number"
                  value={selectedStudent.admission_number}
                />

                <StudentDetail
                  label="Date of Birth"
                  value={selectedStudent.date_of_birth}
                />

                <StudentDetail
                  label="Gender"
                  value={selectedStudent.gender}
                />

                <StudentDetail
                  label="Phone"
                  value={selectedStudent.phone}
                />

                <StudentDetail
                  label="School"
                  value={selectedStudent.school_name}
                />

                <StudentDetail
                  label="Class"
                  value={selectedStudent.classroom_name}
                />

                <StudentDetail
                  label="Parent Name"
                  value={selectedStudent.parent_name}
                />

                <StudentDetail
                  label="Parent Phone"
                  value={selectedStudent.parent_phone}
                />

                <div className="sm:col-span-2">

                  <StudentDetail
                    label="Address"
                    value={selectedStudent.address}
                  />

                </div>

              </div>

            </>
          )}

        </DialogContent>

      </Dialog>

    </div>
  );
}


function StudentDetail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-1">

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="text-sm font-medium">
        {value || "-"}
      </p>

    </div>
  );
}