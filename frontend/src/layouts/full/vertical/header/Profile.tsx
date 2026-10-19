import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetFooter,
  SheetClose,
} from "src/components/ui/sheet";

import {
  Avatar,
  AvatarFallback,
} from "src/components/ui/avatar";

import { Button } from "src/components/ui/button";
import { Icon } from "@iconify/react";
import { Mailbox, GraduationCap } from "lucide-react";

import { cn } from "src/lib/utils";
import { profileDD } from "./data";
import { Link, useNavigate } from "react-router";


export default function ProfileSheet() {

  const navigate = useNavigate();


  const handleLogout = () => {

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");

    navigate("/auth/auth2/login");

  };


  return (
    <Sheet>

      <SheetTrigger className="cursor-pointer hover:bg-primary/5 flex items-center justify-center rounded-full h-10 w-10">

        <Avatar className="h-8 w-8">
          <AvatarFallback>
            SE
          </AvatarFallback>
        </Avatar>

      </SheetTrigger>


      <SheetContent
        showCloseButton={false}
        side="right"
        className="border-s-0 w-full sm:max-w-80 max-w-60"
      >

        <SheetClose className="absolute top-5 end-5 p-2 hover:bg-primary/5 hover:text-primary rounded-full">

          <Icon
            icon="tabler:x"
            width={20}
            height={20}
          />

        </SheetClose>


        <div className="p-6 py-6">

          <div className="flex flex-col gap-4 justify-center items-center pt-10">

            <div className="h-16 w-16 rounded-full bg-foreground text-background flex items-center justify-center">

              <GraduationCap size={30} />

            </div>


            <div className="text-center">

              <h6 className="text-lg font-semibold">
                School ERP
              </h6>


              <div className="flex items-center gap-2 justify-center">

                <Mailbox
                  size={18}
                  className="text-muted-foreground"
                />

                <span className="text-sm font-normal text-muted-foreground">
                  Management System
                </span>

              </div>

            </div>

          </div>

        </div>


        <div className="border-t border-border">

          <ul className="flex flex-col gap-2 p-6">

            {profileDD.map((item) => (

              <li
                key={item.title}
                className="group"
              >

                <Link
                  to={item.href}
                  className={cn(
                    "flex gap-3 py-2 px-3 rounded-md group-hover:bg-primary/5 text-muted-foreground"
                  )}
                >

                  <item.avatar
                    width={20}
                    height={20}
                    className="group-hover:text-primary"
                  />


                  <div className="flex gap-3 items-center">

                    <h6 className="text-sm group-hover:text-primary">
                      {item.title}
                    </h6>

                  </div>

                </Link>

              </li>

            ))}

          </ul>

        </div>


        <SheetFooter className="px-6 pb-6">

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleLogout}
          >
            Log Out
          </Button>

        </SheetFooter>

      </SheetContent>

    </Sheet>
  );
}