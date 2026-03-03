import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import {
  FaTrain,
  FaEnvelope,
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
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
          <p className="text-gray-600">Reset your password</p>
        </div>

        <div className="card-glass animate-slide-up">
          {sent ? (
            /* ── Success State ── */
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-4xl text-green-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-railway-dark mb-2">
                Check your inbox
              </h2>
              <p className="text-gray-600 mb-1">
                If an account exists for{" "}
                <span className="font-semibold text-railway-blue">{email}</span>
                , you will receive a password reset link shortly.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                The link expires in <strong>10 minutes</strong>. Check your spam
                folder if you don't see it.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-railway-blue font-semibold hover:underline"
              >
                <FaArrowLeft className="text-sm" />
                Back to Login
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <h2 className="text-2xl font-bold text-railway-dark mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Enter your registered email address and we'll send you a link to
                reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? "Sending reset link..." : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-railway-blue font-medium transition-colors"
                >
                  <FaArrowLeft className="text-xs" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
