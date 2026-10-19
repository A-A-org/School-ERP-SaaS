'use client';

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";

import { DashboardCard } from "../../shared/dashboard-card";
import { apiFetch } from "@/api/client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type AttendanceRecord = {
  id: number;
  student: number;
  student_name: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
};


type ChartItem = {
  date: string;
  fullDate: string;
  present: number;
  absent: number;
  late: number;
};


const chartConfig = {
  present: {
    label: "Present",
    color: "var(--color-primary)",
  },
  absent: {
    label: "Absent",
    color: "color-mix(in srgb, var(--primary) 45%, transparent)",
  },
  late: {
    label: "Late",
    color: "color-mix(in srgb, var(--primary) 70%, transparent)",
  },
} satisfies ChartConfig;


const periodOptions = [
  "Last 7 Days",
  "Last 30 Days",
  "Last 90 Days",
];


export default function TotalSales() {

  const [attendance, setAttendance] =
    useState<AttendanceRecord[]>([]);

  const [period, setPeriod] =
    useState("Last 30 Days");

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    const loadAttendance = async () => {

      try {

        const data =
          await apiFetch("/api/attendance/");

        const records =
          Array.isArray(data)
            ? data
            : data.results || [];

        setAttendance(records);

      } catch (error) {

        console.error(
          "Failed to load attendance:",
          error
        );

      } finally {

        setLoading(false);

      }

    };


    loadAttendance();

  }, []);


  const filteredAttendance = useMemo(() => {

    const days =
      period === "Last 7 Days"
        ? 7
        : period === "Last 30 Days"
        ? 30
        : 90;

    const cutoff = new Date();

    cutoff.setDate(
      cutoff.getDate() - days
    );


    return attendance.filter((record) => {

      const recordDate =
        new Date(`${record.date}T00:00:00`);

      return recordDate >= cutoff;

    });

  }, [attendance, period]);


  const chartData: ChartItem[] =
    useMemo(() => {

      const grouped = new Map<
        string,
        AttendanceRecord[]
      >();


      filteredAttendance.forEach((record) => {

        if (!grouped.has(record.date)) {
          grouped.set(record.date, []);
        }

        grouped.get(record.date)!.push(record);

      });


      return Array.from(grouped.entries())
        .sort(
          ([a], [b]) =>
            new Date(a).getTime() -
            new Date(b).getTime()
        )
        .map(([date, records]) => {

          const total = records.length;

          const presentCount =
            records.filter(
              (r) => r.status === "PRESENT"
            ).length;

          const absentCount =
            records.filter(
              (r) => r.status === "ABSENT"
            ).length;

          const lateCount =
            records.filter(
              (r) => r.status === "LATE"
            ).length;


          return {
            date: new Date(
              `${date}T00:00:00`
            ).toLocaleDateString(
              undefined,
              {
                month: "short",
                day: "numeric",
              }
            ),

            fullDate: date,

            present:
              total > 0
                ? (presentCount / total) * 100
                : 0,

            absent:
              total > 0
                ? (absentCount / total) * 100
                : 0,

            late:
              total > 0
                ? (lateCount / total) * 100
                : 0,
          };

        });

    }, [filteredAttendance]);


  const attendanceRate =
    useMemo(() => {

      if (filteredAttendance.length === 0) {
        return 0;
      }

      const present =
        filteredAttendance.filter(
          (record) =>
            record.status === "PRESENT"
        ).length;

      return (
        present /
        filteredAttendance.length
      ) * 100;

    }, [filteredAttendance]);


  return (
    <DashboardCard className="flex flex-col gap-0!">

      <CardHeader className="border-b border-border">

        <CardTitle className="flex items-center gap-2">

          <CalendarCheck
            size={16}
            className="text-muted-foreground"
          />

          Attendance Overview

        </CardTitle>

      </CardHeader>


      <CardContent className="p-5 flex flex-col gap-6">

        <div className="flex items-start justify-between gap-4 flex-wrap">

          <div className="flex flex-col gap-1">

            <span className="text-base">
              Average Attendance
            </span>

            <span className="text-2xl font-semibold">
              {loading
                ? "..."
                : `${attendanceRate.toFixed(1)}%`
              }
            </span>

          </div>


          <Select
            value={period}
            onValueChange={(value) =>
              value && setPeriod(value)
            }
          >

            <SelectTrigger className="h-auto! w-fit cursor-pointer">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>

              {periodOptions.map((option) => (

                <SelectItem
                  key={option}
                  value={option}
                >
                  {option}
                </SelectItem>

              ))}

            </SelectContent>

          </Select>

        </div>


        {chartData.length === 0 ? (

          <div className="h-[215px] flex items-center justify-center text-sm text-muted-foreground">

            No attendance records for this period.

          </div>

        ) : (

          <ChartContainer
            config={chartConfig}
            className="h-[215px]! w-full"
          >

            <LineChart
              data={chartData}
              margin={{
                top: 8,
                right: 4,
                bottom: 0,
                left: -10,
              }}
            >

              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />


              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />


              <YAxis
                domain={[0, 100]}
                ticks={[
                  0,
                  20,
                  40,
                  60,
                  80,
                  100,
                ]}
                tickFormatter={
                  (value) => `${value}%`
                }
                tickLine={false}
                axisLine={false}
              />


              <ChartTooltip
                content={
                  <ChartTooltipContent />
                }
              />


              <Line
                dataKey="present"
                type="monotone"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot
              />


              <Line
                dataKey="absent"
                type="monotone"
                stroke="color-mix(in srgb, var(--primary) 45%, transparent)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot
              />


              <Line
                dataKey="late"
                type="monotone"
                stroke="color-mix(in srgb, var(--primary) 70%, transparent)"
                strokeWidth={2}
                strokeDasharray="2 2"
                dot
              />

            </LineChart>

          </ChartContainer>

        )}

      </CardContent>

    </DashboardCard>
  );
}