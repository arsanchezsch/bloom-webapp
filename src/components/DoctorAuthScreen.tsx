import { useState } from "react";
import { Button } from "./ui/button";
import { Lock, Mail, User, Building2 } from "lucide-react";
import bloomLogo from "figma:asset/73a8a80abf64277705c5d856c147464ec33b1a04.png";

export type DoctorSession = {
  fullName: string;
  clinic: string;
  email: string;
  authenticated: boolean;
  timestamp: string;
};

interface DoctorAuthScreenProps {
  onAuthenticated: (doctor: DoctorSession) => void;
}

export function DoctorAuthScreen({ onAuthenticated }: DoctorAuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    clinic: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!formData.email || !formData.password) {
      setError("Please complete all required fields");
      return;
    }

    if (!isLogin) {
      if (!formData.fullName) {
        setError("Please enter your full name");
        return;
      }
      if (!formData.clinic) {
        setError("Please enter your clinic name");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    const doctorData: DoctorSession = {
      fullName: formData.fullName || "Doctor",
      clinic: formData.clinic || "",
      email: formData.email,
      authenticated: true,
      timestamp: new Date().toISOString(),
    };

    // 🔐 Clave alineada con App.tsx
    localStorage.setItem("bloom_doctor_session_v2", JSON.stringify(doctorData));
    onAuthenticated(doctorData);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({
      fullName: "",
      clinic: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  // Wrapper común (icono + input)
  const fieldWrapperClass =
    "rounded-2xl bg-[#F5F5F5] h-12 px-4 flex items-center gap-3 " +
    "border border-transparent transition-all " +
    "focus-within:border-[#FF6B4A] focus-within:bg-white";

  // Input interno (SIN estilos de focus)
  const fieldInputClass =
    "flex-1 bg-transparent border-none outline-none text-sm text-[#2D2D2D] " +
    "placeholder:text-[#ADADAD]";

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={bloomLogo} alt="Bloom" className="h-12" />
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-sm p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[#2D2D2D] text-2xl font-semibold mb-2">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-[#7A7A7A] text-sm">
              {isLogin
                ? "Sign in to access the system"
                : "Register your doctor account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name - Only for registration */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-[#2D2D2D] text-sm">
                  Full name
                </label>
                <div className={fieldWrapperClass}>
                  <User className="text-[#7A7A7A] w-4 h-4 shrink-0" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Dr. John Smith"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className={fieldInputClass}
                  />
                </div>
              </div>
            )}

            {/* Clinic - Only for registration */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="clinic" className="text-[#2D2D2D] text-sm">
                  Clinic
                </label>
                <div className={fieldWrapperClass}>
                  <Building2 className="text-[#7A7A7A] w-4 h-4 shrink-0" />
                  <input
                    id="clinic"
                    type="text"
                    placeholder="Skin Care Clinic"
                    value={formData.clinic}
                    onChange={(e) =>
                      setFormData({ ...formData, clinic: e.target.value })
                    }
                    className={fieldInputClass}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-[#2D2D2D] text-sm">
                Email address
              </label>
              <div className={fieldWrapperClass}>
                <Mail className="text-[#7A7A7A] w-4 h-4 shrink-0" />
                <input
                  id="email"
                  type="email"
                  placeholder="doctor@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={fieldInputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-[#2D2D2D] text-sm">
                Password
              </label>
              <div className={fieldWrapperClass}>
                <Lock className="text-[#7A7A7A] w-4 h-4 shrink-0" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={fieldInputClass}
                />
              </div>
            </div>

            {/* Confirm Password - Only for registration */}
            {!isLogin && (
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-[#2D2D2D] text-sm"
                >
                  Confirm password
                </label>
                <div className={fieldWrapperClass}>
                  <Lock className="text-[#7A7A7A] w-4 h-4 shrink-0" />
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={fieldInputClass}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:opacity-90 text-white rounded-2xl transition-opacity mt-4 text-sm font-medium"
            >
              {isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={toggleMode}
              className="text-[#7A7A7A] hover:text-[#2D2D2D] transition-colors"
            >
              {isLogin ? (
                <>
                  Don&apos;t have an account?{" "}
                  <span className="text-[#FF6B4A] font-medium">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span className="text-[#FF6B4A] font-medium">Sign in</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[#7A7A7A] mt-6 px-4 text-xs">
          Intelligent skin analysis system for professionals
        </p>
      </div>
    </div>
  );
}
