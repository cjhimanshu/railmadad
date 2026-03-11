import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaTrain,
  FaFileAlt,
  FaSearch,
  FaShieldAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { MdSend } from "react-icons/md";

const steps = [
  {
    icon: FaFileAlt,
    label: "File Complaint",
    desc: "Describe your issue. No login needed.",
  },
  {
    icon: MdSend,
    label: "Sent to Authority",
    desc: "Forwarded to the concerned department.",
  },
  {
    icon: FaSearch,
    label: "Action Taken",
    desc: "Authority addresses the issue.",
  },
  {
    icon: FaCheckCircle,
    label: "Resolved",
    desc: "Complaint closed & confirmed.",
  },
];

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xl font-bold">
          <FaTrain className="text-yellow-400 text-2xl" />
          <span>RailMadad</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-white/70 hover:text-white transition-colors"
              >
                My Dashboard
              </Link>
              <Link
                to="/track"
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Track Status
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-white/70 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/admin-login"
                className="text-white/70 hover:text-white transition-colors flex items-center gap-1"
              >
                <FaShieldAlt className="text-yellow-400 text-xs" />
                Admin
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-20 pb-10 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
          <FaTrain className="text-yellow-400" />
          <span>Indian Railway Complaint Portal</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">
          Your Voice,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            Heard Fast
          </span>
        </h1>
        <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto mb-8 sm:mb-12">
          File a railway complaint in seconds — no account required. Login only
          when you want to check its progress.
        </p>

        {/* CTA cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Submit */}
          <Link
            to="/submit"
            className="group bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-left text-gray-900 hover:scale-105 transition-transform shadow-2xl"
          >
            <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center mb-4">
              <FaFileAlt className="text-2xl" />
            </div>
            <h2 className="text-xl font-bold mb-1">File a Complaint</h2>
            <p className="text-sm text-gray-800 leading-snug">
              No login needed. Just your PNR and contact info.
            </p>
            <div className="mt-4 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
              Start Now →
            </div>
          </Link>

          {/* Track */}
          <Link
            to={user ? "/track" : "/login"}
            className="group bg-white/10 border border-white/20 rounded-2xl p-6 text-left hover:bg-white/20 transition-all hover:scale-105 shadow-xl"
          >
            <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center mb-4">
              <FaSearch className="text-2xl text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">Track Status</h2>
            <p className="text-sm text-white/70 leading-snug">
              Login with the same email or mobile to see real-time updates.
            </p>
            <div className="mt-4 text-sm font-semibold text-green-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              {user ? "View My Complaints →" : "Login to Track →"}
            </div>
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-white/40 mb-8">
          How it works
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-3">
                  <Icon className="text-yellow-400 text-xl" />
                </div>
                <div className="text-xs font-bold text-white/90 mb-1">
                  {s.label}
                </div>
                <div className="text-xs text-white/50 leading-snug">
                  {s.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* connector line for desktop */}
        <div className="hidden md:flex justify-between items-center -mt-16 mb-10 px-14 pointer-events-none select-none">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-px bg-white/10 mx-2" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
