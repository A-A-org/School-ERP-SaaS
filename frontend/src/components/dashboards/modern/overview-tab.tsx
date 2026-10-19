'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays,
  RefreshCcw,
  Download,
  GraduationCap,
} from 'lucide-react';

export default function OverviewTab() {
  const academicYears = [
    '2025–26',
    '2026–27',
    '2027–28',
  ];

  const semesters = [
    'Semester 1',
    'Semester 2',
  ];

  const [selectedYear, setSelectedYear] = useState('2026–27');
  const [selectedSemester, setSelectedSemester] = useState('Semester 1');

  return (
    <div className="flex items-center flex-wrap lg:flex-nowrap gap-4 justify-between">
      
      {/* Page title */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <GraduationCap size={22} />
        </div>

        <div className="flex flex-col items-start">
          <h2 className="text-xl font-semibold">
            School Management
          </h2>

          <p className="text-sm font-normal text-muted-foreground">
            Track students, attendance, classes, and school performance.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center flex-wrap gap-2">

        {/* Refresh */}
        <Button
          variant="outline"
          className="p-2.5 h-auto rounded-lg cursor-pointer"
        >
          <RefreshCcw size={16} />
        </Button>

        {/* Academic year */}
        <Select
          value={selectedYear}
          onValueChange={(value) => value && setSelectedYear(value)}
        >
          <SelectTrigger className="w-fit h-auto cursor-pointer">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} />
              <span>Academic Year</span>
              <SelectValue />
            </div>
          </SelectTrigger>

          <SelectContent>
            {academicYears.map((year) => (
              <SelectItem
                key={year}
                value={year}
                className="cursor-pointer"
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Semester */}
        <Select
          value={selectedSemester}
          onValueChange={(value) => value && setSelectedSemester(value)}
        >
          <SelectTrigger className="w-fit h-auto cursor-pointer">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {semesters.map((semester) => (
              <SelectItem
                key={semester}
                value={semester}
                className="cursor-pointer"
              >
                {semester}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Export */}
        <Button className="flex items-center gap-1.5 h-auto px-4 py-2 rounded-lg cursor-pointer">
          <Download size={16} />
          <span className="text-sm font-medium">
            Export
          </span>
        </Button>

      </div>
    </div>
  );
}