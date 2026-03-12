import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTrain, FaCheckCircle, FaSearch, FaHome } from "react-icons/fa";
import ComplaintForm from "../components/ComplaintForm";

const SubmitComplaint = () => {
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState(null);
  const navigate = useNavigate();

  const handleSuccess = (complaint) => {
    setComplaintId(complaint?._id || null);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full card-glass text-center animate-slide-up">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <FaCheckCircle className="text-5xl text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Complaint Registered!
          </h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Your complaint has been successfully submitted and forwarded to the
            concerned railway authority.
            <br />
            <br />
            <strong>Check your email</strong> — we've sent you a link to set
            your password. Once set, you can login anytime to track the status
            of your complaint.
          </p>

          <div className="space-y-3">
            <Link
              to="/login"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <FaSearch />
              Login to Track your Complaint
            </Link>
            <Link
              to="/submit"
              onClick={() => setSubmitted(false)}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-railway-blue font-bold text-xl"
          >
            <FaTrain />
            <span>RailMadad</span>
          </Link>
        </div>

        {/* Info banner */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-start gap-2">
          <span className="text-lg mt-0.5">💡</span>
          <span>
            <strong>No account needed.</strong> Fill in your mobile or email —
            you'll use the same details to track your complaint status later.
          </span>
        </div>

        <ComplaintForm onSubmitSuccess={handleSuccess} />

        <p className="text-center mt-6 text-sm text-gray-500">
          Already submitted a complaint?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Login to track status
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SubmitComplaint;
