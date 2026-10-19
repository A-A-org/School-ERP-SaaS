'use client';

import { useEffect, useState } from "react";

import {
  User,
  Mail,
  Shield,
  AtSign,
} from "lucide-react";

import { Card } from "@/components/ui/card";

import BreadcrumbComp from "src/layouts/full/shared/breadcrumb/BreadcrumbComp";
import StyleDivider from "../shared/StyleDivider";

import { apiFetch } from "@/api/client";


type CurrentUser = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
};


const UserProfile = () => {

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const BCrumb = [
    {
      to: "/",
      title: "Dashboard",
    },
    {
      title: "User Profile",
    },
  ];


  useEffect(() => {

    const loadUser = async () => {

      try {

        const data =
          await apiFetch("/api/accounts/me/");

        setUser(data);

      } catch (error) {

        console.error(
          "Failed to load user profile:",
          error
        );

        setError(
          "Failed to load profile information."
        );

      } finally {

        setLoading(false);

      }

    };


    loadUser();

  }, []);


  if (loading) {

    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading profile...
      </div>
    );

  }


  if (error || !user) {

    return (
      <div className="p-6 text-sm text-destructive">
        {error || "Profile not found."}
      </div>
    );

  }


  const initials =
    user.full_name
      ? user.full_name
          .split(" ")
          .map((name) => name[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : user.username
          .slice(0, 2)
          .toUpperCase();


  return (

    <div className="flex flex-col p-px bg-border gap-px">

      <BreadcrumbComp
        title="User Profile"
        items={BCrumb}
      />

      <StyleDivider />


      <div className="flex flex-col gap-px bg-border">

        <Card className="p-6 overflow-hidden">

          <div className="flex flex-col sm:flex-row items-center gap-6">


            <div className="h-20 w-20 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-semibold">

              {initials}

            </div>


            <div className="flex flex-col sm:text-left text-center gap-1">

              <h2 className="text-xl font-semibold">

                {user.full_name || user.username}

              </h2>


              <p className="text-sm text-muted-foreground">

                {user.role.replace(/_/g, " ")}

              </p>

            </div>

          </div>

        </Card>


        <Card className="p-6">

          <h3 className="text-base font-semibold mb-6">

            Account Information

          </h3>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            <div className="flex items-start gap-3">

              <div className="border border-border rounded-md p-2">

                <User size={18} />

              </div>


              <div>

                <p className="text-xs text-muted-foreground">
                  Full Name
                </p>

                <p className="text-sm font-medium mt-1">

                  {user.full_name || "Not provided"}

                </p>

              </div>

            </div>


            <div className="flex items-start gap-3">

              <div className="border border-border rounded-md p-2">

                <AtSign size={18} />

              </div>


              <div>

                <p className="text-xs text-muted-foreground">
                  Username
                </p>

                <p className="text-sm font-medium mt-1">

                  {user.username}

                </p>

              </div>

            </div>


            <div className="flex items-start gap-3">

              <div className="border border-border rounded-md p-2">

                <Mail size={18} />

              </div>


              <div>

                <p className="text-xs text-muted-foreground">
                  Email
                </p>

                <p className="text-sm font-medium mt-1">

                  {user.email || "Not provided"}

                </p>

              </div>

            </div>


            <div className="flex items-start gap-3">

              <div className="border border-border rounded-md p-2">

                <Shield size={18} />

              </div>


              <div>

                <p className="text-xs text-muted-foreground">
                  Role
                </p>

                <p className="text-sm font-medium mt-1">

                  {user.role.replace(/_/g, " ")}

                </p>

              </div>

            </div>


          </div>

        </Card>

      </div>

    </div>

  );
};


export default UserProfile;