import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaEdit,
  FaEnvelope,
  FaFilter,
  FaPhone,
  FaRedo,
  FaSave,
  FaSearch,
  FaTimes,
  FaTools,
  FaUser,
} from "react-icons/fa";

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "cleanliness", label: "Cleanliness" },
  { value: "safety", label: "Safety" },
  { value: "staff_behavior", label: "Staff behavior" },
  { value: "staff_complaint", label: "Staff complaint" },
  { value: "overcharging", label: "Overcharging" },
  { value: "facilities", label: "Facilities" },
  { value: "ticketing", label: "Ticketing" },
  { value: "punctuality", label: "Punctuality" },
  { value: "food_quality", label: "Food quality" },
  { value: "infrastructure", label: "Infrastructure" },
  {
    value: "seat_occupied_by_other",
    label: "Seat occupied by other passenger",
  },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All priority" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

const PRIORITY_STYLES = {
  urgent: "bg-rose-50 text-rose-700 border-rose-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-sky-50 text-sky-700 border-sky-200",
  low: "bg-slate-50 text-slate-700 border-slate-200",
};

const PRIORITY_CARD_STYLES = {
  urgent: {
    shell: "from-rose-50 via-white to-orange-50 border-rose-200",
    strip: "from-rose-500 via-orange-500 to-amber-400",
    shadow: "shadow-rose-100",
  },
  high: {
    shell: "from-orange-50 via-white to-amber-50 border-orange-200",
    strip: "from-orange-500 via-amber-500 to-yellow-400",
    shadow: "shadow-orange-100",
  },
  medium: {
    shell: "from-sky-50 via-white to-indigo-50 border-sky-200",
    strip: "from-sky-500 via-blue-500 to-indigo-500",
    shadow: "shadow-blue-100",
  },
  low: {
    shell: "from-emerald-50 via-white to-teal-50 border-emerald-200",
    strip: "from-emerald-500 via-teal-500 to-cyan-500",
    shadow: "shadow-emerald-100",
  },
};

const TRACKING_LABELS = {
  registered: "Registered",
  sent_to_authority: "Sent to authority",
  authority_taken_action: "Action taken",
  resolved: "Resolved",
};

const HISTORY_STYLES = {
  record: {
    line: "bg-blue-500",
    shell: "border-blue-200 bg-blue-50/70",
    label: "text-blue-800",
  },
  tracking: {
    line: "bg-orange-500",
    shell: "border-orange-200 bg-orange-50/70",
    label: "text-orange-800",
  },
  system: {
    line: "bg-emerald-500",
    shell: "border-emerald-200 bg-emerald-50/70",
    label: "text-emerald-800",
  },
};

