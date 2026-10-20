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
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  School as SchoolIcon,
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

import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";

import { Link } from "react-router";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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


interface CurrentUser {
  role: string;

  school: number | null;
}


interface SchoolForm {
  school_name: string;

  address: string;

  phone: string;

  email: string;
}


const emptyForm: SchoolForm = {
  school_name: "",
  address: "",
  phone: "",
  email: "",
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


export default function SchoolsPage() {

  const [
    schools,
    setSchools,
  ] = useState<School[]>([]);


  const [
    currentUser,
    setCurrentUser,
  ] = useState<CurrentUser | null>(
    null
  );


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
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    formOpen,
    setFormOpen,
  ] = useState(false);


  const [
    viewSchool,
    setViewSchool,
  ] = useState<School | null>(
    null
  );


  const [
    editingSchool,
    setEditingSchool,
  ] = useState<School | null>(
    null
  );


  const [
    deletingSchool,
    setDeletingSchool,
  ] = useState<School | null>(
    null
  );


  const [
    form,
    setForm,
  ] = useState<SchoolForm>(
    emptyForm
  );


  const isOwner =
    currentUser?.role === "OWNER";


  const isAdmin =
    currentUser?.role === "ADMIN";


  const loadSchools =
    async () => {

      const data = await apiFetch(
        "/api/schools/"
      );


      setSchools(
        getList<School>(
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
            userData,
            schoolData,
          ] = await Promise.all([

            apiFetch(
              "/api/accounts/me/"
            ),

            apiFetch(
              "/api/schools/"
            ),

          ]);


          setCurrentUser(
            userData as CurrentUser
          );


          setSchools(
            getList<School>(
              schoolData
            )
          );


        } catch (err) {

          console.error(err);

          setError(
            "Unable to load schools."
          );

        } finally {

          setLoading(false);

        }

      };


    loadPage();

  }, []);


  const filteredSchools =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      if (!query) {

        return schools;

      }


      return schools.filter(
        (school) =>

          school.school_name
            .toLowerCase()
            .includes(query) ||

          school.email
            .toLowerCase()
            .includes(query) ||

          school.phone
            .toLowerCase()
            .includes(query) ||

          school.address
            .toLowerCase()
            .includes(query)

      );

    }, [
      schools,
      search,
    ]);


  const totalStudents =
    schools.reduce(
      (sum, school) =>
        sum +
        school.student_count,
      0
    );


  const totalTeachers =
    schools.reduce(
      (sum, school) =>
        sum +
        school.teacher_count,
      0
    );


  const totalClasses =
    schools.reduce(
      (sum, school) =>
        sum +
        school.class_count,
      0
    );


  const canEdit =
    (school: School) => {

      if (isOwner) {

        return true;

      }


      return (
        isAdmin &&
        currentUser?.school ===
          school.id
      );

    };


  const canDelete =
    (school: School) => {

      if (!isOwner) {

        return false;

      }


      return (
        school.student_count === 0 &&
        school.teacher_count === 0 &&
        school.class_count === 0 &&
        school.employee_count === 0
      );

    };


  const openAdd =
    () => {

      setEditingSchool(null);

      setForm(
        emptyForm
      );

      setError("");

      setSuccess("");

      setFormOpen(true);

    };


  const openEdit =
    (school: School) => {

      setEditingSchool(
        school
      );


      setForm({
        school_name:
          school.school_name,

        address:
          school.address,

        phone:
          school.phone,

        email:
          school.email,
      });


      setError("");

      setSuccess("");

      setFormOpen(true);

    };


  const saveSchool =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        !form.school_name.trim() ||
        !form.address.trim() ||
        !form.phone.trim() ||
        !form.email.trim()
      ) {

        setError(
          "Complete all school fields."
        );

        return;

      }


      try {

        setSaving(true);

        setError("");


        if (editingSchool) {

          await apiFetch(
            `/api/schools/${editingSchool.id}/`,
            {
              method: "PATCH",

              body:
                JSON.stringify(
                  form
                ),
            }
          );

        } else {

          await apiFetch(
            "/api/schools/",
            {
              method: "POST",

              body:
                JSON.stringify(
                  form
                ),
            }
          );

        }


        await loadSchools();


        setFormOpen(false);


        setSuccess(
          editingSchool
            ? "School updated successfully."
            : "School created successfully."
        );


      } catch (err) {

        console.error(err);

        setError(
          editingSchool
            ? "Unable to update school."
            : "Unable to create school. Check that the school name is not already used."
        );

      } finally {

        setSaving(false);

      }

    };


  const deleteSchool =
    async () => {

      if (!deletingSchool) {

        return;

      }


      try {

        setSaving(true);

        setError("");


        await apiFetch(
          `/api/schools/${deletingSchool.id}/`,
          {
            method: "DELETE",
          }
        );


        await loadSchools();


        setDeletingSchool(
          null
        );


        setSuccess(
          "School deleted successfully."
        );


      } catch (err) {

        console.error(err);

        setError(
          "This school cannot be deleted while it still contains related records."
        );

      } finally {

        setSaving(false);

      }

    };


  return (

    <div className="space-y-6">


      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-2xl font-semibold">
            Schools
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage schools and review their students, teachers and classes.
          </p>

        </div>


        {isOwner && (

          <Button
            onClick={openAdd}
          >

            <Plus className="mr-2 h-4 w-4" />

            Add School

          </Button>

        )}

      </div>


      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Schools"
          value={
            String(
              schools.length
            )
          }
          icon={
            <SchoolIcon className="h-5 w-5" />
          }
        />


        <StatCard
          title="Students"
          value={
            String(
              totalStudents
            )
          }
          icon={
            <GraduationCap className="h-5 w-5" />
          }
        />


        <StatCard
          title="Teachers"
          value={
            String(
              totalTeachers
            )
          }
          icon={
            <Users className="h-5 w-5" />
          }
        />


        <StatCard
          title="Classes"
          value={
            String(
              totalClasses
            )
          }
          icon={
            <BookOpen className="h-5 w-5" />
          }
        />

      </div>


      {success && (

        <div className="rounded-lg border px-4 py-3">

          <p className="text-sm font-medium">
            {success}
          </p>

        </div>

      )}


      {error && (

        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">

          <p className="text-sm text-destructive">
            {error}
          </p>

        </div>

      )}


      <Card>

        <CardHeader className="space-y-4">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <CardTitle>
              School Directory
            </CardTitle>


            <div className="relative w-full md:max-w-sm">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search schools..."
                style={{
                  paddingLeft:
                    "2.5rem",
                }}
              />

            </div>

          </div>

        </CardHeader>


        <CardContent>

          {loading ? (

            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading schools...
            </div>

          ) : filteredSchools.length ===
            0 ? (

            <div className="py-12 text-center text-sm text-muted-foreground">
              No schools found.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>
                      School
                    </TableHead>

                    <TableHead>
                      Contact
                    </TableHead>

                    <TableHead>
                      Students
                    </TableHead>

                    <TableHead>
                      Teachers
                    </TableHead>

                    <TableHead>
                      Classes
                    </TableHead>

                    <TableHead className="text-right">
                      Actions
                    </TableHead>

                  </TableRow>

                </TableHeader>


                <TableBody>

                  {filteredSchools.map(
                    (school) => (

                      <TableRow
                        key={school.id}
                      >

                        <TableCell>

                          <div>

                            <Link
                              to={`/schools/${school.id}`}
                              className="font-medium hover:underline"
                            >
                              {school.school_name}
                            </Link>

                            <p className="max-w-xs truncate text-xs text-muted-foreground">
                              {school.address}
                            </p>

                          </div>

                        </TableCell>


                        <TableCell>

                          <div className="space-y-1 text-sm">

                            <p>
                              {school.email}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {school.phone}
                            </p>

                          </div>

                        </TableCell>


                        <TableCell>
                          {school.student_count}
                        </TableCell>


                        <TableCell>
                          {school.teacher_count}
                        </TableCell>


                        <TableCell>
                          {school.class_count}
                        </TableCell>


                        <TableCell>

                          <div className="flex justify-end gap-2">

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setViewSchool(
                                  school
                                )
                              }
                            >

                              <Eye className="h-4 w-4" />

                              <span className="hidden lg:inline">
                                View
                              </span>

                            </Button>


                            {canEdit(
                              school
                            ) && (

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openEdit(
                                    school
                                  )
                                }
                              >

                                <Pencil className="h-4 w-4" />

                                <span className="hidden lg:inline">
                                  Edit
                                </span>

                              </Button>

                            )}


                            {isOwner && (

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  !canDelete(
                                    school
                                  )
                                }
                                title={
                                  canDelete(
                                    school
                                  )
                                    ? "Delete school"
                                    : "Remove related records before deleting this school"
                                }
                                onClick={() =>
                                  setDeletingSchool(
                                    school
                                  )
                                }
                              >

                                <Trash2 className="h-4 w-4" />

                              </Button>

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
        onOpenChange={
          setFormOpen
        }
      >

        <DialogContent className="sm:max-w-xl">

          <DialogHeader>

            <DialogTitle>

              {editingSchool
                ? "Edit School"
                : "Add School"}

            </DialogTitle>

            <DialogDescription>

              {editingSchool
                ? "Update the school information."
                : "Create a new school in the ERP system."}

            </DialogDescription>

          </DialogHeader>


          <form
            onSubmit={
              saveSchool
            }
            className="space-y-4"
          >

            <Field label="School Name *">

              <Input
                value={
                  form.school_name
                }
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,

                      school_name:
                        event.target.value,
                    })
                  )
                }
                placeholder="School name"
              />

            </Field>


            <Field label="Address *">

              <Input
                value={
                  form.address
                }
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,

                      address:
                        event.target.value,
                    })
                  )
                }
                placeholder="School address"
              />

            </Field>


            <div className="grid gap-4 sm:grid-cols-2">

              <Field label="Phone *">

                <Input
                  value={
                    form.phone
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,

                        phone:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="+86..."
                />

              </Field>


              <Field label="Email *">

                <Input
                  type="email"
                  value={
                    form.email
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,

                        email:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="school@example.com"
                />

              </Field>

            </div>


            <DialogFooter>

              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() =>
                  setFormOpen(false)
                }
              >
                Cancel
              </Button>


              <Button
                type="submit"
                disabled={saving}
              >

                {saving
                  ? "Saving..."
                  : editingSchool
                    ? "Save Changes"
                    : "Create School"}

              </Button>

            </DialogFooter>

          </form>

        </DialogContent>

      </Dialog>


      {/* VIEW */}

      <Dialog
        open={
          viewSchool !== null
        }
        onOpenChange={(open) => {

          if (!open) {

            setViewSchool(null);

          }

        }}
      >

        <DialogContent className="sm:max-w-2xl">

          {viewSchool && (
            <>

              <DialogHeader>

                <DialogTitle>
                  {viewSchool.school_name}
                </DialogTitle>

                <DialogDescription>
                  School profile and system statistics.
                </DialogDescription>

              </DialogHeader>


              <div className="space-y-5 py-3">

                <div className="grid gap-4 sm:grid-cols-2">

                  <Info
                    icon={
                      <MapPin className="h-4 w-4" />
                    }
                    label="Address"
                    value={
                      viewSchool.address
                    }
                  />


                  <Info
                    icon={
                      <Phone className="h-4 w-4" />
                    }
                    label="Phone"
                    value={
                      viewSchool.phone
                    }
                  />


                  <Info
                    icon={
                      <Mail className="h-4 w-4" />
                    }
                    label="Email"
                    value={
                      viewSchool.email
                    }
                  />


                  <Info
                    icon={
                      <SchoolIcon className="h-4 w-4" />
                    }
                    label="Created"
                    value={
                      new Date(
                        viewSchool.create_date
                      ).toLocaleDateString()
                    }
                  />

                </div>


                <div className="grid gap-3 sm:grid-cols-4">

                  <MiniStat
                    label="Students"
                    value={
                      viewSchool.student_count
                    }
                  />

                  <MiniStat
                    label="Teachers"
                    value={
                      viewSchool.teacher_count
                    }
                  />

                  <MiniStat
                    label="Classes"
                    value={
                      viewSchool.class_count
                    }
                  />

                  <MiniStat
                    label="Employees"
                    value={
                      viewSchool.employee_count
                    }
                  />

                </div>

              </div>


              <DialogFooter>

                {canEdit(
                  viewSchool
                ) && (

                  <Button
                    onClick={() => {

                      const school =
                        viewSchool;

                      setViewSchool(
                        null
                      );

                      openEdit(
                        school
                      );

                    }}
                  >

                    <Pencil className="mr-2 h-4 w-4" />

                    Edit School

                  </Button>

                )}

              </DialogFooter>

            </>
          )}

        </DialogContent>

      </Dialog>


      {/* DELETE */}

      <Dialog
        open={
          deletingSchool !== null
        }
        onOpenChange={(open) => {

          if (!open) {

            setDeletingSchool(
              null
            );

          }

        }}
      >

        <DialogContent className="sm:max-w-md">

          <DialogHeader>

            <DialogTitle>
              Delete School
            </DialogTitle>

            <DialogDescription>

              {deletingSchool
                ? `Are you sure you want to delete ${deletingSchool.school_name}?`
                : ""}

            </DialogDescription>

          </DialogHeader>


          <DialogFooter>

            <Button
              variant="outline"
              disabled={saving}
              onClick={() =>
                setDeletingSchool(
                  null
                )
              }
            >
              Cancel
            </Button>


            <Button
              variant="destructive"
              disabled={saving}
              onClick={
                deleteSchool
              }
            >

              {saving
                ? "Deleting..."
                : "Delete School"}

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
  value: string;
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


function Field({
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

        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>

      </div>

      <p className="text-sm font-medium">
        {value}
      </p>

    </div>

  );

}


function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {

  return (

    <div className="rounded-lg border p-4 text-center">

      <p className="text-2xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {label}
      </p>

    </div>

  );

}