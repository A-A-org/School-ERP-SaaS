import { useState } from "react";
import { useNavigate } from "react-router";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { GraduationCap } from "lucide-react";


const API_URL = "http://127.0.0.1:8000";


const AuthLogin = () => {
  const navigate = useNavigate();

  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const form = e.currentTarget;

    const formData = new FormData(form);

    const username = String(
      formData.get("username") || ""
    ).trim();

    const password = String(
      formData.get("password") || ""
    );


    if (!username || !password) {
      setError("Please enter your username and password.");
      setLoading(false);
      return;
    }


    try {

      const response = await fetch(
        `${API_URL}/api/auth/login/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username,
            password,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {
        setError(
          data.detail ||
          "Invalid username or password."
        );

        setLoading(false);
        return;
      }


      // Save JWT tokens
      const storage = remember
        ? localStorage
        : sessionStorage;


      storage.setItem(
        "access_token",
        data.access
      );

      storage.setItem(
        "refresh_token",
        data.refresh
      );


      // Remove tokens from the other storage
      if (remember) {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }


      // Go to dashboard
      navigate("/");

    } catch (err) {

      console.error(err);

      setError(
        "Cannot connect to the server. Make sure the Django backend is running."
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12">

      <div className="w-full max-w-md flex flex-col gap-8">


        {/* Logo */}

        <div className="flex flex-col items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-foreground text-background">

            <GraduationCap size={28} />

          </div>


          <div className="text-center">

            <h1 className="text-2xl font-semibold text-foreground">

              School ERP

            </h1>

            <p className="text-sm text-muted-foreground mt-1">

              School Management System

            </p>

          </div>

        </div>


        {/* Welcome */}

        <div className="text-center">

          <h2 className="text-xl font-medium text-foreground">

            Welcome back

          </h2>

          <p className="text-sm text-muted-foreground mt-1">

            Sign in to access your dashboard

          </p>

        </div>


        {/* Login Form */}

        <form
          className="space-y-6"
          onSubmit={handleSubmit}
        >

          <div className="space-y-4">


            {/* Username */}

            <div className="space-y-1.5">

              <Label
                htmlFor="username"
                className="text-sm text-muted-foreground"
              >

                Username

              </Label>


              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                required
              />

            </div>


            {/* Password */}

            <div className="space-y-1.5">

              <Label
                htmlFor="password"
                className="text-sm text-muted-foreground"
              >

                Password

              </Label>


              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

            </div>


            {/* Remember */}

            <div className="flex items-center space-x-3">

              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) =>
                  setRemember(checked === true)
                }
              />


              <Label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer"
              >

                Remember this device

              </Label>

            </div>


            {/* Error */}

            {error && (

              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">

                <p className="text-sm text-destructive">

                  {error}

                </p>

              </div>

            )}

          </div>


          {/* Submit */}

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full rounded-lg"
          >

            {loading
              ? "Signing in..."
              : "Sign in"
            }

          </Button>


          <p className="text-center text-xs text-muted-foreground">

            Contact your school administrator if you cannot access your account.

          </p>

        </form>

      </div>

    </div>
  );
};


export default AuthLogin;