const TONE_STYLES = {
  blue: "border-blue-200 bg-gradient-to-br from-blue-50 to-white",
  amber: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
  slate: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
  emerald: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
  rose: "border-rose-200 bg-gradient-to-br from-rose-50 to-white",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

const humanize = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const RecordPill = ({ value, type = "status" }) => {
  const styles = type === "priority" ? PRIORITY_STYLES : STATUS_STYLES;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[value] || "bg-slate-50 text-slate-700 border-slate-200"}`}
    >
      {humanize(value)}
    </span>
  );
};

const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex items-start justify-between gap-3 py-2 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`text-right text-slate-800 ${mono ? "font-mono text-xs sm:text-sm" : ""}`}>
      {value || "-"}
    </span>
  </div>
);

const SectionCard = ({ title, children, tone = "slate" }) => (
  <div className={`rounded-2xl border p-4 shadow-sm ${TONE_STYLES[tone]}`}>
    <h4 className="mb-3 text-sm font-semibold text-slate-800">{title}</h4>
    {children}
  </div>
);

const ComplaintHistory = ({ complaint }) => {
  const recordEntries = [
    {
      time: complaint.createdAt,
      label: "Complaint created",
      detail: complaint.complaintNumber
        ? `Record opened for ${complaint.complaintNumber}.`
        : "Complaint record created.",
      type: "record",
    },
    ...(complaint.trackingHistory || []).map((entry) => ({
      time: entry.updatedAt,
      label: TRACKING_LABELS[entry.stage] || humanize(entry.stage),
      detail: entry.note || "Tracking status updated.",
      type: "tracking",
    })),
    ...(complaint.automationLog || []).map((entry) => ({
      time: entry.performedAt,
      label: humanize(entry.action),
      detail: entry.details || "System activity recorded.",
      type: "system",
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  if (recordEntries.length === 0) {
    return (
      <SectionCard title="Record History" tone="slate">
        <p className="text-sm text-slate-500">No history available yet.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Record History" tone="slate">
      <div className="space-y-3">
        {recordEntries.map((entry, index) => {
          const style = HISTORY_STYLES[entry.type] || HISTORY_STYLES.system;

          return (
            <div key={`${entry.label}-${entry.time}-${index}`} className="flex gap-3">
              <div className="flex w-4 justify-center">
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${style.line}`} />
              </div>
              <div className={`flex-1 rounded-xl border p-3 ${style.shell}`}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${style.label}`}>{entry.label}</span>
                  <span className="text-xs text-slate-400">{formatDate(entry.time)}</span>
                </div>
                <p className="text-sm text-slate-600">{entry.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

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
    complaint.authorityMarkedDone && complaint.customerMarkedDone && !complaint.closureBlocked;
  const isResolved = complaint.status === "resolved";
  const contactName = complaint.userId?.name || "Guest passenger";
  const contactEmail = complaint.contactEmail || complaint.userId?.email || "-";
  const contactPhone = complaint.contactMobile || complaint.userId?.phone || "-";
  const style = PRIORITY_CARD_STYLES[complaint.priority] || PRIORITY_CARD_STYLES.medium;

  const handleSaveEdit = async (event) => {
    event.stopPropagation();
    setSavingEdit(true);

    try {
      await api.put(`/admin/complaints/${complaint._id}/status`, editData);
      toast.success("Complaint record updated.");
      setEditing(false);
      onRefresh();
    } finally {
      setSavingEdit(false);
    }
  };

  const handleMarkDone = async (event) => {
    event.stopPropagation();

    if (!actionNotes.trim()) {
      toast.error("Please add the action taken before saving.");
      return;
    }

    setSubmittingDone(true);

    try {
      await api.put(`/admin/complaints/${complaint._id}/mark-done`, {
        actionNotes,
      });
      toast.success("Action taken has been recorded.");
      setMarkingDone(false);
      setActionNotes("");
      onRefresh();
    } finally {
      setSubmittingDone(false);
    }
  };

  const handleClose = async (event) => {
    event.stopPropagation();

    const message = complaint.closureBlocked
      ? "Force close this complaint after re-addressing the user concern?"
      : "Close this complaint record?";

    if (!window.confirm(message)) {
      return;
    }

    setClosing(true);

    try {
      await api.put(`/admin/complaints/${complaint._id}/status`, {
        status: "resolved",
        adminNotes: editData.adminNotes || complaint.adminNotes || "Closed by admin",
      });
      toast.success("Complaint closed.");
      onRefresh();
    } finally {
      setClosing(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br shadow-lg ${style.shell} ${style.shadow}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${style.strip}`} />
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start justify-between gap-4 p-5 pt-6 text-left hover:bg-white/40"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/80 px-2.5 py-1 font-mono text-[11px] text-slate-600 shadow-sm">
              {complaint.complaintNumber || complaint._id}
            </span>
            <RecordPill value={complaint.status} />
            <RecordPill value={complaint.priority} type="priority" />
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              {humanize(complaint.category)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600">
              {TRACKING_LABELS[complaint.trackingStatus] || "Registered"}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-slate-900">{complaint.title}</h3>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <FaUser className="text-xs text-railway-orange" />
              {contactName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FaEnvelope className="text-xs text-blue-500" />
              {contactEmail}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FaPhone className="text-xs text-emerald-500" />
              {contactPhone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FaClock className="text-xs text-slate-400" />
              {formatDate(complaint.createdAt)}
            </span>
          </div>
        </div>

        <span className="rounded-full bg-white/80 p-2 text-slate-500 shadow-sm">
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-white/80 bg-white/70 p-5 backdrop-blur-sm">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Complaint Record" tone="blue">
              <div className="divide-y divide-blue-100">
                <InfoRow label="Complaint number" value={complaint.complaintNumber} mono={true} />
                <InfoRow label="Tracking ID" value={complaint.trackingUserId} mono={true} />
                <InfoRow label="PNR number" value={complaint.pnrNumber} />
                <InfoRow label="Train number" value={complaint.trainNumber} />
                <InfoRow
                  label="Assigned department"
                  value={humanize(complaint.assignedDepartment)}
                />
                <InfoRow label="Tracking stage" value={TRACKING_LABELS[complaint.trackingStatus]} />
                <InfoRow label="Created" value={formatDate(complaint.createdAt)} />
                <InfoRow label="Resolved" value={formatDate(complaint.resolvedAt)} />
              </div>
            </SectionCard>

            <SectionCard title="Passenger Record" tone="amber">
              <div className="divide-y divide-amber-100">
                <InfoRow label="Passenger" value={contactName} />
                <InfoRow label="Email" value={contactEmail} />
                <InfoRow label="Mobile" value={contactPhone} />
                <InfoRow
                  label="Authority action"
                  value={complaint.authorityMarkedDone ? "Recorded" : "Pending"}
                />
                <InfoRow
                  label="Customer confirmation"
                  value={complaint.customerMarkedDone ? "Recorded" : "Pending"}
                />
                <InfoRow
                  label="Satisfaction"
                  value={
                    complaint.satisfactionRating
                      ? `${complaint.satisfactionRating}/5`
                      : "Not submitted"
                  }
                />
              </div>
            </SectionCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
            <SectionCard title="Complaint Details" tone="slate">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {complaint.description || "No additional description provided."}
              </p>

              {complaint.authorityActionNotes ? (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <strong>Latest authority note:</strong> {complaint.authorityActionNotes}
                </div>
              ) : null}

              {complaint.adminNotes && !editing ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <strong>Admin notes:</strong> {complaint.adminNotes}
                </div>
              ) : null}

              {complaint.closureBlocked ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <strong>Re-opened:</strong>{" "}
                  {complaint.closureBlockedReason || "Low satisfaction rating."}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Current Status" tone="emerald">
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <p className="mb-1 text-slate-500">Complaint status</p>
                  <RecordPill value={complaint.status} />
                </div>
                <div>
                  <p className="mb-1 text-slate-500">Priority</p>
                  <RecordPill value={complaint.priority} type="priority" />
                </div>
                <div>
                  <p className="mb-1 text-slate-500">Closure</p>
                  <p>
                    {isResolved
                      ? "Closed"
                      : complaint.closureBlocked
                        ? "Blocked and reopened"
                        : canClose
                          ? "Ready to close"
                          : "Still in progress"}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          {!isResolved && !editing && !markingDone ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditing(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-railway-blue to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-100 hover:opacity-95"
              >
                <FaEdit />
                Edit record
              </button>

              {!complaint.authorityMarkedDone ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMarkingDone(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  <FaTools />
                  Record action taken
                </button>
              ) : null}

              {(canClose || complaint.closureBlocked) && (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={closing}
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
                >
                  {complaint.closureBlocked ? <FaRedo /> : <FaCheckCircle />}
                  {closing
                    ? "Saving..."
                    : complaint.closureBlocked
                      ? "Force close"
                      : "Close complaint"}
                </button>
              )}
            </div>
          ) : null}

          {editing ? (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
              <h4 className="mb-3 text-sm font-semibold text-blue-800">Update Complaint Record</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={editData.status}
                  onChange={(event) =>
                    setEditData((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className="input-field py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={editData.assignedDepartment}
                  onChange={(event) =>
                    setEditData((current) => ({
                      ...current,
                      assignedDepartment: event.target.value,
                    }))
                  }
                  className="input-field py-2 text-sm"
                >
                  <option value="unassigned">Unassigned</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="security">Security</option>
                  <option value="customer_service">Customer service</option>
                  <option value="catering">Catering</option>
                  <option value="operations">Operations</option>
                  <option value="technical">Technical</option>
                </select>
              </div>

              <textarea
                rows="3"
                value={editData.adminNotes}
                onChange={(event) =>
                  setEditData((current) => ({
                    ...current,
                    adminNotes: event.target.value,
                  }))
                }
                className="input-field mt-3 text-sm"
                placeholder="Add or update admin notes"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-railway-blue to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-100 hover:opacity-95 disabled:opacity-60"
                >
                  <FaSave />
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditing(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FaTimes />
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {markingDone ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
              <h4 className="mb-3 text-sm font-semibold text-emerald-800">Record Action Taken</h4>
              <textarea
                rows="3"
                value={actionNotes}
                onChange={(event) => setActionNotes(event.target.value)}
                className="input-field text-sm"
                placeholder="Describe what the authority did for this complaint"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleMarkDone}
                  disabled={submittingDone}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-100 hover:opacity-95 disabled:opacity-60"
                >
                  <FaCheckCircle />
                  {submittingDone ? "Saving..." : "Save action"}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMarkingDone(false);
                    setActionNotes("");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <FaTimes />
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <ComplaintHistory complaint={complaint} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

const ComplaintManagement = ({ onUpdate, initialFilter }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: initialFilter?.category || "",
    status: initialFilter?.status || "",
    priority: initialFilter?.priority || "",
  });

  const fetchComplaints = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters.category) {
        params.append("category", filters.category);
      }
      if (filters.status) {
        params.append("status", filters.status);
      }
      if (filters.priority) {
        params.append("priority", filters.priority);
      }

      const query = params.toString();
      const response = await api.get(`/admin/complaints${query ? `?${query}` : ""}`);
      setComplaints(response.data.data || []);
    } catch (error) {
      console.error("Failed to load complaints", error);
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.priority, filters.status]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      category: initialFilter?.category || "",
      status: initialFilter?.status || "",
      priority: initialFilter?.priority || "",
    }));
  }, [initialFilter]);

  const handleRefresh = () => {
    fetchComplaints();
    if (onUpdate) {
      onUpdate();
    }
  };

  const searchQuery = filters.search.trim().toLowerCase();
  const filteredComplaints = complaints.filter((complaint) => {
    if (!searchQuery) {
      return true;
    }

    return [
      complaint.title,
      complaint.description,
      complaint.userId?.name,
      complaint.userId?.email,
      complaint.contactEmail,
      complaint.contactMobile,
      complaint.pnrNumber,
      complaint.complaintNumber,
      complaint.trackingUserId,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(searchQuery)
    );
  });

  const summary = {
    total: filteredComplaints.length,
    pending: filteredComplaints.filter((item) => item.status === "pending").length,
    inProgress: filteredComplaints.filter((item) => item.status === "in_progress").length,
    blocked: filteredComplaints.filter((item) => item.closureBlocked).length,
    resolved: filteredComplaints.filter((item) => item.status === "resolved").length,
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.8rem] border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-100 backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Complaint records</p>
            <p className="text-sm text-slate-500">
              Search, update, and review the full record for each complaint.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-xl bg-gradient-to-r from-railway-blue to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-100 hover:opacity-95"
          >
            Refresh records
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search complaint number, title, passenger, PNR, mobile"
              className="input-field pl-10 text-sm"
            />
          </div>

          <select
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
            className="input-field py-2 text-sm"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            className="input-field py-2 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                priority: event.target.value,
              }))
            }
            className="input-field py-2 text-sm"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label: "Total",
              value: summary.total,
              shell: "from-blue-50 to-white border-blue-200",
              accent: "text-blue-700",
            },
            {
              label: "Pending",
              value: summary.pending,
              shell: "from-amber-50 to-white border-amber-200",
              accent: "text-amber-700",
            },
            {
              label: "In progress",
              value: summary.inProgress,
              shell: "from-sky-50 to-white border-sky-200",
              accent: "text-sky-700",
            },
            {
              label: "Blocked",
              value: summary.blocked,
              shell: "from-rose-50 to-white border-rose-200",
              accent: "text-rose-700",
            },
            {
              label: "Resolved",
              value: summary.resolved,
              shell: "from-emerald-50 to-white border-emerald-200",
              accent: "text-emerald-700",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border bg-gradient-to-br px-4 py-3 shadow-sm ${item.shell}`}
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${item.accent}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner" />
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          <FaFilter className="mx-auto mb-3 text-3xl text-slate-300" />
          <p>No complaints match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard key={complaint._id} complaint={complaint} onRefresh={handleRefresh} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintManagement;
