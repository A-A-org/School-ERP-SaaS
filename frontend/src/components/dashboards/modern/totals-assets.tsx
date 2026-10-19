'use client'

import { useEffect, useState } from 'react';

import {
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { DashboardCard } from "../../shared/dashboard-card";

import {
  GraduationCap,
  Users,
  School,
  CalendarCheck,
  LayoutGrid,
} from 'lucide-react';

import { apiFetch } from '@/api/client';


type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ElementType;
};


type AttendanceRecord = {
  id: number;
  status: "PRESENT" | "ABSENT" | "LATE";
};


function StatCard({
  title,
  value,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="flex flex-col justify-between p-6 bg-background">

      <div className="border border-border rounded-md p-2 w-fit">
        <Icon width={16} height={16} />
      </div>

      <div>
        <h6 className="text-2xl font-semibold">
          {value}
        </h6>

        <p className="text-sm font-normal text-muted-foreground">
          {title}
        </p>
      </div>

    </div>
  );
}


export default function TotalAssets() {

  const [studentCount, setStudentCount] =
    useState<number | null>(null);

  const [teacherCount, setTeacherCount] =
    useState<number | null>(null);

  const [classCount, setClassCount] =
    useState<number | null>(null);

  const [attendanceRate, setAttendanceRate] =
    useState<number | null>(null);


  useEffect(() => {

    const loadDashboardData = async () => {

      try {

        // Students
        const studentData =
          await apiFetch("/api/students/");

        const students = Array.isArray(studentData)
          ? studentData
          : studentData.results || [];

        setStudentCount(students.length);


        // Teachers
const teacherData =
  await apiFetch("/api/accounts/teachers/");

const teachers = Array.isArray(teacherData)
  ? teacherData
  : teacherData.results || [];

setTeacherCount(teachers.length);


        // Classes
        const classData =
          await apiFetch("/api/academics/classes/");

        const classes = Array.isArray(classData)
          ? classData
          : classData.results || [];

        setClassCount(classes.length);


        // Attendance
        const attendanceData =
          await apiFetch("/api/attendance/");

        const attendance: AttendanceRecord[] =
          Array.isArray(attendanceData)
            ? attendanceData
            : attendanceData.results || [];


        const totalRecords =
          attendance.length;


        const presentRecords =
          attendance.filter(
            (record) =>
              record.status === "PRESENT"
          ).length;


        const percentage =
          totalRecords > 0
            ? (presentRecords / totalRecords) * 100
            : 0;


        setAttendanceRate(percentage);

      } catch (error) {

        console.error(
          "Failed to load school overview:",
          error
        );

        setStudentCount(0);
        setClassCount(0);
        setAttendanceRate(0);
        setTeacherCount(0);

      }

    };


    loadDashboardData();

  }, []);


  const schoolStats = [

    {
      id: 'students',
      title: 'Total Students',
      value:
        studentCount === null
          ? '...'
          : studentCount,
      icon: GraduationCap,
    },

    {
  id: 'teachers',
  title: 'Total Teachers',
  value:
    teacherCount === null
      ? '...'
      : teacherCount,
  icon: Users,
},

    {
      id: 'classes',
      title: 'Total Classes',
      value:
        classCount === null
          ? '...'
          : classCount,
      icon: School,
    },

    {
      id: 'attendance',
      title: 'Attendance Rate',
      value:
        attendanceRate === null
          ? '...'
          : `${attendanceRate.toFixed(1)}%`,
      icon: CalendarCheck,
    },

  ];


  return (
    <DashboardCard className="flex flex-col gap-0! pb-0!">

      <CardHeader className="border-b border-border">

        <CardTitle className="flex items-center gap-2">

          <LayoutGrid
            size={16}
            className="text-muted-foreground"
          />

          School Overview

        </CardTitle>

      </CardHeader>


      <CardContent className="h-full! px-0!">

        <div className="h-full!">

          <div className="grid grid-cols-2 h-full! gap-px bg-border">

            {schoolStats.map((item) => (

              <StatCard
                key={item.id}
                {...item}
              />

            ))}

          </div>

        </div>

      </CardContent>

    </DashboardCard>
  );
}