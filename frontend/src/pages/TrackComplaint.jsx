import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaEnvelope,
  FaHome,
  FaLock,
  FaPhone,
  FaSearch,
  FaSync,
  FaTools,
  FaTrain,
  FaUserShield,
} from "react-icons/fa";
import { MdSend, MdVerified } from "react-icons/md";
import api from "../utils/api";

const STAGES = [
  {
    key: "registered",
    label: "Registered",
    icon: FaCheckCircle,
    dot: "bg-blue-500",
    ring: "ring-blue-300",
    bg: "bg-blue-50",
    text: "text-blue-700",
    desc: "Your complaint has been received and registered.",
  },
  {
    key: "sent_to_authority",
    label: "Sent to Authority",
    icon: MdSend,
    dot: "bg-orange-500",
    ring: "ring-orange-300",
    bg: "bg-orange-50",
    text: "text-orange-700",
    desc: "The complaint has been forwarded to the concerned department.",
  },
  {
    key: "authority_taken_action",
    label: "Action Taken",
    icon: FaTools,
    dot: "bg-indigo-500",
    ring: "ring-indigo-300",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    desc: "The concerned authority has taken action on your complaint.",
  },
  {
    key: "resolved",
    label: "Resolved",
    icon: MdVerified,
    dot: "bg-green-500",
    ring: "ring-green-300",
    bg: "bg-green-50",
    text: "text-green-700",
    desc: "Your complaint has been resolved.",
  },
];

const stageIndex = (key) => STAGES.findIndex((stage) => stage.key === key);

