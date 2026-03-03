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
  FaArrowRight,
  FaMobileAlt,
  FaKeyboard,
  FaSpinner,
} from "react-icons/fa";

const Login = () => {
  // ── Active tab: "password" | "otp" ─────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("password");

  // ── Password login state ────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // ── OTP login state ─────────────────────────────────────────────────────────
  const [otpMobile, setOtpMobile]     = useState("");
  const [otpCode, setOtpCode]         = useState("");
  const [otpStep, setOtpStep]         = useState(1); // 1 = enter mobile, 2 = enter OTP
  const [otpLoading, setOtpLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();
  const returnTo  = location.state?.from || null;

  const goToAfterLogin = (role) => {
    if (returnTo && returnTo !== "/login" && returnTo !== "/") {
      navigate(returnTo);
    } else if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  // ── Password login submit ───────────────────────────────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/auth/login", formData);
      const { user, token } = response.data.data;
      login(user, token);
      toast.success("Login successful!");
      goToAfterLogin(user.role);
    } catch (error) {
      const msg =
        error.response?.data?.message || "Login failed. Please try again.";
      if (error.response?.status === 403 && msg.toLowerCase().includes("admin")) {
        toast.error("Admin accounts must use the Admin Login page.");
        navigate("/admin-login");
        return;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP: send OTP ───────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!/^\d{10}$/.test(otpMobile.trim())) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setOtpLoading(true);
    try {
      await api.post("/auth/send-otp", { mobile: otpMobile.trim() });
      toast.success("OTP sent to your mobile number!");
      setOtpStep(2);
      setResendTimer(30);
      const interval = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
    } catch (error) {
      const msg =
        error.response?.data?.message || "Failed to send OTP. Please try again.";
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // ── OTP: verify OTP ─────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setOtpLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", {
        mobile: otpMobile.trim(),
        otp:    otpCode.trim(),
      });
      const { user, token } = response.data.data;
      login(user, token);
      toast.success("OTP verified! Logged in successfully.");
      goToAfterLogin(user.role);
    } catch (error) {
      const msg =
        error.response?.data?.message || "OTP verification failed. Please try again.";
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-railway-blue to-blue-600 p-4 rounded-full">
              <FaTrain className="text-4xl text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">RailMadad</h1>
          <p className="text-gray-600">Login to track your complaint status</p>
        </div>

        {/* ── File a Complaint CTA ────────────────────────────────────────────── */}
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
                    <p className="text-xs text-gray-500 mt-0.5">Quick · Instant</p>
                  </div>
                </div>
                <Link
                  to="/submit"
                  className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  Start <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Login Card ──────────────────────────────────────────────────────── */}
        <div className="card-glass animate-slide-up">
          <h2 className="text-2xl font-bold text-railway-dark mb-5">
            Login to Your Account
          </h2>

          {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab("password"); setOtpStep(1); setOtpCode(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "password"
                  ? "bg-white text-railway-blue shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaLock className="text-xs" />
              Password Login
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("otp"); setOtpStep(1); setOtpCode(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "otp"
                  ? "bg-white text-green-600 shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaMobileAlt className="text-xs" />
              Login with OTP
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* PASSWORD LOGIN TAB                                                 */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field pl-10"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

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
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Logging in..." : "Login & Track My Complaint"}
              </button>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* OTP LOGIN TAB                                                      */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "otp" && (
            <div className="space-y-5">
              {/* Step indicators */}
              <div className="flex items-center gap-2 text-xs mb-2">
                <div className={`flex items-center gap-1.5 font-semibold ${otpStep === 1 ? "text-green-600" : "text-gray-400"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${otpStep === 1 ? "bg-green-500" : "bg-gray-300"}`}>1</span>
                  Enter Mobile
                </div>
                <div className="flex-1 border-t border-dashed border-gray-300" />
                <div className={`flex items-center gap-1.5 font-semibold ${otpStep === 2 ? "text-green-600" : "text-gray-400"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${otpStep === 2 ? "bg-green-500" : "bg-gray-300"}`}>2</span>
                  Enter OTP
                </div>
              </div>

              {/* ── Step 1: Enter mobile number ──────────────────────────────── */}
              {otpStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={otpMobile}
                        onChange={(e) =>
                          setOtpMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        className="input-field pl-12 font-mono tracking-widest"
                        placeholder="10-digit mobile"
                        maxLength={10}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Enter the mobile number you used when filing a complaint
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || otpMobile.length !== 10}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl transition-all"
                  >
                    {otpLoading ? (
                      <><FaSpinner className="animate-spin" /> Sending OTP…</>
                    ) : (
                      <><FaMobileAlt /> Send OTP</>
                    )}
                  </button>
                </form>
              )}

              {/* ── Step 2: Enter OTP ────────────────────────────────────────── */}
              {otpStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-start gap-2">
                    <FaMobileAlt className="mt-0.5 flex-shrink-0" />
                    <span>OTP sent to <strong>+91 {otpMobile}</strong></span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enter 6-digit OTP
                    </label>
                    <div className="relative">
                      <FaKeyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="input-field pl-10 font-mono tracking-[0.4em] text-xl text-center"
                        placeholder="• • • • • •"
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length !== 6}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl transition-all"
                  >
                    {otpLoading ? (
                      <><FaSpinner className="animate-spin" /> Verifying…</>
                    ) : (
                      "Verify OTP & Login"
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <button
                      type="button"
                      onClick={() => { setOtpStep(1); setOtpCode(""); }}
                      className="hover:text-railway-blue hover:underline"
                    >
                      ← Change number
                    </button>
                    {resendTimer > 0 ? (
                      <span>Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        className="hover:text-green-600 hover:underline font-medium"
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Register & Admin links ──────────────────────────────────────── */}
          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-railway-blue font-semibold hover:underline">
              Register here
            </Link>
          </p>

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

        {/* ── Demo Credentials ────────────────────────────────────────────────── */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-2">Demo Credentials:</p>
          <p className="text-xs text-blue-700">User: user@test.com / password123</p>
          <p className="text-xs text-blue-700">Admin: admin@test.com / password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
