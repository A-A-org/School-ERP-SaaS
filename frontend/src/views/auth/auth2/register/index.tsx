import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Link } from "react-router";

import {
  GraduationCap,
  ShieldCheck,
} from "lucide-react";


const BoxedRegister = () => {

  return (

    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">

      <Card className="w-full max-w-md p-8">

        <div className="flex flex-col items-center text-center gap-5">


          <div className="h-14 w-14 rounded-xl bg-foreground text-background flex items-center justify-center">

            <GraduationCap size={28} />

          </div>


          <div>

            <h1 className="text-2xl font-semibold">
              School ERP
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Management System
            </p>

          </div>


          <div className="border border-border rounded-lg p-5 w-full">

            <div className="flex justify-center mb-3">

              <ShieldCheck
                size={28}
                className="text-muted-foreground"
              />

            </div>


            <h2 className="font-medium">
              Account Registration
            </h2>


            <p className="text-sm text-muted-foreground mt-2">

              User accounts are created by an authorized
              school administrator or platform owner.

            </p>

          </div>


          <p className="text-sm text-muted-foreground">

            If you need access, please contact your
            school administrator.

          </p>


          <Button
            className="w-full"
            render={
              <Link to="/auth/auth2/login" />
            }
          >
            Back to Sign In
          </Button>

        </div>

      </Card>

    </div>

  );

};


export default BoxedRegister;