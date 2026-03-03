import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  FaTrain,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaFileAlt,
  FaBolt,
  FaArrowRight,
  FaPhone,
} from "react-icons/fa";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  // If redirected from a protected page, go back there after login
  const returnTo = location.state?.from || null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);
      const { user, token } = response.data.data;

      login(user, token);
      toast.success("Login successful!");

      if (returnTo && returnTo !== "/login" && returnTo !== "/") {
        navigate(returnTo);
      } else {
        navigate("/track");
      }
    } catch (error) {
      console.error("Login error:", error);
      const msg =
        error.response?.data?.message || "Login failed. Please try again.";

      // Admin accounts are blocked from this page — redirect them
      if (
        error.response?.status === 403 &&
        msg.toLowerCase().includes("admin")
      ) {
        toast.error("Admin accounts must use the Admin Login page.");
        navigate("/admin-login");
        return;
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-railway-blue to-blue-600 p-4 rounded-full">
              <FaTrain className="text-4xl text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">RailMadad</h1>
          <p className="text-gray-600">Login to track your complaint status</p>
        </div>

        {/* ── File a Complaint — highlighted CTA above the form ── */}
        <div className="mb-5 animate-slide-up">
          <div className="relative overflow-hidden rounded-2xl p-px bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 shadow-xl">
            <div className="relative rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 px-5 py-4 overflow-hidden">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-yellow-300 opacity-20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-orange-400 opacity-20 blur-2xl pointer-events-none" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center shadow-md">
                    <FaFileAlt className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-gray-800 leading-snug">
                      File a Railway Complaint
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Quick · Instant
                    </p>
                  </div>
                </div>
                <Link
                  to="/submit"
                  className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  Start
                  <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="card-glass animate-slide-up">
          <h2 className="text-2xl font-bold text-railway-dark mb-6">
            Login to Your Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Mobile */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mobile / Email
              </label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Mobile number or email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-railway-blue hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Logging in..." : "Login & Track My Complaint"}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-railway-blue font-semibold hover:underline"
            >
              Register here
            </Link>
          </p>

          {/* Admin Login Link */}
          <div className="mt-4 text-center">
            <Link
              to="/admin-login"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-all"
            >
              <FaShieldAlt className="text-yellow-600" />
              Admin? Login here
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-2">
            Demo Credentials:
          </p>
          <p className="text-xs text-blue-700">
            User: user@test.com / password123
          </p>
          <p className="text-xs text-blue-700">
            Admin: admin@test.com / password123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
