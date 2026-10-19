import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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


interface SchoolOption {
  id: number;
  school_name: string;
}


interface ClassroomOption {
  id: number;
  school: number;
  school_name: string;
  class_name: string;
  section: string;
}


interface CurrentUser {
  role: string;
}


interface StudentForm {
  first_name: string;
  last_name: string;
  admission_number: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  address: string;
  school: string;
  classroom: string;
  parent_name: string;
  parent_phone: string;
}


const emptyStudentForm: StudentForm = {
  first_name: "",
  last_name: "",
  admission_number: "",
  date_of_birth: "",
  gender: "",
  phone: "",
  address: "",
  school: "",
  classroom: "",
  parent_name: "",
  parent_phone: "",
};


function getList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray(
      (data as { results?: unknown }).results
    )
  ) {
    return (data as { results: T[] }).results;
  }

  return [];
}


export default function StudentsPage() {

  const [students, setStudents] =
    useState<Student[]>([]);

  const [schools, setSchools] =
    useState<SchoolOption[]>([]);

  const [classrooms, setClassrooms] =
    useState<ClassroomOption[]>([]);

  const [currentRole, setCurrentRole] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState<Student | null>(null);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingStudent,
    setEditingStudent,
  ] = useState<Student | null>(null);

  const [
    deletingStudent,
    setDeletingStudent,
  ] = useState<Student | null>(null);

  const [
    studentForm,
    setStudentForm,
  ] = useState<StudentForm>(
    emptyStudentForm
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [deleteError, setDeleteError] =
    useState("");


  const canManageStudents =
    currentRole === "OWNER" ||
    currentRole === "ADMIN";


  const loadStudents = async () => {

    const data =
      await apiFetch("/api/students/");

    setStudents(
      getList<Student>(data)
    );

  };


  useEffect(() => {

    const loadPage = async () => {

      try {

        setLoading(true);
        setError("");

        const [
          studentData,
          schoolData,
          classroomData,
          userData,
        ] = await Promise.all([
          apiFetch("/api/students/"),
          apiFetch("/api/schools/"),
          apiFetch(
            "/api/academics/classes/"
          ),
          apiFetch("/api/accounts/me/"),
        ]);


        setStudents(
          getList<Student>(
            studentData
          )
        );


        setSchools(
          getList<SchoolOption>(
            schoolData
          )
        );


        setClassrooms(
          getList<ClassroomOption>(
            classroomData
          )
        );


        const currentUser =
          userData as CurrentUser;

        setCurrentRole(
          currentUser.role || ""
        );

      } catch (err) {

        console.error(err);

        setError(
          "Unable to load students. Please make sure the backend is running."
        );

      } finally {

        setLoading(false);

      }

    };


    loadPage();

  }, []);


  const filteredStudents =
    useMemo(() => {

      const query =
        search
          .toLowerCase()
          .trim();


      if (!query) {
        return students;
      }


      return students.filter(
        (student) => {

          const fullName =
            `${student.first_name} ${student.last_name}`
              .toLowerCase();


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

        }
      );

    }, [
      students,
      search,
    ]);


  const availableClassrooms =
    useMemo(() => {

      if (!studentForm.school) {
        return [];
      }


      return classrooms.filter(
        (classroom) =>
          String(
            classroom.school
          ) ===
          studentForm.school
      );

    }, [
      classrooms,
      studentForm.school,
    ]);


    const selectedSchool =
  schools.find(
    (school) =>
      String(school.id) ===
      studentForm.school
  );


const selectedClassroom =
  classrooms.find(
    (classroom) =>
      String(classroom.id) ===
      studentForm.classroom
  );


const schoolHasClasses = (
  schoolId: number
) => {
  return classrooms.some(
    (classroom) =>
      classroom.school === schoolId
  );
};


  const updateForm = (
    field: keyof StudentForm,
    value: string
  ) => {

    setStudentForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );

  };


  const openAddStudent = () => {

    const defaultSchool =
      schools.length === 1
        ? String(schools[0].id)
        : "";


    setEditingStudent(null);

    setStudentForm({
      ...emptyStudentForm,
      school: defaultSchool,
    });

    setFormError("");

    setFormOpen(true);

  };


  const openEditStudent = (
    student: Student
  ) => {

    setEditingStudent(student);

    setStudentForm({

      first_name:
        student.first_name || "",

      last_name:
        student.last_name || "",

      admission_number:
        student.admission_number || "",

      date_of_birth:
        student.date_of_birth || "",

      gender:
        student.gender || "",

      phone:
        student.phone || "",

      address:
        student.address || "",

      school:
        student.school
          ? String(student.school)
          : "",

      classroom:
        student.classroom
          ? String(student.classroom)
          : "",

      parent_name:
        student.parent_name || "",

      parent_phone:
        student.parent_phone || "",

    });

    setFormError("");

    setFormOpen(true);

  };


  const closeForm = () => {

    setFormOpen(false);

    setEditingStudent(null);

    setStudentForm(
      emptyStudentForm
    );

    setFormError("");

  };


  const handleSaveStudent =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();

      setFormError("");


      if (
        !studentForm.first_name ||
        !studentForm.last_name ||
        !studentForm.admission_number ||
        !studentForm.date_of_birth ||
        !studentForm.gender ||
        !studentForm.school ||
        !studentForm.classroom ||
        !studentForm.parent_name ||
        !studentForm.parent_phone
      ) {

        setFormError(
          "Please complete all required fields."
        );

        return;

      }


      try {

        setSaving(true);


        const payload = {

          first_name:
            studentForm.first_name.trim(),

          last_name:
            studentForm.last_name.trim(),

          admission_number:
            studentForm.admission_number.trim(),

          date_of_birth:
            studentForm.date_of_birth,

          gender:
            studentForm.gender,

          phone:
            studentForm.phone.trim(),

          address:
            studentForm.address.trim(),

          school:
            Number(
              studentForm.school
            ),

          classroom:
            Number(
              studentForm.classroom
            ),

          parent_name:
            studentForm.parent_name.trim(),

          parent_phone:
            studentForm.parent_phone.trim(),

        };


        if (editingStudent) {

          await apiFetch(
            `/api/students/${editingStudent.id}/`,
            {
              method: "PATCH",
              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        } else {

          await apiFetch(
            "/api/students/",
            {
              method: "POST",
              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        }


        await loadStudents();

        closeForm();

      } catch (err) {

        console.error(err);

        setFormError(
          editingStudent
            ? "Unable to update the student. Check the information and try again."
            : "Unable to create the student. Check the information and try again."
        );

      } finally {

        setSaving(false);

      }

    };


  const handleDeleteStudent =
    async () => {

      if (!deletingStudent) {
        return;
      }


      try {

        setDeleting(true);
        setDeleteError("");


        await apiFetch(
          `/api/students/${deletingStudent.id}/`,
          {
            method: "DELETE",
          }
        );


        await loadStudents();

        setDeletingStudent(null);

      } catch (err) {

        console.error(err);

        setDeleteError(
          "Unable to delete this student."
        );

      } finally {

        setDeleting(false);

      }

    };


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


        <div className="flex flex-wrap items-center gap-3">


          {canManageStudents && (

            <Button
              onClick={
                openAddStudent
              }
            >

              <Plus className="mr-2 h-4 w-4" />

              Add Student

            </Button>

          )}


          <Badge
            variant="secondary"
            className="w-fit px-3 py-1.5"
          >

            <Users className="mr-2 h-4 w-4" />

            {students.length} Students

          </Badge>


        </div>


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
            filteredStudents.length ===
              0 && (

              <div className="py-10 text-center text-sm text-muted-foreground">
                No students found.
              </div>

            )}


          {!loading &&
            !error &&
            filteredStudents.length >
              0 && (

              <div className="overflow-x-auto">


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
                        School
                      </TableHead>

                      <TableHead>
                        Class
                      </TableHead>

                      <TableHead>
                        Gender
                      </TableHead>

                      <TableHead>
                        Phone
                      </TableHead>

                      <TableHead>
                        Parent
                      </TableHead>

                      <TableHead className="text-right">
                        Actions
                      </TableHead>

                    </TableRow>

                  </TableHeader>


                  <TableBody>


                    {filteredStudents.map(
                      (student) => (

                        <TableRow
                          key={
                            student.id
                          }
                        >


                          <TableCell className="font-medium">

                            {
                              student.first_name
                            }{" "}

                            {
                              student.last_name
                            }

                          </TableCell>


                          <TableCell>

                            {
                              student.admission_number ||
                              "-"
                            }

                          </TableCell>


                          <TableCell>

                            {
                              student.school_name ||
                              "-"
                            }

                          </TableCell>


                          <TableCell>

                            {
                              student.classroom_name ||
                              "-"
                            }

                          </TableCell>


                          <TableCell>

                            {student.gender ? (

                              <Badge variant="outline">

                                {
                                  student.gender
                                }

                              </Badge>

                            ) : (

                              "-"

                            )}

                          </TableCell>


                          <TableCell>

                            {
                              student.phone ||
                              "-"
                            }

                          </TableCell>


                          <TableCell>


                            <div className="flex flex-col">

                              <span>

                                {
                                  student.parent_name ||
                                  "-"
                                }

                              </span>


                              {
                                student.parent_phone &&
                                (

                                  <span className="text-xs text-muted-foreground">

                                    {
                                      student.parent_phone
                                    }

                                  </span>

                                )
                              }

                            </div>


                          </TableCell>


                          <TableCell>


                            <div className="flex justify-end gap-2">


                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedStudent(
                                    student
                                  )
                                }
                              >

                                <Eye className="h-4 w-4" />

                                <span className="hidden lg:inline">
                                  View
                                </span>

                              </Button>


                              {canManageStudents && (
                                <>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openEditStudent(
                                        student
                                      )
                                    }
                                  >

                                    <Pencil className="h-4 w-4" />

                                    <span className="hidden lg:inline">
                                      Edit
                                    </span>

                                  </Button>


                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {

                                      setDeleteError("");

                                      setDeletingStudent(
                                        student
                                      );

                                    }}
                                  >

                                    <Trash2 className="h-4 w-4" />

                                    <span className="hidden lg:inline">
                                      Delete
                                    </span>

                                  </Button>

                                </>
                              )}


                            </div>


                          </TableCell>


                        </TableRow>

                      )
                    )}


                  </TableBody>


                </Table>


              </div>

            )}


        </CardContent>


      </Card>


      {/* ADD / EDIT DIALOG */}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {

          if (!open) {

            closeForm();

          } else {

            setFormOpen(true);

          }

        }}
      >

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">


          <DialogHeader>

            <DialogTitle>

              {editingStudent
                ? "Edit Student"
                : "Add Student"}

            </DialogTitle>

            <DialogDescription>

              {editingStudent
                ? "Update the student's information."
                : "Enter the student's personal and enrollment information."}

            </DialogDescription>

          </DialogHeader>


          <form
            onSubmit={
              handleSaveStudent
            }
            className="space-y-6"
          >


            <div className="grid gap-4 sm:grid-cols-2">


              <FormField label="First Name *">

                <Input
                  value={
                    studentForm.first_name
                  }
                  onChange={(event) =>
                    updateForm(
                      "first_name",
                      event.target.value
                    )
                  }
                  required
                />

              </FormField>


              <FormField label="Last Name *">

                <Input
                  value={
                    studentForm.last_name
                  }
                  onChange={(event) =>
                    updateForm(
                      "last_name",
                      event.target.value
                    )
                  }
                  required
                />

              </FormField>


              <FormField label="Admission Number *">

                <Input
                  value={
                    studentForm.admission_number
                  }
                  onChange={(event) =>
                    updateForm(
                      "admission_number",
                      event.target.value
                    )
                  }
                  required
                />

              </FormField>


              <FormField label="Date of Birth *">

                <Input
                  type="date"
                  value={
                    studentForm.date_of_birth
                  }
                  onChange={(event) =>
                    updateForm(
                      "date_of_birth",
                      event.target.value
                    )
                  }
                  required
                />

              </FormField>


              <FormField label="Gender *">

                <Select
                  value={
                    studentForm.gender
                  }
                  onValueChange={(value) =>
                    updateForm(
                      "gender",
                      value ?? ""
                    )
                  }
                >

                  <SelectTrigger className="w-full">

                    <SelectValue placeholder="Select gender" />

                  </SelectTrigger>


                  <SelectContent>

                    <SelectItem value="Male">
                      Male
                    </SelectItem>

                    <SelectItem value="Female">
                      Female
                    </SelectItem>

                    <SelectItem value="Other">
                      Other
                    </SelectItem>

                  </SelectContent>

                </Select>

              </FormField>


              <FormField label="Phone">

                <Input
                  value={
                    studentForm.phone
                  }
                  onChange={(event) =>
                    updateForm(
                      "phone",
                      event.target.value
                    )
                  }
                />

              </FormField>


             <FormField label="School *">

  <Select
    value={studentForm.school}
    onValueChange={(value) => {
      setStudentForm(
        (previous) => ({
          ...previous,
          school: value ?? "",
          classroom: "",
        })
      );
    }}
  >

    <SelectTrigger className="w-full">

      <span>
        {selectedSchool
          ? selectedSchool.school_name
          : "Select school"}
      </span>

    </SelectTrigger>


    <SelectContent>

      {schools.map((school) => {

        const hasClasses =
          schoolHasClasses(
            school.id
          );

        return (

          <SelectItem
            key={school.id}
            value={String(
              school.id
            )}
            disabled={!hasClasses}
          >

            {school.school_name}

            {!hasClasses
              ? " (No classes)"
              : ""}

          </SelectItem>

        );

      })}

    </SelectContent>

  </Select>

