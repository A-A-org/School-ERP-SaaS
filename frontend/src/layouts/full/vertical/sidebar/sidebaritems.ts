import { uniqueId } from "lodash";
import type { LucideIcon } from "lucide-react";

import {
  LayoutDashboard,
  GraduationCap,
  Users,
  School,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileCheck2,
  Banknote,
  Bell,
  BarChart3,
  Settings,
  UserRoundCog,
} from "lucide-react";

export interface ChildItem {
  id?: number | string;
  name: string;
  icon?: LucideIcon;
  items?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  badgeContent?: string;
  isActive?: boolean;
  external?: boolean;
  isPro?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: LucideIcon;
  id?: number;
  to?: string;
  item?: MenuItem[];
  items?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  badgeContent?: string;
  isActive?: boolean;
  isPro?: boolean;
}

const SidebarContent: MenuItem[] = [
  {
    heading: "MAIN",
    items: [
      {
        id: uniqueId(),
        name: "Dashboard",
        icon: LayoutDashboard,
        url: "/",
      },
    ],
  },

{
  heading: "PEOPLE",
  items: [
    {
      id: uniqueId(),
      name: "Students",
      icon: GraduationCap,
      url: "/students",
    },
    {
      id: uniqueId(),
      name: "Teachers",
      icon: Users,
      url: "/teachers",
    },
  ],
},

  {
    heading: "ACADEMIC",
    items: [
      {
        id: uniqueId(),
        name: "Classes",
        icon: School,
        url: "/classes",
      },
      {
        id: uniqueId(),
        name: "Subjects",
        icon: BookOpen,
        url: "/subjects",
        disabled: true,
      },
      {
        id: uniqueId(),
        name: "Attendance",
        icon: CalendarCheck,
        url: "/attendance",
      },
      {
        id: uniqueId(),
        name: "Exams",
        icon: ClipboardList,
        url: "/exams",
        disabled: true,
      },
      {
        id: uniqueId(),
        name: "Results",
        icon: FileCheck2,
        url: "/results",
        disabled: true,
      },
    ],
  },

  {
    heading: "MANAGEMENT",
    items: [
      {
        id: uniqueId(),
        name: "Finance",
        icon: Banknote,
        url: "/finance",
      },
      {
        id: uniqueId(),
        name: "Schools",
        icon: School,
        url: "/schools",
      },
      {
        id: uniqueId(),
        name: "Notifications",
        icon: Bell,
        url: "/notifications",
        disabled: true,
      },
      {
        id: uniqueId(),
        name: "Reports",
        icon: BarChart3,
        url: "/reports",
        disabled: true,
      },
    ],
  },

  {
    heading: "SYSTEM",
    items: [
      {
        id: uniqueId(),
        name: "User Profile",
        icon: UserRoundCog,
        url: "/pages/user-profile",
      },
      {
        id: uniqueId(),
        name: "Settings",
        icon: Settings,
        url: "/settings",
        disabled: true,
      },
    ],
  },
];

export default SidebarContent;