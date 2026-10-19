import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  BookOpen,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  School,
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

import {
  Input,
} from "@/components/ui/input";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Label,
} from "@/components/ui/label";

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


interface Classroom {
  id: number;

  school: number;
  school_name: string;

  class_name: string;
  section: string;

  student_count: number;
  teacher_count: number;
  subject_count: number;
  exam_count: number;
}


interface SchoolOption {
  id: number;
  school_name: string;
}


interface CurrentUser {
  role: string;
}


interface ClassroomForm {
  school: string;
  class_name: string;
  section: string;
}


const emptyForm: ClassroomForm = {
  school: "",
  class_name: "",
  section: "",
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


export default function ClassesPage() {

  const [
    classrooms,
    setClassrooms,
  ] = useState<Classroom[]>([]);


  const [
    schools,
    setSchools,
  ] = useState<SchoolOption[]>([]);


  const [
    currentRole,
    setCurrentRole,
  ] = useState("");


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    schoolFilter,
    setSchoolFilter,
  ] = useState("all");


  const [
    selectedClassroom,
    setSelectedClassroom,
  ] = useState<Classroom | null>(
    null
  );


  const [
    editingClassroom,
    setEditingClassroom,
  ] = useState<Classroom | null>(
    null
  );


  const [
    deletingClassroom,
    setDeletingClassroom,
  ] = useState<Classroom | null>(
    null
  );


  const [
    form,
    setForm,
  ] = useState<ClassroomForm>(
    emptyForm
  );


  const [
    formOpen,
    setFormOpen,
  ] = useState(false);


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


  const canManage =
    currentRole === "OWNER" ||
    currentRole === "ADMIN";


  const loadClasses = async () => {

    const data =
      await apiFetch(
        "/api/academics/classes/"
      );


    setClassrooms(
      getList<Classroom>(data)
    );

  };


  useEffect(() => {

    const loadPage =
      async () => {

        try {

          setLoading(true);
          setError("");


          const [
            classroomData,
            schoolData,
            userData,
          ] = await Promise.all([

            apiFetch(
              "/api/academics/classes/"
            ),

            apiFetch(
              "/api/schools/"
            ),

            apiFetch(
              "/api/accounts/me/"
            ),

          ]);


          setClassrooms(
            getList<Classroom>(
              classroomData
            )
          );


          setSchools(
            getList<SchoolOption>(
              schoolData
            )
          );


          const user =
            userData as CurrentUser;


          setCurrentRole(
            user.role || ""
          );


        } catch (err) {

          console.error(err);

          setError(
            "Unable to load classes. Please make sure the backend is running."
          );

        } finally {

          setLoading(false);

        }

      };


    loadPage();

  }, []);


  const filteredClassrooms =
    useMemo(() => {

      const query =
        search
          .toLowerCase()
          .trim();


      return classrooms.filter(
        (classroom) => {

          const matchesSearch =
            !query ||

            classroom.class_name
              .toLowerCase()
              .includes(query) ||

            classroom.section
              .toLowerCase()
              .includes(query) ||

            classroom.school_name
              .toLowerCase()
              .includes(query);


          const matchesSchool =
            schoolFilter === "all" ||

            String(
              classroom.school
            ) === schoolFilter;


          return (
            matchesSearch &&
            matchesSchool
          );

        }
      );

    }, [
      classrooms,
      search,
      schoolFilter,
    ]);


  const totalStudents =
    classrooms.reduce(
      (total, classroom) =>
        total +
        classroom.student_count,
      0
    );


  const totalTeachers =
    classrooms.reduce(
      (total, classroom) =>
        total +
        classroom.teacher_count,
      0
    );


  const totalSubjects =
    classrooms.reduce(
      (total, classroom) =>
        total +
        classroom.subject_count,
      0
    );


  const selectedSchool =
    schools.find(
      (school) =>
        String(
          school.id
        ) ===
        form.school
    );


  const openAdd =
    () => {

      const defaultSchool =
        schools.length === 1
          ? String(
              schools[0].id
            )
          : "";


      setEditingClassroom(null);


      setForm({
        ...emptyForm,
        school: defaultSchool,
      });


      setFormError("");

      setFormOpen(true);

    };


  const openEdit = (
    classroom: Classroom
  ) => {

    setEditingClassroom(
      classroom
    );


    setForm({

      school:
        String(
          classroom.school
        ),

      class_name:
        classroom.class_name,

      section:
        classroom.section,

    });


    setFormError("");

    setFormOpen(true);

  };


  const closeForm =
    () => {

      setFormOpen(false);

      setEditingClassroom(null);

      setForm(
        emptyForm
      );

      setFormError("");

    };


  const handleSave =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();

      setFormError("");


      if (
        !form.school ||
        !form.class_name.trim() ||
        !form.section.trim()
      ) {

        setFormError(
          "Please complete all required fields."
        );

        return;

      }


      try {

        setSaving(true);


        const payload = {

          school:
            Number(
              form.school
            ),

          class_name:
            form.class_name.trim(),

          section:
            form.section.trim(),

        };


        if (editingClassroom) {

          await apiFetch(
            `/api/academics/classes/${editingClassroom.id}/`,
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
            "/api/academics/classes/",
            {
              method: "POST",

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        }


        await loadClasses();

        closeForm();


      } catch (err) {

        console.error(err);


        setFormError(
          editingClassroom
            ? "Unable to update the class. Make sure the class and section are not duplicated."
            : "Unable to create the class. Make sure the class and section are not duplicated."
        );


      } finally {

        setSaving(false);

      }

    };


  const classInUse = (
    classroom: Classroom
  ) => {

    return (
      classroom.student_count > 0 ||
      classroom.teacher_count > 0 ||
      classroom.subject_count > 0 ||
      classroom.exam_count > 0
    );

  };


  const handleDelete =
    async () => {

      if (!deletingClassroom) {
        return;
      }


      try {

        setDeleting(true);
        setDeleteError("");


        await apiFetch(
          `/api/academics/classes/${deletingClassroom.id}/`,
          {
            method: "DELETE",
          }
        );


        await loadClasses();

        setDeletingClassroom(
          null
        );


      } catch (err) {

        console.error(err);


        setDeleteError(
          "This class cannot be deleted while it contains students, teachers, subjects, or exams."
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
            Classes
          </h1>


          <p className="text-sm text-muted-foreground">
            Manage classrooms, sections, and school assignments.
          </p>

        </div>


        {canManage && (

          <Button
            onClick={openAdd}
          >

            <Plus className="mr-2 h-4 w-4" />

            Add Class

          </Button>

        )}


      </div>


      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 max-w-6xl">


        <StatCard
          title="Total Classes"
          value={classrooms.length}
          icon={<School className="h-5 w-5" />}
        />


        <StatCard
          title="Students"
          value={totalStudents}
          icon={<GraduationCap className="h-5 w-5" />}
        />


        <StatCard
          title="Teachers Assigned"
          value={totalTeachers}
          icon={<Users className="h-5 w-5" />}
        />


        <StatCard
          title="Subjects"
          value={totalSubjects}
          icon={<BookOpen className="h-5 w-5" />}
        />


      </div>


      <Card>


        <CardHeader className="space-y-4">


          <CardTitle>
            Class Directory
          </CardTitle>


          <div className="flex flex-col gap-3 md:flex-row">


            <div className="relative w-full max-w-md">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search classes..."
                style={{
                  paddingLeft:
                    "2.5rem",
                }}
              />

            </div>


            {schools.length > 1 && (

              <Select
                value={schoolFilter}
                onValueChange={(value) =>
                  setSchoolFilter(
                    value ?? "all"
                  )
                }
              >

                <SelectTrigger className="w-full md:w-60">

                  <span>

                    {schoolFilter === "all"
                      ? "All Schools"
                      : schools.find(
                          (school) =>
                            String(
                              school.id
                            ) ===
                            schoolFilter
                        )?.school_name ||
                        "School"}

                  </span>

                </SelectTrigger>


                <SelectContent>

                  <SelectItem value="all">
                    All Schools
                  </SelectItem>


                  {schools.map(
                    (school) => (

                      <SelectItem
                        key={school.id}
                        value={String(
                          school.id
                        )}
                      >
                        {school.school_name}
                      </SelectItem>

                    )
                  )}

                </SelectContent>

              </Select>

            )}


          </div>


        </CardHeader>


        <CardContent>


          {loading && (

            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading classes...
            </div>

          )}


          {!loading && error && (

            <div className="py-10 text-center text-sm text-destructive">
              {error}
            </div>

          )}


          {!loading &&
            !error &&
            filteredClassrooms.length ===
              0 && (

              <div className="py-10 text-center text-sm text-muted-foreground">
                No classes found.
              </div>

            )}


          {!loading &&
            !error &&
            filteredClassrooms.length >
              0 && (

              <div className="overflow-x-auto">


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
                        School
                      </TableHead>

                      <TableHead>
                        Students
                      </TableHead>

                      <TableHead>
                        Teachers
                      </TableHead>

                      <TableHead>
                        Subjects
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead className="text-right">
                        Actions
                      </TableHead>

                    </TableRow>

                  </TableHeader>


                  <TableBody>


                    {filteredClassrooms.map(
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

                            <Badge variant="outline">
                              {classroom.section}
                            </Badge>

                          </TableCell>


                          <TableCell>
                            {classroom.school_name}
                          </TableCell>


                          <TableCell>
                            {classroom.student_count}
                          </TableCell>


                          <TableCell>
                            {classroom.teacher_count}
                          </TableCell>


                          <TableCell>
                            {classroom.subject_count}
                          </TableCell>


                          <TableCell>

                            <Badge
                              variant={
                                classInUse(
                                  classroom
                                )
                                  ? "secondary"
                                  : "outline"
                              }
                            >

                              {classInUse(
                                classroom
                              )
                                ? "In Use"
                                : "Empty"}

                            </Badge>

                          </TableCell>


                          <TableCell>


                            <div className="flex justify-end gap-2">


                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedClassroom(
                                    classroom
                                  )
                                }
                              >

                                <Eye className="h-4 w-4" />

                                <span className="hidden lg:inline">
                                  View
                                </span>

                              </Button>


                              {canManage && (
                                <>


                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openEdit(
                                        classroom
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
                                    disabled={
                                      classInUse(
                                        classroom
                                      )
                                    }
                                    title={
                                      classInUse(
                                        classroom
                                      )
                                        ? "Remove linked students, teachers, subjects and exams before deleting this class."
                                        : "Delete class"
                                    }
                                    onClick={() => {

                                      setDeleteError("");

                                      setDeletingClassroom(
                                        classroom
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

        <DialogContent className="sm:max-w-lg">


          <DialogHeader>

            <DialogTitle>

              {editingClassroom
                ? "Edit Class"
                : "Add Class"}

            </DialogTitle>

            <DialogDescription>

              {editingClassroom
                ? "Update the classroom information."
                : "Create a new classroom and section."}

            </DialogDescription>

          </DialogHeader>


          <form
            onSubmit={handleSave}
            className="space-y-5"
          >


            <FormField label="School *">


              <Select
                value={form.school}
                onValueChange={(value) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      school:
                        value ?? "",
                    })
                  )
                }
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
                        key={school.id}
                        value={String(
                          school.id
                        )}
                      >
                        {school.school_name}
                      </SelectItem>

                    )
                  )}


                </SelectContent>


              </Select>


            </FormField>


            <FormField label="Class Name *">

              <Input
                value={
                  form.class_name
                }
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      class_name:
                        event.target.value,
                    })
                  )
                }
                placeholder="Example: Grade 1"
                required
              />

            </FormField>


            <FormField label="Section *">

              <Input
                value={
                  form.section
                }
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      section:
                        event.target.value,
                    })
                  )
                }
                placeholder="Example: A"
                required
              />

            </FormField>


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
                onClick={closeForm}
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
                  : editingClassroom
                    ? "Save Changes"
                    : "Add Class"}

              </Button>


            </DialogFooter>


          </form>


        </DialogContent>

      </Dialog>


      {/* VIEW */}

      <Dialog
        open={
          selectedClassroom !== null
        }
        onOpenChange={(open) => {

          if (!open) {
            setSelectedClassroom(
              null
            );
          }

        }}
      >

        <DialogContent className="sm:max-w-lg">


          {selectedClassroom && (
            <>


              <DialogHeader>

                <DialogTitle>

                  {
                    selectedClassroom.class_name
                  }{" "}

                  -{" "}

                  {
                    selectedClassroom.section
                  }

                </DialogTitle>

                <DialogDescription>
                  Classroom information and linked records.
                </DialogDescription>

              </DialogHeader>


              <div className="grid gap-5 py-4 sm:grid-cols-2">


                <Detail
                  label="School"
                  value={
                    selectedClassroom.school_name
                  }
                />


                <Detail
                  label="Section"
                  value={
                    selectedClassroom.section
                  }
                />


                <Detail
                  label="Students"
                  value={
                    selectedClassroom.student_count
                  }
                />


                <Detail
                  label="Teachers"
                  value={
                    selectedClassroom.teacher_count
                  }
                />


                <Detail
                  label="Subjects"
                  value={
                    selectedClassroom.subject_count
                  }
                />


                <Detail
                  label="Exams"
                  value={
                    selectedClassroom.exam_count
                  }
                />


              </div>


              {classInUse(
                selectedClassroom
              ) && (

                <div className="rounded-lg border bg-muted/40 px-4 py-3">

                  <p className="text-sm text-muted-foreground">

                    This class is protected from deletion because it has linked school records.

                  </p>

                </div>

              )}


            </>
          )}


        </DialogContent>

      </Dialog>


      {/* DELETE */}

      <Dialog
        open={
          deletingClassroom !== null
        }
        onOpenChange={(open) => {

          if (
            !open &&
            !deleting
          ) {

            setDeletingClassroom(
              null
            );

            setDeleteError("");

          }

        }}
      >

        <DialogContent className="sm:max-w-md">


          <DialogHeader>

            <DialogTitle>
              Delete Class?
            </DialogTitle>

            <DialogDescription>

              {deletingClassroom
                ? `Are you sure you want to delete ${deletingClassroom.class_name} - ${deletingClassroom.section}? This action cannot be undone.`
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
                setDeletingClassroom(
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
                handleDelete
              }
            >

              <Trash2 className="mr-2 h-4 w-4" />

              {deleting
                ? "Deleting..."
                : "Delete Class"}

            </Button>


          </DialogFooter>


        </DialogContent>

      </Dialog>


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


function Detail({
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
        {value ?? "-"}
      </p>

    </div>

  );

}