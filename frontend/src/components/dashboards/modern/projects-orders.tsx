import { useEffect, useState } from "react";

import {
  GraduationCap,
  ArrowDownUp,
  Ellipsis,
} from "lucide-react";

import {
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";

import { DashboardCard } from "../../shared/dashboard-card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import SimpleBar from "simplebar-react";
import { Button } from "@/components/ui/button";

import { apiFetch } from "@/api/client";


type Student = {
  id: number;
  first_name: string;
  last_name: string;
  admission_number: string;
  classroom_name: string | null;
  school_name: string | null;
  phone: string | null;
  created_at: string;
};


export default function ProjectsOrders() {

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    const loadStudents = async () => {

      try {

        const data = await apiFetch("/api/students/");

        setStudents(data);

      } catch (err) {

        console.error(err);

        setError("Failed to load students.");

      } finally {

        setLoading(false);

      }

    };


    loadStudents();

  }, []);


  return (
    <DashboardCard className="flex flex-col gap-0!">

      <CardHeader className="border-b border-border">

        <CardTitle className="flex items-center gap-2">

          <GraduationCap
            size={16}
            className="text-foreground"
          />

          <span>
            Recent Students
          </span>

        </CardTitle>

      </CardHeader>


      <CardContent className="px-0!">

        {loading && (

          <div className="p-6 text-sm text-muted-foreground">

            Loading students...

          </div>

        )}


        {error && (

          <div className="p-6 text-sm text-destructive">

            {error}

          </div>

        )}


        {!loading && !error && (

          <SimpleBar>

            <div className="overflow-x-auto">

              <div className="min-w-[820px]">

                <Table>

                  <TableHeader>

                    <TableRow className="hover:bg-transparent border-border">

                      <TableHead className="pl-4! px-4 py-3 h-auto text-sm font-normal text-muted-foreground">

                        <div className="flex items-center gap-1.5 whitespace-nowrap">

                          Student ID

                          <ArrowDownUp
                            size={14}
                            className="text-muted-foreground"
                          />

                        </div>

                      </TableHead>


                      <TableHead className="px-4 py-3 h-auto text-sm font-normal text-muted-foreground">

                        Student

                      </TableHead>


                      <TableHead className="px-4 py-3 h-auto text-sm font-normal text-muted-foreground">

                        Class

                      </TableHead>


                      <TableHead className="px-4 py-3 h-auto text-sm font-normal text-muted-foreground">

                        School

                      </TableHead>


                      <TableHead className="px-4 py-3 h-auto text-sm font-normal text-muted-foreground">

                        Enrollment Date

                      </TableHead>


                      <TableHead className="pr-4! px-2 py-3 h-auto w-[48px]" />

                    </TableRow>

                  </TableHeader>


                  <TableBody>

                    {students.slice(0, 7).map((student) => (

                      <TableRow
                        key={student.id}
                        className="border-border hover:bg-muted/30"
                      >

                        <TableCell className="pl-4! px-4 py-3">

                          <span className="text-sm font-medium">

                            {student.admission_number}

                          </span>

                        </TableCell>


                        <TableCell className="px-4 py-3">

                          <div className="flex flex-col">

                            <span className="text-sm font-medium">

                              {student.first_name} {student.last_name}

                            </span>

                            <span className="text-xs text-muted-foreground">

                              {student.phone || "No phone"}

                            </span>

                          </div>

                        </TableCell>


                        <TableCell className="px-4 py-3">

                          <span className="text-sm text-muted-foreground">

                            {student.classroom_name || "Not assigned"}

                          </span>

                        </TableCell>


                        <TableCell className="px-4 py-3">

                          <span className="text-sm text-muted-foreground">

                            {student.school_name || "—"}

                          </span>

                        </TableCell>


                        <TableCell className="px-4 py-3">

                          <span className="text-sm text-muted-foreground">

                            {new Date(
                              student.created_at
                            ).toLocaleDateString()}

                          </span>

                        </TableCell>


                        <TableCell className="pr-4! px-2 py-3">

                          <Button
                            variant="ghost"
                            className="p-2"
                          >

                            <Ellipsis size={16} />

                          </Button>

                        </TableCell>

                      </TableRow>

                    ))}

                  </TableBody>

                </Table>

              </div>

            </div>

          </SimpleBar>

        )}

      </CardContent>

    </DashboardCard>
  );
}