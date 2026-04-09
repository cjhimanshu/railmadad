import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaCheckCircle,
  FaFileAlt,
  FaSearch,
  FaShieldAlt,
  FaSms,
  FaTrain,
} from "react-icons/fa";
import { MdSend } from "react-icons/md";

const steps = [
  {
    icon: FaFileAlt,
    label: "File Complaint",
    desc: "Submit your issue with PNR, mobile number, and email.",
  },
  {
    icon: FaSms,
    label: "Get Credentials",
    desc: "Receive a tracking ID and password by SMS and email.",
  },
  {
    icon: MdSend,
    label: "Track Updates",
    desc: "Watch the complaint move from authority review to action.",
  },
  {
    icon: FaCheckCircle,
    label: "Resolution",
    desc: "Get the final resolution update without using normal login.",
  },
];

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xl font-bold">
          <FaTrain className="text-yellow-400 text-2xl" />
          <span>RailMadad</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          {user ? (
            <Link
              to="/dashboard"
              className="text-white/70 hover:text-white transition-colors"
            >
              My Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-white/70 hover:text-white transition-colors"
            >
              User Login
            </Link>
          )}

          <Link
            to="/track"
            className="text-white/70 hover:text-white transition-colors"
          >
            Track Complaint
          </Link>

          <Link
            to="/admin-login"
            className="text-white/70 hover:text-white transition-colors flex items-center gap-1"
          >
            <FaShieldAlt className="text-yellow-400 text-xs" />
            Admin
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-20 pb-10 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
          <FaTrain className="text-yellow-400" />
          <span>Indian Railway Complaint Portal</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">
          Raise Complaints Fast,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            Track Them Without Login
          </span>
        </h1>

        <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8 sm:mb-12">
          Submit a railway complaint in seconds. RailMadad generates a unique
          tracking ID and password, then keeps you updated step by step by SMS
          until resolution.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Link
            to="/submit"
            className="group bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-left text-gray-900 hover:scale-105 transition-transform shadow-2xl"
          >
            <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center mb-4">
              <FaFileAlt className="text-2xl" />
            </div>
            <h2 className="text-xl font-bold mb-1">File a Complaint</h2>
            <p className="text-sm text-gray-800 leading-snug">
              No account needed. Submit once and receive your tracking
              credentials automatically.
            </p>
            <div className="mt-4 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
              Start Now
            </div>
          </Link>

          <Link
            to="/track"
            className="group bg-white/10 border border-white/20 rounded-2xl p-6 text-left hover:bg-white/20 transition-all hover:scale-105 shadow-xl"
          >
            <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center mb-4">
              <FaSearch className="text-2xl text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">Track Complaint</h2>
            <p className="text-sm text-white/70 leading-snug">
              Use your tracking ID and password to view live complaint progress
              any time.
            </p>
            <div className="mt-4 text-sm font-semibold text-green-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Open Tracker
            </div>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-white/40 mb-8">
          How it works
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-3">
                  <Icon className="text-yellow-400 text-xl" />
                </div>
                <div className="text-xs font-bold text-white/90 mb-1">
                  {step.label}
                </div>
                <div className="text-xs text-white/50 leading-snug">
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden md:flex justify-between items-center -mt-16 mb-10 px-14 pointer-events-none select-none">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex-1 h-px bg-white/10 mx-2" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
