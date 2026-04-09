import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaCopy,
  FaHome,
  FaSearch,
  FaTrain,
} from "react-icons/fa";
import ComplaintForm from "../components/ComplaintForm";

const SubmitComplaint = () => {
  const [submitted, setSubmitted] = useState(false);
  const [complaint, setComplaint] = useState(null);
  const [copiedField, setCopiedField] = useState("");

  const handleSuccess = (nextComplaint) => {
    setComplaint(nextComplaint || null);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyValue = async (label, value) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(""), 1500);
    } catch (_) {
      setCopiedField("");
    }
  };

  if (submitted) {
    const credentials = complaint?.trackingCredentials || {};

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full card-glass text-center animate-slide-up">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <FaCheckCircle className="text-5xl text-green-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Complaint Registered
          </h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Your complaint has been submitted successfully. We have sent the
            tracking details to your mobile number by SMS and to your email
            address.
          </p>

          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 text-left space-y-3 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Complaint Number
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-mono text-sm font-bold text-gray-800">
                  {credentials.complaintNumber || complaint?.complaintNumber}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    copyValue(
                      "complaint",
                      credentials.complaintNumber || complaint?.complaintNumber,
                    )
                  }
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <FaCopy className="inline mr-1" />
                  {copiedField === "complaint" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Tracking ID
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-mono text-sm font-bold text-gray-800">
                  {credentials.trackingUserId}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    copyValue("tracking", credentials.trackingUserId)
                  }
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <FaCopy className="inline mr-1" />
                  {copiedField === "tracking" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Password
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-mono text-sm font-bold text-gray-800">
                  {credentials.trackingPassword}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    copyValue("password", credentials.trackingPassword)
                  }
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <FaCopy className="inline mr-1" />
                  {copiedField === "password" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/track"
              state={{
                trackingUserId: credentials.trackingUserId,
                password: credentials.trackingPassword,
              }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <FaSearch />
              Track This Complaint
            </Link>
            <Link
              to="/submit"
              onClick={() => {
                setSubmitted(false);
                setComplaint(null);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all text-sm font-semibold"
            >
              Submit Another Complaint
            </Link>
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm text-gray-500 hover:text-gray-700 transition-all"
            >
              <FaHome /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Back to Home
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-railway-blue font-bold text-xl"
          >
            <FaTrain />
            <span>RailMadad</span>
          </Link>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <strong>No login required.</strong> Enter your mobile number and email
          address. After submission, RailMadad will generate a complaint number,
          tracking ID, and password for you automatically.
        </div>

        <ComplaintForm onSubmitSuccess={handleSuccess} />

        <p className="text-center mt-6 text-sm text-gray-500">
          Already submitted a complaint?{" "}
          <Link to="/track" className="text-blue-600 font-semibold hover:underline">
            Track it here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SubmitComplaint;
