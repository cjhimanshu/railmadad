import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import {
  FaTrain,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
} from "react-icons/fa";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, {
        password: formData.password,
      });
      setDone(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Reset failed. The link may have expired.";
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
          <p className="text-gray-600">Set a new password</p>
        </div>

        <div className="card-glass animate-slide-up">
          {done ? (
            /* ── Success State ── */
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-4xl text-green-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-railway-dark mb-2">
                Password Updated!
              </h2>
              <p className="text-gray-600 mb-6">
                Your password has been reset successfully. Redirecting you to
                login…
              </p>
              <Link to="/login" className="btn-primary inline-block px-8">
                Go to Login
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <h2 className="text-2xl font-bold text-railway-dark mb-2">
                Create New Password
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Your new password must be at least 6 characters long.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="input-field pl-10 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={formData.confirm}
                      onChange={(e) =>
                        setFormData({ ...formData, confirm: e.target.value })
                      }
                      className="input-field pl-10 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {/* Inline match indicator */}
                  {formData.confirm && (
                    <p
                      className={`text-xs mt-1 ${
                        formData.password === formData.confirm
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {formData.password === formData.confirm
                        ? "✓ Passwords match"
                        : "✗ Passwords do not match"}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? "Resetting password..." : "Reset Password"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-gray-500 hover:text-railway-blue font-medium transition-colors"
                >
                  Remember your password?{" "}
                  <span className="text-railway-blue font-semibold">Login</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
