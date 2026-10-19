'use client';

import { useEffect, useState } from "react";

import { CardContent } from "@/components/ui/card";
import { DashboardCard } from "../../shared/dashboard-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardList } from "lucide-react";

import { apiFetch } from "@/api/client";


type Exam = {
  id: number;
  classroom: number;
  classroom_name: string;
  exam_name: string;
  exam_date: string;
};


export default function AdvertisementCost() {

  const [upcomingExams, setUpcomingExams] =
    useState<number | null>(null);


  useEffect(() => {

    const loadUpcomingExams = async () => {

      try {

        const data =
          await apiFetch("/api/academics/exams/");


        const exams: Exam[] =
          Array.isArray(data)
            ? data
            : data.results || [];


        const today = new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );


        const next30Days =
          new Date(today);

        next30Days.setDate(
          next30Days.getDate() + 30
        );


        const count =
          exams.filter((exam) => {

            const examDate =
              new Date(
                `${exam.exam_date}T00:00:00`
              );

            return (
              examDate >= today &&
              examDate <= next30Days
            );

          }).length;


        setUpcomingExams(count);

      } catch (error) {

        console.error(
          "Failed to load upcoming exams:",
          error
        );

        setUpcomingExams(0);

      }

    };


    loadUpcomingExams();

  }, []);


  return (
    <DashboardCard className="py-6">

      <CardContent className="flex justify-between flex-row px-6">

        <div className="flex flex-col items-start gap-4 w-full">

          <div className="flex items-center justify-between w-full">

            <div className="flex flex-col gap-1">

              <p className="text-sm font-normal text-foreground">
                Upcoming Exams
              </p>


              <h3 className="text-2xl font-semibold">

                {upcomingExams === null
                  ? "..."
                  : upcomingExams}

              </h3>


              <p className="text-xs text-muted-foreground">
                Next 30 Days
              </p>

            </div>


            <div className="border border-border p-2.5 w-fit rounded-md">

              <ClipboardList size={16} />

            </div>

          </div>


          <Button
            variant="outline"
            className="flex gap-1.5 px-4 py-2 h-auto rounded-md cursor-pointer"
          >

            View Exams

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