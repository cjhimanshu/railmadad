import { useState, useEffect } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  FaClock,
  FaImage,
  FaChevronDown,
  FaChevronUp,
  FaBroom,
  FaShieldAlt,
  FaUserTie,
  FaBuilding,
  FaTicketAlt,
  FaTrain,
  FaUtensils,
  FaHammer,
  FaQuestionCircle,
  FaRobot,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaMeh,
  FaSmile,
  FaFrown,
  FaBuilding as FaDept,
  FaBolt,
  FaHistory,
  FaCalendarAlt,
  FaArrowUp,
  FaStar,
  FaLock,
  FaThumbsUp,
} from "react-icons/fa";

const categoryConfig = {
  cleanliness: {
    icon: FaBroom,
    color: "bg-teal-100 text-teal-700 border-teal-300",
    border: "border-l-teal-400",
    label: "Cleanliness",
  },
  safety: {
    icon: FaShieldAlt,
    color: "bg-red-100 text-red-700 border-red-300",
    border: "border-l-red-500",
    label: "Safety",
  },
  staff_behavior: {
    icon: FaUserTie,
    color: "bg-blue-100 text-blue-700 border-blue-300",
    border: "border-l-blue-400",
    label: "Staff Behavior",
  },
  facilities: {
    icon: FaBuilding,
    color: "bg-indigo-100 text-indigo-700 border-indigo-300",
    border: "border-l-indigo-400",
    label: "Facilities",
  },
  ticketing: {
    icon: FaTicketAlt,
    color: "bg-orange-100 text-orange-700 border-orange-300",
    border: "border-l-orange-400",
    label: "Ticketing",
  },
  punctuality: {
    icon: FaTrain,
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    border: "border-l-yellow-400",
    label: "Punctuality",
  },
  food_quality: {
    icon: FaUtensils,
    color: "bg-pink-100 text-pink-700 border-pink-300",
    border: "border-l-pink-400",
    label: "Food Quality",
  },
  infrastructure: {
    icon: FaHammer,
    color: "bg-gray-100 text-gray-700 border-gray-300",
    border: "border-l-gray-400",
    label: "Infrastructure",
  },
  other: {
    icon: FaQuestionCircle,
    color: "bg-purple-100 text-purple-700 border-purple-300",
    border: "border-l-purple-400",
    label: "Other",
  },
};

const priorityConfig = {
  urgent: {
    color: "bg-red-100 text-red-800 border border-red-300",
    dot: "bg-red-500",
    label: "🔴 Urgent",
  },
  high: {
    color: "bg-orange-100 text-orange-800 border border-orange-300",
    dot: "bg-orange-500",
    label: "🟠 High",
  },
  medium: {
    color: "bg-blue-100 text-blue-800 border border-blue-300",
    dot: "bg-blue-500",
    label: "🔵 Medium",
  },
  low: {
    color: "bg-gray-100 text-gray-800 border border-gray-300",
    dot: "bg-gray-400",
    label: "⚪ Low",
  },
};

const statusConfig = {
  pending: {
    icon: FaHourglassHalf,
    color: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    label: "Pending",
  },
  in_progress: {
    icon: FaExclamationTriangle,
    color: "bg-blue-100 text-blue-800 border border-blue-300",
    label: "In Progress",
  },
  resolved: {
    icon: FaCheckCircle,
    color: "bg-green-100 text-green-800 border border-green-300",
    label: "Resolved",
  },
  rejected: {
    icon: FaTimesCircle,
    color: "bg-red-100 text-red-800 border border-red-300",
    label: "Rejected",
  },
};

const sentimentConfig = {
  positive: {
    icon: FaSmile,
    color: "bg-green-100 text-green-700",
    label: "😊 Positive",
  },
  neutral: {
    icon: FaMeh,
    color: "bg-gray-100 text-gray-700",
    label: "😐 Neutral",
  },
  negative: {
    icon: FaFrown,
    color: "bg-red-100 text-red-700",
    label: "😠 Negative",
  },
};

