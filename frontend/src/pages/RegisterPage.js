import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { MessageCircle, Eye, EyeOff, ArrowLeft, User, Users, Stethoscope, Check } from "lucide-react";
import { toast } from "sonner";

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedRole = searchParams.get("role") || "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: preselectedRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { id: "patient", label: "Patient", icon: User, description: "I'm practicing speech exercises" },
    { id: "parent", label: "Parent/Caregiver", icon: Users, description: "I'm helping someone" },
    { id: "therapist", label: "Therapist", icon: Stethoscope, description: "I'm a professional" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const user = await register(formData.email, formData.password, formData.name, formData.role);
      toast.success(`Welcome to FluentAI, ${user.name}!`);
      navigate(user.role === "therapist" ? "/therapist" : "/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-[#4B5563] hover:text-[#2D4A3E] mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="card-base p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#2D4A3E] flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-['Fraunces'] text-2xl font-semibold text-[#1F2937]">Create account</h1>
                <p className="text-sm text-[#4B5563]">Start your speech therapy journey</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-[#1F2937]">I am a...</Label>
                <div className="grid grid-cols-3 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => updateFormData("role", role.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        formData.role === role.id
                          ? "border-[#2D4A3E] bg-[#2D4A3E]/5"
                          : "border-gray-200 hover:border-[#2D4A3E]/30"
                      }`}
                      data-testid={`role-select-${role.id}`}
                    >
                      {formData.role === role.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2D4A3E] flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <role.icon className={`w-6 h-6 mb-2 ${formData.role === role.id ? "text-[#2D4A3E]" : "text-[#9CA3AF]"}`} />
                      <p className={`text-sm font-medium ${formData.role === role.id ? "text-[#2D4A3E]" : "text-[#4B5563]"}`}>
                        {role.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#1F2937]">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="input-base"
                  data-testid="register-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1F2937]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="input-base"
                  data-testid="register-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1F2937]">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    className="input-base pr-10"
                    data-testid="register-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#1F2937]">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                  className="input-base"
                  data-testid="register-confirm-password-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full py-6 font-medium"
                data-testid="register-submit-btn"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-[#4B5563] mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-[#2D4A3E] font-medium hover:underline" data-testid="login-link">
                Sign in
              </Link>
            </p>

            {/* Medical Disclaimer */}
            <div className="medical-disclaimer mt-6 text-xs">
              By creating an account, you acknowledge that FluentAI provides guided speech exercises 
              and does not replace professional speech therapy or medical diagnosis.
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D4A3E]/20 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1772419130717-e0630e3e4f28?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxzcGVlY2glMjB0aGVyYXBpc3QlMjBoZWxwaW5nJTIwY2hpbGR8ZW58MHx8fHwxNzczMTUwNDIzfDA&ixlib=rb-4.1.0&q=85"
          alt="Speech therapy"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default RegisterPage;
