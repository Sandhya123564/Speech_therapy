import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email) {
    toast.error("Please enter your email");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Something went wrong");
    }

    toast.success(data.message || "Password reset request sent");
    setEmail("");
  } catch (error) {
    toast.error(error.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-[#4B5563] hover:text-[#2D4A3E] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="card-base p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#2D4A3E] flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="font-['Fraunces'] text-2xl font-semibold text-[#1F2937]">
                Forgot Password?
              </h1>
              <p className="text-sm text-[#4B5563]">
                Enter your email to reset your password
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#1F2937]">
                Email
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full py-6"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#4B5563] mt-6">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-[#2D4A3E] font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;