const ComplaintList = ({ complaints, onUpdate, quickFilterStatus }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState(quickFilterStatus || "all");
  // satisfaction state: { [complaintId]: { rating: 0, comment: '', submitting: false } }
  const [satState, setSatState] = useState({});

  const getSat = (id) =>
    satState[id] || { rating: 0, comment: "", submitting: false };
  const setSat = (id, patch) =>
    setSatState((prev) => ({ ...prev, [id]: { ...getSat(id), ...patch } }));

  const handleSubmitRating = async (cId) => {
    const { rating, comment } = getSat(cId);
    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }
    setSat(cId, { submitting: true });
    try {
      await api.put(`/complaints/${cId}/satisfaction`, { rating, comment });
      toast.success(
        rating < 3
          ? "Rating submitted. Complaint re-opened for further action."
          : "Thank you for your feedback!",
      );
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setSat(cId, { submitting: false });
    }
  };

  const handleConfirmResolved = async (cId) => {
    try {
      await api.put(`/complaints/${cId}/confirm-resolved`);
      toast.success("Complaint closed. Thank you!");
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const filtered = complaints.filter(
    (c) =>
      (filterCategory === "all" || c.category === filterCategory) &&
      (filterPriority === "all" || c.priority === filterPriority) &&
      (filterStatus === "all" || c.status === filterStatus),
  );

  // Sync when parent dashboard card changes the quick filter
  useEffect(() => {
    setFilterStatus(quickFilterStatus || "all");
  }, [quickFilterStatus]);

  const uniqueCategories = [...new Set(complaints.map((c) => c.category))];

  if (complaints.length === 0) {
    return (
      <div className="card text-center py-16">
        <FaTrain className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">No complaints yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Submit your first complaint to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-railway-dark">
          My Complaints
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({filtered.length} of {complaints.length})
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-railway-blue"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {categoryConfig[cat]?.label || cat}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-railway-blue"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">⚪ Low</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-railway-blue"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-8 text-gray-400">
          No complaints match the selected filters.
        </div>
      )}

      {filtered.map((complaint) => {
        const cat = categoryConfig[complaint.category] || categoryConfig.other;
        const pri = priorityConfig[complaint.priority] || priorityConfig.medium;
        const sta = statusConfig[complaint.status] || statusConfig.pending;
        const sen =
          sentimentConfig[complaint.sentiment] || sentimentConfig.neutral;
        const CatIcon = cat.icon;
        const StaIcon = sta.icon;
        const isExpanded = expandedId === complaint._id;
        const confidence = complaint.aiSuggestions?.confidence;

        return (
          <div
            key={complaint._id}
            className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 ${cat.border} overflow-hidden`}
          >
            {/* Card Header */}
            <div
              className="p-5 cursor-pointer"
              onClick={() => toggleExpand(complaint._id)}
            >
              <div className="flex justify-between items-start gap-4">
                {/* Category Icon */}
                <div
                  className={`p-3 rounded-xl border ${cat.color} flex-shrink-0`}
                >
                  <CatIcon className="text-xl" />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-railway-dark truncate mb-2">
                    {complaint.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {/* Status */}
                    <span
                      className={`badge ${sta.color} flex items-center gap-1`}
                    >
                      <StaIcon className="text-xs" />
                      {sta.label}
                    </span>
                    {/* Priority */}
                    <span
                      className={`badge ${pri.color} flex items-center gap-1`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${pri.dot}`}
                      ></span>
                      {pri.label}
                    </span>
                    {/* Category */}
                    <span
                      className={`badge border ${cat.color} flex items-center gap-1`}
                    >
                      <CatIcon className="text-xs" />
                      {cat.label}
                    </span>
                    {/* Sentiment */}
                    <span className={`badge ${sen.color}`}>{sen.label}</span>
                    {/* Closure status badge */}
                    {complaint.status === "resolved" && (
                      <span className="badge bg-green-100 text-green-800 border border-green-400 flex items-center gap-1 font-bold">
                        <FaCheckCircle className="text-xs" /> Closed
                      </span>
                    )}
                    {complaint.status !== "resolved" &&
                      complaint.authorityMarkedDone &&
                      !complaint.satisfactionRating && (
                        <span
                          className="badge bg-orange-100 text-orange-800 border border-orange-400 font-bold"
                          style={{ animation: "pulse 2s infinite" }}
                        >
                          ⭐ Rate &amp; Close — Action Needed
                        </span>
                      )}
                    {complaint.status !== "resolved" &&
                      complaint.authorityMarkedDone &&
                      complaint.satisfactionRating >= 3 &&
                      !complaint.customerMarkedDone && (
                        <span className="badge bg-teal-100 text-teal-800 border border-teal-400 font-bold flex items-center gap-1">
                          <FaCheckCircle className="text-xs" /> Confirm to Close
                        </span>
                      )}
                    {complaint.closureBlocked && (
                      <span className="badge bg-red-100 text-red-800 border border-red-400 font-bold flex items-center gap-1">
                        <FaLock className="text-xs" /> Re-opened
                      </span>
                    )}
                    {/* PNR */}
                    {complaint.pnrNumber && (
                      <span className="badge bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 font-mono">
                        🎫 PNR: {complaint.pnrNumber}
                      </span>
                    )}
                    {/* Mobile */}
                    {complaint.contactMobile && (
                      <span className="badge bg-green-50 text-green-800 border border-green-300 flex items-center gap-1">
                        📱 {complaint.contactMobile}
                      </span>
                    )}
                    {/* Email */}
                    {complaint.contactEmail && (
                      <span className="badge bg-blue-50 text-blue-800 border border-blue-300 flex items-center gap-1">
                        ✉ {complaint.contactEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date + Expand */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button className="text-railway-blue hover:text-railway-orange transition-colors text-lg">
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <FaClock className="text-xs" />
                    {formatDate(complaint.createdAt)}
                  </span>
                </div>
              </div>

              {/* AI Confidence Bar */}
              {confidence > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <FaRobot className="text-xs text-blue-400" />
                  <span className="text-xs text-gray-400">AI Confidence</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-32">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.round(confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-blue-600">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4 animate-slide-up">
                {/* Description */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Description
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                    {complaint.description}
                  </p>
                </div>

                {/* AI Analysis Card */}
                {complaint.aiSuggestions && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-blue-500 text-white p-1.5 rounded-lg">
                        <FaRobot className="text-sm" />
                      </div>
                      <h4 className="font-bold text-blue-800">AI Analysis</h4>
                      {confidence > 0 && (
                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                          {Math.round(confidence * 100)}% confident
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <div className="bg-white rounded-lg p-3 border border-blue-100 text-center">
                        <p className="text-xs text-gray-400 mb-1">Category</p>
                        <p className="font-bold text-sm text-blue-700 capitalize">
                          {(
                            complaint.aiSuggestions.suggestedCategory || ""
                          ).replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-100 text-center">
                        <p className="text-xs text-gray-400 mb-1">Priority</p>
                        <p className="font-bold text-sm text-orange-600 capitalize">
                          {complaint.aiSuggestions.suggestedPriority}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-100 text-center col-span-2 md:col-span-1">
                        <p className="text-xs text-gray-400 mb-1">Sentiment</p>
                        <p className="font-bold text-sm capitalize">
                          {sen.label}
                        </p>
                      </div>
                    </div>
                    {complaint.aiSuggestions.suggestedResponse && (
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                          Suggested Response
                        </p>
                        <p className="text-gray-600 text-sm italic leading-relaxed">
                          "{complaint.aiSuggestions.suggestedResponse}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Attached Image */}
                {complaint.imageURL && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <FaImage /> Attached Image
                    </h4>
                    <img
                      src={complaint.imageURL}
                      alt="Complaint"
                      className="max-w-full h-auto rounded-lg shadow max-h-64"
                    />
                  </div>
                )}

                {/* Admin Notes */}
                {complaint.adminNotes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-1 text-sm">
                      📋 Admin Notes
                    </h4>
                    <p className="text-gray-700 text-sm">
                      {complaint.adminNotes}
                    </p>
                  </div>
                )}

                {/* Department + SLA + Resolved */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <FaBolt className="text-yellow-500" /> Assignment & SLA
                  </h4>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {complaint.assignedDepartment &&
                      complaint.assignedDepartment !== "unassigned" && (
                        <span className="flex items-center gap-1 badge bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <FaDept className="text-xs" />
                          {complaint.assignedDepartment.replace(/_/g, " ")}
                        </span>
                      )}
                    {complaint.slaDeadline && (
                      <span
                        className={`flex items-center gap-1 badge border ${
                          new Date(complaint.slaDeadline) < new Date()
                            ? "bg-red-100 text-red-700 border-red-300"
                            : "bg-green-100 text-green-700 border-green-300"
                        }`}
                      >
                        <FaCalendarAlt className="text-xs" />
                        SLA:{" "}
                        {new Date(complaint.slaDeadline) < new Date()
                          ? "⚠ Overdue"
                          : formatDate(complaint.slaDeadline)}
                      </span>
                    )}
                    {complaint.escalatedAt && (
                      <span className="flex items-center gap-1 badge bg-red-100 text-red-700 border border-red-300">
                        <FaArrowUp className="text-xs" /> Escalated
                      </span>
                    )}
                    {complaint.resolvedAt && (
                      <span className="text-green-600 flex items-center gap-1 badge bg-green-100 border border-green-300">
                        <FaCheckCircle /> Resolved{" "}
                        {formatDate(complaint.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── User Satisfaction & Confirm Resolution ── */}
                {complaint.authorityMarkedDone &&
                  complaint.status !== "resolved" && (
                    <div
                      className={`rounded-xl p-4 border-2 ${
                        complaint.closureBlocked
                          ? "bg-red-50 border-red-300"
                          : "bg-indigo-50 border-indigo-300"
                      }`}
                    >
                      {complaint.closureBlocked ? (
                        <div className="flex items-start gap-3">
                          <FaLock className="text-red-500 text-xl mt-0.5" />
                          <div>
                            <p className="font-bold text-red-700 text-sm">
                              Complaint Re-opened
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              {complaint.closureBlockedReason}
                            </p>
                            <p className="text-xs text-red-500 mt-1">
                              The authority has been notified to re-address your
                              issue.
                            </p>
                          </div>
                        </div>
                      ) : complaint.customerMarkedDone &&
                        complaint.satisfactionRating ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <FaCheckCircle className="text-xl" />
                          <span className="font-semibold text-sm">
                            You confirmed resolution. Rating:{" "}
                            {complaint.satisfactionRating}/5
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <FaThumbsUp className="text-indigo-600 text-lg" />
                            <div>
                              <p className="font-bold text-indigo-800 text-sm">
                                Authority has taken action!
                              </p>
                              <p className="text-xs text-indigo-600">
                                Action taken:{" "}
                                {complaint.authorityActionNotes ||
                                  "See details above"}
                              </p>
                            </div>
                          </div>

                          {/* Star rating */}
                          {!complaint.satisfactionRating && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                Rate your satisfaction (required to close):
                              </p>
                              <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() =>
                                      setSat(complaint._id, { rating: s })
                                    }
                                    className={`text-2xl transition-transform hover:scale-110 ${
                                      getSat(complaint._id).rating >= s
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    <FaStar />
                                  </button>
                                ))}
                                {getSat(complaint._id).rating > 0 && (
                                  <span className="ml-2 text-sm font-semibold self-center text-gray-600">
                                    {
                                      [
                                        "",
                                        "Very Dissatisfied",
                                        "Dissatisfied",
                                        "Neutral",
                                        "Satisfied",
                                        "Very Satisfied",
                                      ][getSat(complaint._id).rating]
                                    }
                                  </span>
                                )}
                              </div>
                              <textarea
                                placeholder="Optional comment about the resolution..."
                                value={getSat(complaint._id).comment}
                                onChange={(e) =>
                                  setSat(complaint._id, {
                                    comment: e.target.value,
                                  })
                                }
                                className="input-field text-sm w-full"
                                rows="2"
                              />
                              {getSat(complaint._id).rating < 3 &&
                                getSat(complaint._id).rating > 0 && (
                                  <p className="text-xs text-red-600 mt-1">
                                    ⚠ Rating below 3 will reopen the complaint
                                    for further action.
                                  </p>
                                )}
                              <button
                                onClick={() =>
                                  handleSubmitRating(complaint._id)
                                }
                                disabled={getSat(complaint._id).submitting}
                                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-60"
                              >
                                {getSat(complaint._id).submitting
                                  ? "Submitting..."
                                  : "Submit Rating"}
                              </button>
                            </div>
                          )}

                          {/* Confirm close button (only if rated >= 3) */}
                          {complaint.satisfactionRating >= 3 &&
                            !complaint.customerMarkedDone && (
                              <div className="pt-2 border-t border-indigo-200">
                                <p className="text-xs text-green-700 mb-2">
                                  You rated {complaint.satisfactionRating}/5.
                                  You can now confirm closure.
                                </p>
                                <button
                                  onClick={() =>
                                    handleConfirmResolved(complaint._id)
                                  }
                                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                                >
                                  <FaCheckCircle /> Confirm — Issue Resolved
                                </button>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}

                {/* Automation Log */}
                {complaint.automationLog?.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <FaHistory className="text-slate-500" /> Automation Log
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {complaint.automationLog.map((log, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 text-xs"
                        >
                          <span
                            className={`flex-shrink-0 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                              log.action === "AUTO_RESOLVED"
                                ? "bg-green-100 text-green-700"
                                : log.action === "AUTO_ESCALATED"
                                  ? "bg-red-100 text-red-700"
                                  : log.action === "AUTO_REJECTED"
                                    ? "bg-gray-100 text-gray-600"
                                    : log.action === "AUTO_IN_PROGRESS"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {log.action?.replace(/_/g, " ")}
                          </span>
                          <div className="flex-1">
                            <p className="text-gray-600">{log.details}</p>
                            <p className="text-gray-400 mt-0.5">
                              {formatDate(log.performedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ComplaintList;
