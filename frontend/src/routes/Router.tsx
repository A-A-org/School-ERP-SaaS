// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import { lazy, type ReactNode } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* Layouts */
const FullLayout = Loadable(
  lazy(() => import('../layouts/full/FullLayout'))
);

const BlankLayout = Loadable(
  lazy(() => import('../layouts/blank/BlankLayout'))
);

/* School ERP pages */
const ModernDashboard = Loadable(
  lazy(() => import('../views/dashboards/modern'))
);

const UserProfilePage = Loadable(
  lazy(() => import('../views/pages/user-profile'))
);

const StudentsPage = Loadable(
  lazy(() => import('../views/students'))
);

const TeachersPage = Loadable(
  lazy(() => import('../views/teachers'))
);

const FinancePage = Loadable(
  lazy(() => import('../views/finance'))
);

const ClassesPage = Loadable(
  lazy(() => import('../views/classes'))
);

const AttendancePage = Loadable(
  lazy(() => import('../views/attendance'))
);

/* Authentication */
const Login = Loadable(
  lazy(() => import('../views/auth/auth2/login'))
);

const Register = Loadable(
  lazy(() => import('../views/auth/auth2/register'))
);

const ForgotPassword = Loadable(
  lazy(() => import('../views/auth/auth2/forgot-password'))
);

const SchoolsPage = Loadable(
  lazy(() => import('../views/schools'))
);
const SchoolDetailsPage = Loadable(
  lazy(() => import('../views/schools/details'))
);

const ErrorPage = Loadable(
  lazy(() => import('../views/auth/error'))
);


/* Protect School ERP pages */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken =
   localStorage.getItem('access_token') ||
   sessionStorage.getItem('access_token');

  const refreshToken =
   localStorage.getItem('refresh_token') ||
   sessionStorage.getItem('refresh_token');

  if (!accessToken && !refreshToken) {
    return (
      <Navigate
        to="/auth/auth2/login"
        replace
      />
    );
  }

  return <>{children}</>;
}


const Router = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <FullLayout />
      </ProtectedRoute>
    ),

    children: [



      {
        index: true,
        element: <ModernDashboard />,
      },

      {
        path: 'dashboards/modern',
        element: <ModernDashboard />,
      },

      {
        path: 'students',
        element: <StudentsPage />,
      },

      {
        path: 'classes',
        element: <ClassesPage />,
      },
      {
        path: 'attendance',
        element: <AttendancePage />,
      },

      {
        path: 'finance',
        element: <FinancePage />,
      },
      {
        path: 'teachers',
        element: <TeachersPage />,
      },

      {
        path: 'pages/user-profile',
        element: <UserProfilePage />,
      },

      {
       path: 'schools',
       element: <SchoolsPage />,
      },
      {
       path: 'schools/:id',
       element: <SchoolDetailsPage />,
       },

      {
        path: '*',
        element: <Navigate to="/auth/404" replace />,
      },
    ],
  },

  {
    path: '/',
    element: <BlankLayout />,

    children: [
      {
        path: 'auth/auth2/login',
        element: <Login />,
      },

      {
        path: 'auth/auth2/register',
        element: <Register />,
      },

      {
        path: 'auth/auth2/forgot-password',
        element: <ForgotPassword />,
      },

      {
        path: 'auth/404',
        element: <ErrorPage />,
      },

      {
        path: '*',
        element: <Navigate to="/auth/404" replace />,
      },
    ],
  },
];


const router = createBrowserRouter(Router);

export default router;