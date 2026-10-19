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
  UserRound,
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
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface Teacher {
  id: number;

  username: string;
  email: string;
  full_name: string;
  role: string;

  school: number | null;
  school_name: string | null;

  classroom: number | null;
  classroom_name: string | null;
  classroom_section: string | null;
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


interface TeacherForm {
  username: string;
  full_name: string;
  email: string;
  password: string;
  school: string;
  classroom: string;
}


const emptyTeacherForm: TeacherForm = {
  username: "",
  full_name: "",
  email: "",
  password: "",
  school: "",
  classroom: "none",
};


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


export default function TeachersPage() {

  const [
    teachers,
    setTeachers,
  ] = useState<Teacher[]>([]);


  const [
    schools,
    setSchools,
  ] = useState<SchoolOption[]>([]);


  const [
    classrooms,
    setClassrooms,
  ] = useState<ClassroomOption[]>([]);


  const [
    currentRole,
    setCurrentRole,
  ] = useState("");


  const [
    selectedTeacher,
    setSelectedTeacher,
  ] = useState<Teacher | null>(
    null
  );


  const [
    editingTeacher,
    setEditingTeacher,
  ] = useState<Teacher | null>(
    null
  );


  const [
    deletingTeacher,
    setDeletingTeacher,
  ] = useState<Teacher | null>(
    null
  );


  const [
    teacherForm,
    setTeacherForm,
  ] = useState<TeacherForm>(
    emptyTeacherForm
  );


  const [
    formOpen,
    setFormOpen,
  ] = useState(false);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    deleting,
    setDeleting,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    formError,
    setFormError,
  ] = useState("");


  const [
    deleteError,
    setDeleteError,
  ] = useState("");


  const canManageTeachers =
    currentRole === "OWNER" ||
    currentRole === "ADMIN";


  const loadTeachers =
    async () => {

      const data =
        await apiFetch(
          "/api/accounts/teachers/"
        );


      setTeachers(
        getList<Teacher>(
          data
        )
      );

    };


  useEffect(() => {

    const loadPage =
      async () => {

        try {

          setLoading(true);

          setError("");


          const [
            teacherData,
            schoolData,
            classroomData,
            userData,
          ] = await Promise.all([

            apiFetch(
              "/api/accounts/teachers/"
            ),

            apiFetch(
              "/api/schools/"
            ),

            apiFetch(
              "/api/academics/classes/"
            ),

            apiFetch(
              "/api/accounts/me/"
            ),

          ]);


          setTeachers(
            getList<Teacher>(
              teacherData
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
            "Unable to load teachers. Please make sure the backend is running."
          );

        } finally {

          setLoading(false);

        }

      };


    loadPage();

  }, []);


  const filteredTeachers =
    useMemo(() => {

      const query =
        search
          .toLowerCase()
          .trim();


      if (!query) {
        return teachers;
      }


      return teachers.filter(
        (teacher) => {

          const name =
            teacher.full_name
              ?.toLowerCase() || "";


          const username =
            teacher.username
              ?.toLowerCase() || "";


          const email =
            teacher.email
              ?.toLowerCase() || "";


          const school =
            teacher.school_name
              ?.toLowerCase() || "";


          return (
            name.includes(query) ||
            username.includes(query) ||
            email.includes(query) ||
            school.includes(query)
          );

        }
      );

    }, [
      teachers,
      search,
    ]);


  const availableClassrooms =
    useMemo(() => {

      if (!teacherForm.school) {
        return [];
      }


      return classrooms.filter(
        (classroom) =>
          String(
            classroom.school
          ) ===
          teacherForm.school
      );

    }, [
      classrooms,
      teacherForm.school,
    ]);


  const selectedSchool =
    schools.find(
      (school) =>
        String(
          school.id
        ) ===
        teacherForm.school
    );


  const selectedClassroom =
    classrooms.find(
      (classroom) =>
        String(
          classroom.id
        ) ===
        teacherForm.classroom
    );


  const updateForm = (
    field: keyof TeacherForm,
    value: string
  ) => {

    setTeacherForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );

  };


  const openAddTeacher =
    () => {

      const defaultSchool =
        schools.length === 1
          ? String(
              schools[0].id
            )
          : "";


      setEditingTeacher(null);


      setTeacherForm({
        ...emptyTeacherForm,
        school: defaultSchool,
      });


      setFormError("");

      setFormOpen(true);

    };


  const openEditTeacher = (
    teacher: Teacher
  ) => {

    setEditingTeacher(
      teacher
    );


    setTeacherForm({

      username:
        teacher.username || "",

      full_name:
        teacher.full_name || "",

      email:
        teacher.email || "",

      password: "",

      school:
        teacher.school
          ? String(
              teacher.school
            )
          : "",

      classroom:
        teacher.classroom
          ? String(
              teacher.classroom
            )
          : "none",

    });


    setFormError("");

    setFormOpen(true);

  };


  const closeForm =
    () => {

      setFormOpen(false);

      setEditingTeacher(null);

      setTeacherForm(
        emptyTeacherForm
      );

      setFormError("");

    };


  const handleSaveTeacher =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();

      setFormError("");


      if (
        !teacherForm.username ||
        !teacherForm.full_name ||
        !teacherForm.school
      ) {

        setFormError(
          "Please complete all required fields."
        );

        return;

      }


      if (
        !editingTeacher &&
        !teacherForm.password
      ) {

        setFormError(
          "Password is required when creating a teacher."
        );

        return;

      }


      try {

        setSaving(true);


        const payload: {
          username: string;
          full_name: string;
          email: string;
          school: number;
          classroom: number | null;
          password?: string;
        } = {

          username:
            teacherForm.username.trim(),

          full_name:
            teacherForm.full_name.trim(),

          email:
            teacherForm.email.trim(),

          school:
            Number(
              teacherForm.school
            ),

          classroom:
            teacherForm.classroom &&
            teacherForm.classroom !==
              "none"
              ? Number(
                  teacherForm.classroom
                )
              : null,

        };


        if (
          teacherForm.password
        ) {

          payload.password =
            teacherForm.password;

        }


        if (editingTeacher) {

          await apiFetch(
            `/api/accounts/teachers/${editingTeacher.id}/`,
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
            "/api/accounts/teachers/",
            {
              method: "POST",

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        }


        await loadTeachers();

        closeForm();


      } catch (err) {

        console.error(err);


        setFormError(
          editingTeacher
            ? "Unable to update the teacher. Check the information and try again."
            : "Unable to create the teacher. The username may already exist."
        );


      } finally {

        setSaving(false);

      }

    };


  const handleDeleteTeacher =
    async () => {

      if (!deletingTeacher) {
        return;
      }


      try {

        setDeleting(true);

        setDeleteError("");


        await apiFetch(
          `/api/accounts/teachers/${deletingTeacher.id}/`,
          {
            method: "DELETE",
          }
        );


        await loadTeachers();


        setDeletingTeacher(
          null
        );


      } catch (err) {

        console.error(err);


        setDeleteError(
          "Unable to delete this teacher."
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
            Teachers
          </h1>


          <p className="text-sm text-muted-foreground">
            View and manage teachers in the school system.
          </p>

        </div>


        <div className="flex flex-wrap items-center gap-3">


          {canManageTeachers && (

            <Button
              onClick={
                openAddTeacher
              }
            >

              <Plus className="mr-2 h-4 w-4" />

              Add Teacher

            </Button>

          )}


          <Badge
            variant="secondary"
            className="w-fit px-3 py-1.5"
          >

            <Users className="mr-2 h-4 w-4" />

            {teachers.length} Teachers

          </Badge>


        </div>


      </div>


      <Card>


        <CardHeader className="space-y-4">


          <CardTitle>
            Teacher Directory
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
              placeholder="Search teachers..."
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
              Loading teachers...
            </div>

          )}


          {!loading && error && (

            <div className="py-10 text-center text-sm text-destructive">
              {error}
            </div>

          )}


          {!loading &&
            !error &&
            filteredTeachers.length ===
              0 && (

              <div className="py-10 text-center text-sm text-muted-foreground">
                No teachers found.
              </div>

            )}


          {!loading &&
            !error &&
            filteredTeachers.length >
              0 && (

              <div className="overflow-x-auto">


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
                        School
                      </TableHead>

                      <TableHead>
                        Class
                      </TableHead>

                      <TableHead>
                        Email
                      </TableHead>

                      <TableHead className="text-right">
                        Actions
                      </TableHead>

                    </TableRow>

                  </TableHeader>


                  <TableBody>


                    {filteredTeachers.map(
                      (teacher) => (

                        <TableRow
                          key={
                            teacher.id
                          }
                        >


                          <TableCell>


                            <div className="flex items-center gap-3">


                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">

                                <UserRound className="h-4 w-4" />

                              </div>


                              <span className="font-medium">

                                {teacher.full_name ||
                                  teacher.username}

                              </span>


                            </div>


                          </TableCell>


                          <TableCell>
                            {teacher.username}
                          </TableCell>


                          <TableCell>
                            {teacher.school_name || "-"}
                          </TableCell>


                          <TableCell>

                            {teacher.classroom_name
                              ? `${teacher.classroom_name}${
                                  teacher.classroom_section
                                    ? ` - ${teacher.classroom_section}`
                                    : ""
                                }`
                              : "Not assigned"}

                          </TableCell>


                          <TableCell>
                            {teacher.email || "-"}
                          </TableCell>


                          <TableCell>


                            <div className="flex justify-end gap-2">


                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedTeacher(
                                    teacher
                                  )
                                }
                              >

                                <Eye className="h-4 w-4" />

                                <span className="hidden lg:inline">
                                  View
                                </span>

                              </Button>


                              {canManageTeachers && (
                                <>


                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openEditTeacher(
                                        teacher
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

                                      setDeletingTeacher(
                                        teacher
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


      {/* ADD / EDIT */}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {

          if (!open) {
            closeForm();
          }

        }}
      >

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">


          <DialogHeader>


            <DialogTitle>

              {editingTeacher
                ? "Edit Teacher"
                : "Add Teacher"}

            </DialogTitle>


            <DialogDescription>

              {editingTeacher
                ? "Update the teacher account and school assignment."
                : "Create a new teacher account."}

            </DialogDescription>


          </DialogHeader>


          <form
            onSubmit={
              handleSaveTeacher
            }
            className="space-y-6"
          >


            <div className="grid gap-4 sm:grid-cols-2">


              <FormField label="Full Name *">

                <Input
                  value={
                    teacherForm.full_name
                  }
                  onChange={(event) =>
                    updateForm(
                      "full_name",
                      event.target.value
                    )
                  }
                  required
                />

              </FormField>


              <FormField label="Username *">

                <Input
                  value={
                    teacherForm.username
                  }
                  onChange={(event) =>
                    updateForm(
                      "username",
                      event.target.value
                    )
                  }
                  required
                />

              </FormField>


              <FormField label="Email">

                <Input
                  type="email"
                  value={
                    teacherForm.email
                  }
                  onChange={(event) =>
                    updateForm(
                      "email",
                      event.target.value
                    )
                  }
                />

              </FormField>


              <FormField
                label={
                  editingTeacher
                    ? "New Password"
                    : "Password *"
                }
              >

                <Input
                  type="password"
                  value={
                    teacherForm.password
                  }
                  onChange={(event) =>
                    updateForm(
                      "password",
                      event.target.value
                    )
                  }
                  placeholder={
                    editingTeacher
                      ? "Leave blank to keep current password"
                      : "Minimum 6 characters"
                  }
                  required={
                    !editingTeacher
                  }
                />

              </FormField>


              <FormField label="School *">

                <Select
                  value={
                    teacherForm.school
                  }
                  onValueChange={(value) => {

                    setTeacherForm(
                      (previous) => ({
                        ...previous,
                        school:
                          value ?? "",
                        classroom:
                          "none",
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


                    {schools.map(
                      (school) => (

                        <SelectItem
                          key={
                            school.id
                          }
                          value={String(
                            school.id
                          )}
                        >

                          {
                            school.school_name
                          }

                        </SelectItem>

                      )
                    )}


                  </SelectContent>


                </Select>

              </FormField>


              <FormField label="Classroom">

                <Select
                  value={
                    teacherForm.classroom
                  }
                  onValueChange={(value) =>
                    updateForm(
                      "classroom",
                      value ?? "none"
                    )
                  }
                  disabled={
                    !teacherForm.school
                  }
                >


                  <SelectTrigger className="w-full">

                    <span>

                      {!teacherForm.school
                        ? "Select school first"

                        : teacherForm.classroom ===
                            "none"
                          ? "No classroom assigned"

                          : selectedClassroom
                            ? `${selectedClassroom.class_name}${
                                selectedClassroom.section
                                  ? ` - ${selectedClassroom.section}`
                                  : ""
                              }`

                            : "Select classroom"}

                    </span>

                  </SelectTrigger>


                  <SelectContent>


                    <SelectItem value="none">
                      No classroom assigned
                    </SelectItem>


                    {availableClassrooms.map(
                      (classroom) => (

                        <SelectItem
                          key={
                            classroom.id
                          }
                          value={String(
                            classroom.id
                          )}
                        >

                          {
                            classroom.class_name
                          }

                          {
                            classroom.section
                              ? ` - ${classroom.section}`
                              : ""
                          }

                        </SelectItem>

                      )
                    )}


                  </SelectContent>


                </Select>

              </FormField>


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
                  : editingTeacher
                    ? "Save Changes"
                    : "Add Teacher"}

              </Button>


            </DialogFooter>


          </form>


        </DialogContent>

      </Dialog>


      {/* VIEW */}

      <Dialog
        open={
          selectedTeacher !== null
        }
        onOpenChange={(open) => {

          if (!open) {
            setSelectedTeacher(null);
          }

        }}
      >

        <DialogContent className="sm:max-w-lg">


          {selectedTeacher && (
            <>


              <DialogHeader>

                <DialogTitle>

                  {selectedTeacher.full_name ||
                    selectedTeacher.username}

                </DialogTitle>

                <DialogDescription>
                  Teacher account and assignment information.
                </DialogDescription>

              </DialogHeader>


              <div className="grid gap-5 py-4 sm:grid-cols-2">


                <TeacherDetail
                  label="Full Name"
                  value={
                    selectedTeacher.full_name
                  }
                />


                <TeacherDetail
                  label="Username"
                  value={
                    selectedTeacher.username
                  }
                />


                <TeacherDetail
                  label="Email"
                  value={
                    selectedTeacher.email
                  }
                />


                <TeacherDetail
                  label="Role"
                  value={
                    selectedTeacher.role
                  }
                />


                <TeacherDetail
                  label="School"
                  value={
                    selectedTeacher.school_name
                  }
                />


                <TeacherDetail
                  label="Classroom"
                  value={
                    selectedTeacher.classroom_name
                      ? `${selectedTeacher.classroom_name}${
                          selectedTeacher.classroom_section
                            ? ` - ${selectedTeacher.classroom_section}`
                            : ""
                        }`
                      : "Not assigned"
                  }
                />


              </div>


            </>
          )}


        </DialogContent>

      </Dialog>


      {/* DELETE */}

      <Dialog
        open={
          deletingTeacher !== null
        }
        onOpenChange={(open) => {

          if (
            !open &&
            !deleting
          ) {

            setDeletingTeacher(
              null
            );

            setDeleteError("");

          }

        }}
      >

        <DialogContent className="sm:max-w-md">


          <DialogHeader>

            <DialogTitle>
              Delete Teacher?
            </DialogTitle>

            <DialogDescription>

              {deletingTeacher
                ? `Are you sure you want to delete ${deletingTeacher.full_name || deletingTeacher.username}? This action cannot be undone.`
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
              variant="outline"
              disabled={deleting}
              onClick={() =>
                setDeletingTeacher(
                  null
                )
              }
            >
              Cancel
            </Button>


            <Button
              variant="destructive"
              disabled={deleting}
              onClick={
                handleDeleteTeacher
              }
            >

              <Trash2 className="mr-2 h-4 w-4" />

              {deleting
                ? "Deleting..."
                : "Delete Teacher"}

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


function TeacherDetail({
  label,
  value,
}: {
  label: string;
  value:
    | string
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