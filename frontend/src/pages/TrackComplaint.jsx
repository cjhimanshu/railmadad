import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  FaCheckCircle,
  FaClock,
  FaTools,
  FaChevronDown,
  FaChevronUp,
  FaSync,
  FaFilter,
  FaTrain,
  FaCalendarAlt,
} from "react-icons/fa";
import { MdSend, MdVerified } from "react-icons/md";

// â”€â”€ Tracking stages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    desc: "Forwarded to the concerned department.",
  },
  {
    key: "authority_taken_action",
    label: "Action Taken",
    icon: FaTools,
    dot: "bg-purple-500",
    ring: "ring-purple-300",
    bg: "bg-purple-50",
    text: "text-purple-700",
    desc: "The authority has taken action on your complaint.",
  },
  {
    key: "resolved",
    label: "Resolved",
    icon: MdVerified,
    dot: "bg-green-500",
    ring: "ring-green-300",
    bg: "bg-green-50",
    text: "text-green-700",
    desc: "Your complaint has been fully resolved.",
  },
];

const stageIdx = (key) => STAGES.findIndex((s) => s.key === key);

// â”€â”€ Status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StatusBadge = ({ status }) => {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
};

// â”€â”€ 4-step timeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TrackingTimeline = ({ trackingStatus, trackingHistory }) => {
  const current = stageIdx(trackingStatus ?? "registered");
  return (
    <div className="mt-4">
      <div className="flex items-center">
        {STAGES.map((stage, idx) => {
          const done = idx <= current;
          const active = idx === current;
          const Icon = stage.icon;
          return (
            <div
              key={stage.key}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                    ${done ? `${stage.dot} border-transparent text-white shadow` : "bg-gray-100 border-gray-300 text-gray-400"}
                    ${active ? `ring-4 ring-offset-1 ring-opacity-40 ${stage.ring}` : ""}
                  `}
                >
                  <Icon className="text-sm" />
                </div>
                <span
                  className={`mt-1 text-[9.5px] font-semibold text-center w-16 leading-tight ${done ? stage.text : "text-gray-400"}`}
                >
                  {stage.label}
                </span>
              </div>
              {idx < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-1 rounded ${idx < current ? stage.dot : "bg-gray-200"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`mt-3 px-3 py-2 rounded-lg text-sm ${STAGES[current]?.bg} ${STAGES[current]?.text}`}
      >
        <strong>{STAGES[current]?.label}:</strong> {STAGES[current]?.desc}
      </div>

      {trackingHistory?.length > 0 && (
        <div className="mt-3 space-y-1">
          {[...trackingHistory].reverse().map((h, i) => {
            const s = STAGES.find((st) => st.key === h.stage);
            return (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-gray-500"
              >
                <span
                  className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${s?.dot || "bg-gray-400"}`}
                />
                <span>
                  <strong className={s?.text}>{s?.label}</strong>
                  {" â€” "}
                  {new Date(h.updatedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {h.note ? ` Â· ${h.note}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// â”€â”€ Complaint card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ComplaintCard = ({ complaint, index }) => {
  const [expanded, setExpanded] = useState(false);
  const dept =
    complaint.assignedDepartment !== "unassigned"
      ? complaint.assignedDepartment?.replace(/_/g, " ")
      : null;

  return (
    <div className="card-glass mb-4 animate-fade-in">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">
              #{index + 1}
            </span>
            <StatusBadge status={complaint.status} />
            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 font-semibold capitalize">
              {complaint.category?.replace(/_/g, " ") || "other"}
            </span>
          </div>
          <h3 className="mt-1 text-base font-bold text-gray-800">
            {complaint.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Filed:{" "}
            {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {complaint.pnrNumber && ` · PNR: ${complaint.pnrNumber}`}
            {complaint.trainNumber && ` · Train: ${complaint.trainNumber}`}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-blue-600 p-1 mt-1"
        >
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

      <TrackingTimeline
        trackingStatus={complaint.trackingStatus || "registered"}
        trackingHistory={complaint.trackingHistory || []}
      />

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-700">
          <p>
            <strong>Description:</strong> {complaint.description}
          </p>
          {dept && (
            <p>
              <strong>Assigned To:</strong>{" "}
              <span className="capitalize">{dept}</span>
            </p>
          )}
          {complaint.authorityMarkedDone && complaint.authorityActionNotes && (
            <div className="p-2 bg-purple-50 rounded text-purple-800">
              <strong>Authority Notes:</strong> {complaint.authorityActionNotes}
            </div>
          )}
          {complaint.resolvedAt && (
            <p className="text-green-700 font-medium">
              âœ… Resolved on:{" "}
              {new Date(complaint.resolvedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// â”€â”€ Main Page (requires login) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TrackComplaint = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pnrFilter, setPnrFilter] = useState("");
  const [trainFilter, setTrainFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchComplaints = async (pnr = "", train = "", from = "", to = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (pnr.trim()) params.append("pnrNumber", pnr.trim());
      if (train.trim()) params.append("trainNumber", train.trim());
      if (from) params.append("dateFrom", from);
      if (to) params.append("dateTo", to);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get(`/complaints/track${query}`);
      setComplaints(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load complaints.");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchComplaints(pnrFilter, trainFilter, dateFrom, dateTo);
  };

  const handleClear = () => {
    setPnrFilter("");
    setTrainFilter("");
    setDateFrom("");
    setDateTo("");
    fetchComplaints("", "", "", "");
  };

  const hasFilters = pnrFilter || trainFilter || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              My Complaint Status
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Complaints linked to{" "}
              <strong>{user?.email || user?.phone || "your account"}</strong>
            </p>
          </div>
          <button
            onClick={() =>
              fetchComplaints(pnrFilter, trainFilter, dateFrom, dateTo)
            }
            disabled={loading}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <form onSubmit={handleFilter} className="card-glass mb-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <FaFilter className="text-gray-400 text-sm" />
            <span className="text-sm font-semibold text-gray-600">
              Filter Complaints
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PNR */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                PNR
              </span>
              <input
                type="text"
                value={pnrFilter}
                onChange={(e) =>
                  setPnrFilter(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="Filter by PNR number"
                maxLength={10}
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Train Number */}
            <div className="relative">
              <FaTrain className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={trainFilter}
                onChange={(e) => setTrainFilter(e.target.value)}
                placeholder="Filter by train number"
                maxLength={6}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Date From */}
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-400"
              />
              <span className="absolute -top-2 left-2 text-[10px] bg-white px-1 text-gray-400">
                From
              </span>
            </div>

            {/* Date To */}
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-400"
              />
              <span className="absolute -top-2 left-2 text-[10px] bg-white px-1 text-gray-400">
                To
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Apply Filters
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-gray-500 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="card-glass animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : complaints.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {complaints.length} complaint{complaints.length > 1 ? "s" : ""}{" "}
              found
            </p>
            {complaints.map((c, idx) => (
              <ComplaintCard key={c._id} complaint={c} index={idx} />
            ))}
          </>
        ) : (
          <div className="card-glass text-center py-14 text-gray-500">
            <FaClock className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="font-semibold">No complaints found.</p>
            <p className="text-sm mt-1 max-w-xs mx-auto">
              Complaints filed with your registered email or mobile will appear
              here.
            </p>
            <Link
              to="/submit"
              className="inline-block mt-4 text-sm text-blue-600 font-semibold hover:underline"
            >
              File a new complaint â†’
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default TrackComplaint;
