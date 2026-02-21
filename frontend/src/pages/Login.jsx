import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { FaTrain, FaEnvelope, FaLock, FaShieldAlt } from "react-icons/fa";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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

      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
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
          <p className="text-gray-600">AI-Powered Railway Complaint Portal</p>
        </div>

        {/* Login Form */}
        <div className="card-glass animate-slide-up">
          <h2 className="text-2xl font-bold text-railway-dark mb-6">
            Login to Your Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
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
              {loading ? "Logging in..." : "Login"}
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

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
    </div>
  );
};

export default Login;