const StatusBadge = ({ status }) => {
  const palette = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${palette[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
};

const TrackingTimeline = ({ trackingStatus, trackingHistory }) => {
  const current = Math.max(0, stageIndex(trackingStatus || "registered"));
  const activeStage = STAGES[current];

  return (
    <div className="mt-5">
      <div className="flex items-center">
        {STAGES.map((stage, index) => {
          const done = index <= current;
          const active = index === current;
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    done
                      ? `${stage.dot} border-transparent text-white shadow`
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  } ${active ? `ring-4 ring-offset-1 ring-opacity-40 ${stage.ring}` : ""}`}
                >
                  <Icon className="text-sm" />
                </div>
                <span
                  className={`mt-2 text-[10px] font-semibold text-center w-20 leading-tight ${
                    done ? stage.text : "text-gray-400"
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {index < STAGES.length - 1 ? (
                <div
                  className={`flex-1 h-1 mx-1 rounded ${
                    index < current ? stage.dot : "bg-gray-200"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div
        className={`mt-4 px-4 py-3 rounded-xl text-sm ${activeStage?.bg} ${activeStage?.text}`}
      >
        <strong>{activeStage?.label}:</strong> {activeStage?.desc}
      </div>

      {trackingHistory?.length ? (
        <div className="mt-4 space-y-2">
          {[...trackingHistory].reverse().map((entry, index) => {
            const stage = STAGES.find((item) => item.key === entry.stage);

            return (
              <div
                key={`${entry.stage}-${index}`}
                className="flex items-start gap-2 text-xs text-gray-500"
              >
                <span
                  className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${stage?.dot || "bg-gray-400"}`}
                />
                <span>
                  <strong className={stage?.text || "text-gray-700"}>
                    {stage?.label || entry.stage}
                  </strong>
                  {" - "}
                  {new Date(entry.updatedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {entry.note ? ` - ${entry.note}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const ComplaintResult = ({ complaint }) => {
  const [expanded, setExpanded] = useState(true);
  const department =
    complaint.assignedDepartment &&
    complaint.assignedDepartment !== "unassigned"
      ? complaint.assignedDepartment.replace(/_/g, " ")
      : null;

  return (
    <div className="card-glass animate-fade-in">
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">
              {complaint.complaintNumber}
            </span>
            <StatusBadge status={complaint.status} />
            <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 font-semibold capitalize">
              {complaint.category?.replace(/_/g, " ")}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-gray-800">
            {complaint.title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tracking ID:{" "}
            <span className="font-mono font-semibold text-gray-700">
              {complaint.trackingUserId}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="text-gray-400 hover:text-blue-600 p-1 mt-1"
        >
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

      <TrackingTimeline
        trackingStatus={complaint.trackingStatus}
        trackingHistory={complaint.trackingHistory}
      />

      {expanded ? (
        <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="space-y-3">
            <p>
              <strong>Description:</strong>{" "}
              {complaint.description || "No additional details were provided."}
            </p>
            <p>
              <strong>PNR Number:</strong> {complaint.pnrNumber}
            </p>
            {complaint.trainNumber ? (
              <p>
                <strong>Train Number:</strong> {complaint.trainNumber}
              </p>
            ) : null}
            {department ? (
              <p>
                <strong>Assigned Department:</strong> {department}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              <span>
                <strong>Filed:</strong>{" "}
                {new Date(complaint.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>
            {complaint.resolvedAt ? (
              <p className="flex items-center gap-2 text-green-700">
                <FaCheckCircle />
                <span>
                  <strong>Resolved:</strong>{" "}
                  {new Date(complaint.resolvedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </p>
            ) : null}
            {complaint.contactMobileMasked ? (
              <p className="flex items-center gap-2">
                <FaPhone className="text-gray-400" />
                <span>
                  <strong>SMS updates sent to:</strong>{" "}
                  {complaint.contactMobileMasked}
                </span>
              </p>
            ) : null}
            {complaint.contactEmailMasked ? (
              <p className="flex items-center gap-2">
                <FaEnvelope className="text-gray-400" />
                <span>
                  <strong>Email linked:</strong> {complaint.contactEmailMasked}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {complaint.authorityActionNotes ? (
        <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-800">
          <strong>Latest action note:</strong> {complaint.authorityActionNotes}
        </div>
      ) : null}
    </div>
  );
};

const TrackComplaint = () => {
  const location = useLocation();
  const [credentials, setCredentials] = useState({
    trackingUserId: location.state?.trackingUserId || "",
    password: location.state?.password || "",
  });
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const trackComplaint = async (event) => {
    if (event) {
      event.preventDefault();
    }

    setLoading(true);

    try {
      const response = await api.post("/complaints/track", credentials);
      setComplaint(response.data.data);
      setSubmitted(true);
    } catch (_) {
      if (!submitted) {
        setComplaint(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.trackingUserId && location.state?.password) {
      trackComplaint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <FaHome className="text-xs" />
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

        <div className="mb-6 rounded-2xl border border-blue-100 bg-white/80 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <FaUserShield className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Track Complaint Status
              </h1>
              <p className="text-sm text-gray-500">
                No normal login required. Use the tracking ID and password sent
                after complaint submission.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={trackComplaint} className="card-glass mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tracking ID
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={credentials.trackingUserId}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      trackingUserId: event.target.value.toUpperCase(),
                    }))
                  }
                  className="input-field pl-10 font-mono"
                  placeholder="TRK-XXXXXXXX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      password: event.target.value.toUpperCase(),
                    }))
                  }
                  className="input-field pl-10 font-mono"
                  placeholder="Enter your tracking password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Checking status..." : "Check Complaint Status"}
            </button>

            {submitted ? (
              <button
                type="button"
                onClick={trackComplaint}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                <FaSync className={`inline mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            ) : null}
          </div>
        </form>

        {complaint ? (
          <ComplaintResult complaint={complaint} />
        ) : (
          <div className="card-glass text-center py-14 text-gray-500">
            <FaSearch className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="font-semibold">Enter your tracking credentials.</p>
            <p className="text-sm mt-1 max-w-md mx-auto">
              After you submit a complaint, RailMadad sends a complaint number,
              tracking ID, and password by SMS and email.
            </p>
            <Link
              to="/submit"
              className="inline-block mt-4 text-sm text-blue-600 font-semibold hover:underline"
            >
              File a new complaint
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackComplaint;
