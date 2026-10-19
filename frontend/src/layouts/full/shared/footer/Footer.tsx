import { Link } from "react-router";

export default function Footer() {
  return (
    <div className="flex md:flex-row flex-col items-center justify-between gap-3 text-center">

      <p className="text-sm text-muted-foreground">
        © 2026 School ERP Management System.
        All rights reserved.
      </p>

      <p className="text-xs text-muted-foreground">
        UI based on{" "}
        <Link
          to="https://shadcndashboard.dev/"
          target="_blank"
          className="hover:text-primary"
        >
          ShadcnDashboard
        </Link>
      </p>

    </div>
  );
}