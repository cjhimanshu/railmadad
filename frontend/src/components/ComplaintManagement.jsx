import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  FaFilter,
  FaEdit,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaUser,
  FaStar,
  FaLock,
  FaUnlock,
  FaTools,
  FaPhone,
  FaEnvelope,
  FaTicketAlt,
  FaRobot,
  FaChevronDown,
  FaChevronUp,
  FaBroom,
  FaShieldAlt,
  FaUserTie,
  FaBuilding,
  FaTrain,
  FaUtensils,
  FaHammer,
  FaQuestionCircle,
  FaRedo,
  FaUserMinus,
  FaMoneyBillWave,
} from "react-icons/fa";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "all", label: "All", icon: FaFilter },
  { key: "cleanliness", label: "Cleanliness", icon: FaBroom },
  { key: "safety", label: "Safety", icon: FaShieldAlt },
  { key: "staff_behavior", label: "Staff Behavior", icon: FaUserTie },
  { key: "staff_complaint", label: "Staff Complaint", icon: FaUserMinus },
  { key: "overcharging", label: "Overcharging", icon: FaMoneyBillWave },
  { key: "facilities", label: "Facilities", icon: FaBuilding },
  { key: "ticketing", label: "Ticketing", icon: FaTicketAlt },
  { key: "punctuality", label: "Punctuality", icon: FaTrain },
  { key: "food_quality", label: "Food Quality", icon: FaUtensils },
  { key: "infrastructure", label: "Infrastructure", icon: FaHammer },
  { key: "other", label: "Other", icon: FaQuestionCircle },
];

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  resolved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};
const PRIORITY_STYLES = {
  urgent: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300",
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// ─── Star Rating Display ──────────────────────────────────────────────────────
const StarDisplay = ({ rating }) => {
  if (!rating)
    return <span className="text-gray-400 text-xs italic">No rating yet</span>;
  const color =
    rating >= 4
      ? "text-green-500"
      : rating >= 3
        ? "text-yellow-400"
        : "text-red-500";
  return (
    <span className={`flex items-center gap-0.5 font-semibold ${color}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar key={s} className={s <= rating ? "" : "opacity-20"} />
      ))}
      <span className="ml-1 text-sm">{rating}/5</span>
    </span>
  );
};

// ─── Closure status indicator ─────────────────────────────────────────────────
const ClosureStatus = ({ c }) => {
  if (c.status === "resolved") {
    return (
      <div className="flex items-center gap-1 text-green-700 font-semibold text-sm bg-green-50 rounded-lg px-3 py-1 border border-green-200">
        <FaCheckCircle /> Closed — Dual Verified
      </div>
    );
  }
  if (c.closureBlocked) {
    return (
      <div className="flex items-center gap-1 text-red-700 text-sm bg-red-50 rounded-lg px-3 py-1 border border-red-200">
        <FaLock /> Blocked — Low Rating ({c.satisfactionRating}/5)
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 text-xs">
      <span
        className={`flex items-center gap-1 ${c.authorityMarkedDone ? "text-green-700" : "text-gray-400"}`}
      >
        {c.authorityMarkedDone ? <FaCheckCircle /> : <FaClock />}
        Authority action {c.authorityMarkedDone ? "taken ✓" : "pending"}
      </span>
      <span
        className={`flex items-center gap-1 ${c.customerMarkedDone ? "text-green-700" : "text-gray-400"}`}
      >
        {c.customerMarkedDone ? <FaCheckCircle /> : <FaClock />}
        Customer confirmed {c.customerMarkedDone ? "✓" : "pending"}
      </span>
      {c.satisfactionRating && <StarDisplay rating={c.satisfactionRating} />}
    </div>
  );
};

// ─── Single Complaint Card ────────────────────────────────────────────────────
const ComplaintCard = ({ complaint, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [submittingDone, setSubmittingDone] = useState(false);
  const [closing, setClosing] = useState(false);
  const [editData, setEditData] = useState({
    status: complaint.status,
    assignedDepartment: complaint.assignedDepartment || "unassigned",
    adminNotes: complaint.adminNotes || "",
  });
  const [actionNotes, setActionNotes] = useState("");

  const canClose =
    complaint.authorityMarkedDone &&
    complaint.customerMarkedDone &&
    !complaint.closureBlocked;
  const isResolved = complaint.status === "resolved";
  const pri = complaint.priority;
  const borderColor =
    pri === "urgent"
      ? "border-l-red-500"
      : pri === "high"
        ? "border-l-orange-500"
        : pri === "medium"
          ? "border-l-yellow-500"
          : "border-l-green-500";

  const handleSaveEdit = async (e) => {
    e.stopPropagation();
    setSavingEdit(true);
    try {
      await api.put(`/admin/complaints/${complaint._id}/status`, editData);
      toast.success("Complaint updated");
      setEditing(false);
      onRefresh();
    } catch {
      // api interceptor already shows the toast
    } finally {
      setSavingEdit(false);
    }
  };

  const handleMarkDone = async (e) => {
    e.stopPropagation();
    if (!actionNotes.trim()) {
      toast.error("Please describe the action taken before confirming");
      return;
    }
    setSubmittingDone(true);
    try {
      await api.put(`/admin/complaints/${complaint._id}/mark-done`, {
        actionNotes,
      });
      toast.success("Action confirmed! Awaiting customer confirmation.");
      setMarkingDone(false);
      setActionNotes("");
      onRefresh();
    } catch {
      // api interceptor already shows the toast
    } finally {
      setSubmittingDone(false);
    }
  };

  const handleClose = async (e) => {
    e.stopPropagation();
    const msg = complaint.closureBlocked
      ? "Override: Force-close this complaint? Use only after re-addressing the customer concern."
      : "Confirm closing this complaint?";
    if (!window.confirm(msg)) return;
    setClosing(true);
    try {
      await api.put(`/admin/complaints/${complaint._id}/status`, {
        status: "resolved",
        adminNotes:
          editData.adminNotes || complaint.adminNotes || "Closed by admin",
      });
      toast.success("Complaint closed");
      onRefresh();
    } catch {
      // api interceptor already shows the toast
    } finally {
      setClosing(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor} overflow-hidden`}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-bold text-railway-dark">{complaint.title}</h4>
              {complaint.closureBlocked && (
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-300 rounded-full px-2 py-0.5 animate-pulse">
                  <FaLock className="text-xs" /> Blocked
                </span>
              )}
              {complaint.authorityMarkedDone &&
                !isResolved &&
                !complaint.closureBlocked && (
                  <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                    ⚙ Action Taken
                  </span>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[complaint.status]}`}
              >
                {complaint.status.replace("_", " ").toUpperCase()}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[complaint.priority]}`}
              >
                {complaint.priority?.toUpperCase()}
              </span>
              <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 rounded-full px-2 py-0.5">
                {complaint.category?.replace(/_/g, " ")}
              </span>
              {complaint.pnrNumber && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-mono">
                  🎫 {complaint.pnrNumber}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="hidden md:block text-xs text-gray-400">
              {formatDate(complaint.createdAt)}
            </span>
            {expanded ? (
              <FaChevronUp className="text-gray-400" />
            ) : (
              <FaChevronDown className="text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: description + user */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Description
              </p>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                {complaint.description}
              </p>
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-gray-600">
                  <FaUser className="inline mr-1 text-gray-400" />
                  {complaint.userId?.name}
                </p>
                <p className="text-gray-500 flex items-center gap-1">
                  <FaEnvelope className="text-blue-400 text-xs" />{" "}
                  {complaint.userId?.email}
                </p>
                {complaint.contactMobile && (
                  <p className="text-gray-500 flex items-center gap-1">
                    <FaPhone className="text-green-500 text-xs" />{" "}
                    {complaint.contactMobile}
                  </p>
                )}
                {complaint.contactEmail && (
                  <p className="text-gray-500 flex items-center gap-1">
                    <FaEnvelope className="text-blue-500 text-xs" />{" "}
                    {complaint.contactEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Right: closure status */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Closure Status
              </p>
              <ClosureStatus c={complaint} />

              {complaint.satisfactionRating != null && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    User Satisfaction
                  </p>
                  <StarDisplay rating={complaint.satisfactionRating} />
                  {complaint.satisfactionComment && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      "{complaint.satisfactionComment}"
                    </p>
                  )}
                  {complaint.closureBlocked && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      ⚠ {complaint.closureBlockedReason}
                    </p>
                  )}
                </div>
              )}

              {complaint.authorityActionNotes && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Action Taken
                  </p>
                  <p className="text-xs text-gray-700">
                    {complaint.authorityActionNotes}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(complaint.authorityMarkedAt)}
                  </p>
                </div>
              )}

              {complaint.slaDeadline && (
                <span
                  className={`text-xs px-2 py-1 rounded-full border inline-block ${
                    new Date(complaint.slaDeadline) < new Date()
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-green-100 text-green-700 border-green-200"
                  }`}
                >
                  SLA:{" "}
                  {new Date(complaint.slaDeadline) < new Date()
                    ? "⚠ Overdue"
                    : formatDate(complaint.slaDeadline)}
                </span>
              )}
            </div>
          </div>

          {/* AI info */}
          {complaint.aiSuggestions?.confidence > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100 flex flex-wrap gap-4 text-xs">
              <span>
                <FaRobot className="inline mr-1 text-railway-orange" />
                <b>AI:</b> {complaint.aiSuggestions.suggestedCategory}
              </span>
              <span>
                <b>Priority:</b> {complaint.aiSuggestions.suggestedPriority}
              </span>
              <span>
                <b>Confidence:</b>{" "}
                {(complaint.aiSuggestions.confidence * 100).toFixed(0)}%
              </span>
              <span>
                <b>Sentiment:</b> {complaint.sentiment}
              </span>
              <span>
                <b>Dept:</b> {complaint.assignedDepartment?.replace(/_/g, " ")}
              </span>
            </div>
          )}

          {/* Admin notes */}
          {complaint.adminNotes && !editing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <span className="font-semibold text-yellow-800">
                Admin Notes:{" "}
              </span>
              <span className="text-yellow-700">{complaint.adminNotes}</span>
            </div>
          )}

          {/* Action buttons */}
          {!isResolved && !editing && !markingDone && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
              >
                <FaEdit /> Edit Status / Notes
              </button>
              {!complaint.authorityMarkedDone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMarkingDone(true);
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                >
                  <FaTools /> Mark Action Taken
                </button>
              )}
              {complaint.closureBlocked && (
                <button
                  onClick={handleClose}
                  disabled={closing}
                  className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-60"
                >
                  {closing ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaRedo />
                  )}
                  Re-address &amp; Force Close
                </button>
              )}
              {canClose && (
                <button
                  onClick={handleClose}
                  disabled={closing}
                  className="flex items-center gap-1 px-3 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 transition disabled:opacity-60"
                >
                  {closing ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaUnlock />
                  )}
                  Close Complaint
                </button>
              )}
            </div>
          )}

          {/* Edit form */}
          {editing && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800">
                Update Complaint
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                  className="input-field text-sm py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={editData.assignedDepartment}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      assignedDepartment: e.target.value,
                    })
                  }
                  className="input-field text-sm py-2"
                >
                  <option value="unassigned">Unassigned</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="security">Security</option>
                  <option value="customer_service">Customer Service</option>
                  <option value="catering">Catering</option>
                  <option value="operations">Operations</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
              <textarea
                value={editData.adminNotes}
                onChange={(e) =>
                  setEditData({ ...editData, adminNotes: e.target.value })
                }
                className="input-field text-sm w-full"
                rows="2"
                placeholder="Admin notes (optional)..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingEdit ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaSave />
                  )}
                  {savingEdit ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(false);
                  }}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Mark done form */}
          {markingDone && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-green-800">
                <FaTools className="inline mr-2" /> Describe the Action Taken
              </p>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="input-field text-sm w-full"
                rows="3"
                autoFocus
                placeholder="e.g. Cleaning crew dispatched to coach B4, staff counselled, ticket refund processed..."
              />
              <p className="text-xs text-green-700 bg-green-100 rounded-lg p-2">
                ⚠ After this, the customer will be asked to confirm resolution
                and rate satisfaction. The complaint <b>will not close</b>{" "}
                unless the customer also confirms. If the customer gives a
                rating below 3, the complaint will be{" "}
                <b>automatically re-opened</b>.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleMarkDone}
                  disabled={submittingDone}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60 font-semibold"
                >
                  {submittingDone ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> Confirm Action Taken
                    </>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMarkingDone(false);
                    setActionNotes("");
                  }}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Activity log */}
          {complaint.automationLog?.length > 0 && (
            <details>
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Activity Log ({complaint.automationLog.length} entries)
              </summary>
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pl-2">
                {complaint.automationLog
                  .slice()
                  .reverse()
                  .map((log, i) => (
                    <div key={i} className="text-xs text-gray-500 flex gap-2">
                      <span className="text-gray-300 shrink-0">
                        {formatDate(log.performedAt)}
                      </span>
                      <span className="font-medium shrink-0">
                        {log.action}:
                      </span>
                      <span>{log.details}</span>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────
const ComplaintManagement = ({ onUpdate, initialFilter }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [filters, setFilters] = useState({
    status: initialFilter?.status || "",
    priority: initialFilter?.priority || "",
    search: "",
  });

  const fetchComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.append("category", activeCategory);
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);
      const res = await api.get(`/admin/complaints?${params.toString()}`);
      setComplaints(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, filters.status, filters.priority]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Apply filter when parent passes a new initialFilter (e.g. clicking a stat card)
  useEffect(() => {
    if (initialFilter && Object.keys(initialFilter).length > 0) {
      setFilters((f) => ({ ...f, ...initialFilter }));
    }
  }, [initialFilter]);

  const handleRefresh = () => {
    fetchComplaints();
    if (onUpdate) onUpdate();
  };

  // Client-side text search
  const filtered = complaints.filter((c) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.userId?.name?.toLowerCase().includes(q) ||
      c.pnrNumber?.includes(q) ||
      c.contactMobile?.includes(q)
    );
  });

  const categoryCounts = {};
  complaints.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const stats = {
    total: filtered.length,
    pending: filtered.filter((c) => c.status === "pending").length,
    blocked: filtered.filter((c) => c.closureBlocked).length,
    awaiting: filtered.filter(
      (c) =>
        c.authorityMarkedDone &&
        !c.customerMarkedDone &&
        c.status !== "resolved",
    ).length,
    resolved: filtered.filter((c) => c.status === "resolved").length,
  };

  const blocked = filtered.filter((c) => c.closureBlocked);
  const awaiting = filtered.filter(
    (c) =>
      c.authorityMarkedDone &&
      !c.customerMarkedDone &&
      !c.closureBlocked &&
      c.status !== "resolved",
  );
  const rest = filtered.filter(
    (c) =>
      !c.closureBlocked &&
      !(
        c.authorityMarkedDone &&
        !c.customerMarkedDone &&
        c.status !== "resolved"
      ),
  );

  return (
    <div className="space-y-5">
      {/* Category tabs */}
      {/* Category tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count =
            cat.key === "all"
              ? complaints.length
              : categoryCounts[cat.key] || 0;
          const active = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-xl border-2 font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                active
                  ? "bg-railway-blue text-white border-railway-blue shadow-lg scale-105"
                  : "bg-white text-gray-700 border-gray-200 hover:border-railway-blue hover:text-railway-blue"
              }`}
            >
              <Icon
                className={`text-2xl ${active ? "text-white" : "text-railway-blue"}`}
              />
              <span className="text-xs font-extrabold text-center leading-tight">
                {cat.label}
              </span>
              <span
                className={`text-sm font-black px-2 py-0.5 rounded-full min-w-[28px] text-center ${
                  active
                    ? "bg-white text-railway-blue"
                    : "bg-blue-50 text-railway-blue"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="🔍  Search title, user, PNR, mobile..."
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          className="input-field flex-1 min-w-48 text-sm py-2"
        />
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
          className="input-field text-sm py-2"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) =>
            setFilters((f) => ({ ...f, priority: e.target.value }))
          }
          className="input-field text-sm py-2"
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-railway-blue text-white rounded-lg text-sm hover:opacity-90"
        >
          Refresh
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FaFilter className="text-4xl mx-auto mb-2" />
          <p>No complaints match the current filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocked.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-600 uppercase mb-2 flex items-center gap-1">
                <FaLock /> Blocked — Needs Re-attention ({blocked.length})
              </p>
              <div className="space-y-3">
                {blocked.map((c) => (
                  <ComplaintCard
                    key={c._id}
                    complaint={c}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            </div>
          )}
          {awaiting.length > 0 && (
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase mb-2 flex items-center gap-1">
                <FaUser /> Awaiting Customer Confirmation ({awaiting.length})
              </p>
              <div className="space-y-3">
                {awaiting.map((c) => (
                  <ComplaintCard
                    key={c._id}
                    complaint={c}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div className="space-y-3">
              {rest.map((c) => (
                <ComplaintCard
                  key={c._id}
                  complaint={c}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintManagement;