</FormField>


              <FormField label="Class *">

  <Select
    value={studentForm.classroom}
    onValueChange={(value) =>
      updateForm(
        "classroom",
        value ?? ""
      )
    }
    disabled={
      !studentForm.school ||
      availableClassrooms.length === 0
    }
  >

    <SelectTrigger className="w-full">

      <span>

        {!studentForm.school
          ? "Select school first"

          : availableClassrooms.length === 0
            ? "No classes available for this school"

            : selectedClassroom
              ? `${selectedClassroom.class_name}${
                  selectedClassroom.section
                    ? ` - ${selectedClassroom.section}`
                    : ""
                }`

              : "Select class"}

      </span>

    </SelectTrigger>


    <SelectContent>

      {availableClassrooms.map(
        (classroom) => (

          <SelectItem
            key={classroom.id}
            value={String(
              classroom.id
            )}
          >

            {classroom.class_name}

            {classroom.section
              ? ` - ${classroom.section}`
              : ""}

          </SelectItem>

        )
      )}

    </SelectContent>

  </Select>

</FormField>


              <FormField label="Parent / Guardian Name *">

                <Input
                  value={
                    studentForm.parent_name
                  }
                  onChange={(event) =>
                    updateForm(
                      "parent_name",
                      event.target.value
                    )
                  }
                  required
                />

              </FormField>


              <FormField label="Parent / Guardian Phone *">

                <Input
                  value={
                    studentForm.parent_phone
                  }
                  onChange={(event) =>
                    updateForm(
                      "parent_phone",
                      event.target.value
                    )
                  }
                  required
                />

              </FormField>


              <div className="sm:col-span-2">

                <FormField label="Address">

                  <Textarea
                    value={
                      studentForm.address
                    }
                    onChange={(event) =>
                      updateForm(
                        "address",
                        event.target.value
                      )
                    }
                    rows={3}
                  />

                </FormField>

              </div>


            </div>


            {formError && (

              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">

                <p className="text-sm text-destructive">
                  {formError}
                </p>

              </div>

            )}


            <DialogFooter>


              <Button
                type="button"
                variant="outline"
                onClick={
                  closeForm
                }
                disabled={saving}
              >
                Cancel
              </Button>


              <Button
                type="submit"
                disabled={saving}
              >

                {saving
                  ? "Saving..."
                  : editingStudent
                    ? "Save Changes"
                    : "Add Student"}

              </Button>


            </DialogFooter>


          </form>


        </DialogContent>

      </Dialog>


      {/* VIEW DIALOG */}

      <Dialog
        open={
          selectedStudent !== null
        }
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

                  {
                    selectedStudent.first_name
                  }{" "}

                  {
                    selectedStudent.last_name
                  }

                </DialogTitle>

                <DialogDescription>
                  Student information and enrollment details.
                </DialogDescription>

              </DialogHeader>


              <div className="grid gap-5 py-4 sm:grid-cols-2">


                <StudentDetail
                  label="Admission Number"
                  value={
                    selectedStudent.admission_number
                  }
                />


                <StudentDetail
                  label="Date of Birth"
                  value={
                    selectedStudent.date_of_birth
                  }
                />


                <StudentDetail
                  label="Gender"
                  value={
                    selectedStudent.gender
                  }
                />


                <StudentDetail
                  label="Phone"
                  value={
                    selectedStudent.phone
                  }
                />


                <StudentDetail
                  label="School"
                  value={
                    selectedStudent.school_name
                  }
                />


                <StudentDetail
                  label="Class"
                  value={
                    selectedStudent.classroom_name
                  }
                />


                <StudentDetail
                  label="Parent Name"
                  value={
                    selectedStudent.parent_name
                  }
                />


                <StudentDetail
                  label="Parent Phone"
                  value={
                    selectedStudent.parent_phone
                  }
                />


                <div className="sm:col-span-2">

                  <StudentDetail
                    label="Address"
                    value={
                      selectedStudent.address
                    }
                  />

                </div>


              </div>


            </>
          )}


        </DialogContent>

      </Dialog>


      {/* DELETE CONFIRMATION */}

      <Dialog
        open={
          deletingStudent !== null
        }
        onOpenChange={(open) => {

          if (
            !open &&
            !deleting
          ) {

            setDeletingStudent(
              null
            );

            setDeleteError("");

          }

        }}
      >

        <DialogContent className="sm:max-w-md">


          <DialogHeader>

            <DialogTitle>
              Delete Student?
            </DialogTitle>

            <DialogDescription>

              {deletingStudent
                ? `Are you sure you want to delete ${deletingStudent.first_name} ${deletingStudent.last_name}? This action cannot be undone.`
                : ""}

            </DialogDescription>

          </DialogHeader>


          {deleteError && (

            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">

              <p className="text-sm text-destructive">
                {deleteError}
              </p>

            </div>

          )}


          <DialogFooter>


            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => {

                setDeletingStudent(
                  null
                );

                setDeleteError("");

              }}
            >
              Cancel
            </Button>


            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={
                handleDeleteStudent
              }
            >

              <Trash2 className="mr-2 h-4 w-4" />

              {deleting
                ? "Deleting..."
                : "Delete Student"}

            </Button>


          </DialogFooter>


        </DialogContent>

      </Dialog>


    </div>

  );

}


function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {

  return (

    <div className="space-y-2">

      <Label>
        {label}
      </Label>

      {children}

    </div>

  );

}


function StudentDetail({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | number
    | null
    | undefined;
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