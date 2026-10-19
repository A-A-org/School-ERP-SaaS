'use client';

import { useEffect, useState } from "react";

import { CardContent } from "@/components/ui/card";
import { DashboardCard } from "../../shared/dashboard-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus } from "lucide-react";

import { apiFetch } from "@/api/client";


type Student = {
  id: number;
  created_at: string;
};


export default function TotalOrders() {
  const [newEnrollments, setNewEnrollments] =
    useState<number | null>(null);


  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        const data = await apiFetch("/api/students/");

        const students: Student[] =
          Array.isArray(data)
            ? data
            : data.results || [];


        const now = new Date();

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();


        const count = students.filter((student) => {
          const createdDate =
            new Date(student.created_at);

          return (
            createdDate.getMonth() === currentMonth &&
            createdDate.getFullYear() === currentYear
          );
        }).length;


        setNewEnrollments(count);

      } catch (error) {
        console.error(
          "Failed to load enrollments:",
          error
        );

        setNewEnrollments(0);
      }
    };


    loadEnrollments();

  }, []);


  return (
    <DashboardCard className="py-6">

      <CardContent className="flex justify-between flex-row px-6">

        <div className="flex flex-col items-start gap-4 w-full">

          <div className="flex items-center justify-between w-full">

            <div className="flex flex-col gap-1">

              <p className="text-sm font-normal text-foreground">
                New Enrollments
              </p>


              <h3 className="text-2xl font-semibold">

                {newEnrollments === null
                  ? "..."
                  : newEnrollments}

              </h3>


              <p className="text-xs text-muted-foreground">
                This month
              </p>

            </div>


            <div className="border border-border p-2.5 w-fit rounded-md">

              <UserPlus size={16} />

            </div>

          </div>


          <Button
            variant="outline"
            className="flex gap-1.5 px-4 py-2 h-auto rounded-md cursor-pointer"
          >

            View Students

            <ArrowRight
              width={18}
              height={18}
            />

          </Button>

        </div>

      </CardContent>

    </DashboardCard>
  );
}