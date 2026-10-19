import { Link } from "react-router";
import { GraduationCap } from "lucide-react";

const FullLogo = () => {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 overflow-hidden"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
        <GraduationCap className="h-5 w-5" />
      </div>

      <div className="flex flex-col leading-tight group-data-[state=collapsed]:hidden">
        <span className="text-sm font-semibold whitespace-nowrap">
          School ERP
        </span>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          Management System
        </span>
      </div>
    </Link>
  );
};

export default FullLogo;