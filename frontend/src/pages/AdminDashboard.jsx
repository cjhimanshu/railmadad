import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AnalyticsCharts from "../components/AnalyticsCharts";
import ComplaintManagement from "../components/ComplaintManagement";
import api from "../utils/api";
import {
  FaChartBar,
  FaList,
  FaExclamationTriangle,
  FaClock,
  FaSatelliteDish,
  FaBolt,
  FaBoxOpen,
  FaCheck,
  FaHourglass,
  FaArrowRight,
  FaTimes,
  FaCheckCircle,
  FaFire,
  FaLayerGroup,
  FaPaperPlane,
  FaSpinner,
} from "react-icons/fa";

// ─── Priority colours ─────────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  urgent: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300",
};

const DISPATCH_TYPE_LABEL = {
  IMMEDIATE: {
    label: "Immediate",
    icon: <FaBolt className="inline mr-1 text-red-500" />,
  },
  BATCH_5MIN: {
    label: "Batch 5min",
    icon: <FaHourglass className="inline mr-1 text-yellow-500" />,
  },
  BATCH_10MIN: {
    label: "Batch 10min",
    icon: <FaHourglass className="inline mr-1 text-green-500" />,
  },
};

// ─── Control Unit Panel ───────────────────────────────────────────────────────
const ControlUnitPanel = () => {
  const [dispatches, setDispatches] = useState([]);
  const [queueStatus, setQueueStatus] = useState({
    mediumQueue: 0,
    lowQueue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    priority: "",
    dispatchType: "",
    acknowledged: "",
  });

  const fetchDispatches = useCallback(async () => {
    try {
      const params = {};
      if (filter.priority) params.priority = filter.priority;
      if (filter.dispatchType) params.dispatchType = filter.dispatchType;
      if (filter.acknowledged !== "") params.acknowledged = filter.acknowledged;
      const res = await api.get("/admin/dispatch-log", { params });
      setDispatches(res.data.data);
      setQueueStatus(res.data.queueStatus || { mediumQueue: 0, lowQueue: 0 });
    } catch (e) {
      console.error("dispatch-log error", e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDispatches();
    const interval = setInterval(fetchDispatches, 15000); // auto-refresh every 15s
    return () => clearInterval(interval);
  }, [fetchDispatches]);

  const handleAcknowledge = async (batchId) => {
    try {
      await api.put(`/admin/dispatch-log/${batchId}/acknowledge`);
      fetchDispatches();
    } catch (e) {
      console.error("ack error", e);
    }
  };

  return (
    <div>
      {/* Live Queue Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 flex items-center gap-4">
          <FaHourglass className="text-3xl text-yellow-500" />
          <div>
            <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wide">
              Medium Queue
            </p>
            <p className="text-3xl font-bold text-yellow-800">
              {queueStatus.mediumQueue}
            </p>
            <p className="text-xs text-yellow-600">
              dispatches pending (5-min batch)
            </p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center gap-4">
          <FaHourglass className="text-3xl text-green-500" />
          <div>
            <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">
              Low Queue
            </p>
            <p className="text-3xl font-bold text-green-800">
              {queueStatus.lowQueue}
            </p>
            <p className="text-xs text-green-600">
              dispatches pending (10-min batch)
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          value={filter.priority}
          onChange={(e) =>
            setFilter((f) => ({ ...f, priority: e.target.value }))
          }
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          value={filter.dispatchType}
          onChange={(e) =>
            setFilter((f) => ({ ...f, dispatchType: e.target.value }))
          }
        >
          <option value="">All Types</option>
          <option value="IMMEDIATE">Immediate</option>
          <option value="BATCH_5MIN">Batch 5min</option>
          <option value="BATCH_10MIN">Batch 10min</option>
        </select>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          value={filter.acknowledged}
          onChange={(e) =>
            setFilter((f) => ({ ...f, acknowledged: e.target.value }))
          }
        >
          <option value="">All</option>
          <option value="false">Unacknowledged</option>
          <option value="true">Acknowledged</option>
        </select>
        <button
          onClick={fetchDispatches}
          className="ml-auto px-4 py-2 bg-railway-blue text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          Refresh
        </button>
      </div>

      {/* Dispatch Log Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner" />
        </div>
      ) : dispatches.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FaBoxOpen className="text-5xl mx-auto mb-3" />
          <p>No dispatches yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dispatches.map((d) => (
            <div
              key={d._id}
              className={`bg-white rounded-xl shadow-sm border-l-4 p-5 ${d.priority === "urgent" ? "border-red-500" : d.priority === "high" ? "border-orange-500" : d.priority === "medium" ? "border-yellow-500" : "border-green-500"}`}
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {/* Batch ID */}
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {d.batchId}
                </span>
                {/* Priority badge */}
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full border ${PRIORITY_STYLES[d.priority]}`}
                >
                  {d.priority?.toUpperCase()}
                </span>
                {/* Dispatch type */}
                <span className="text-xs text-gray-600 font-medium">
                  {DISPATCH_TYPE_LABEL[d.dispatchType]?.icon}
                  {DISPATCH_TYPE_LABEL[d.dispatchType]?.label}
                </span>
                {/* Complaint count */}
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {d.complaintCount} complaint
                  {d.complaintCount !== 1 ? "s" : ""}
                </span>
                {/* Timestamp */}
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(d.dispatchedAt).toLocaleString("en-IN")}
                </span>
                {/* Ack status */}
                {d.acknowledged ? (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    <FaCheck /> Acknowledged
                  </span>
                ) : (
                  <button
                    onClick={() => handleAcknowledge(d.batchId)}
                    className="text-xs bg-railway-blue text-white px-3 py-1 rounded-full hover:opacity-90 transition"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
              {/* Complaints list */}
              <div className="space-y-1">
                {d.complaints?.map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="font-medium text-gray-800 truncate flex-1">
                      {c.title}
                    </span>
                    <span className="text-xs text-gray-400">{c.category}</span>
                    <span className="text-xs text-gray-400">
                      {c.assignedDepartment}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [statFilter, setStatFilter] = useState({});
  const [activeCardLabel, setActiveCardLabel] = useState(null);
  const [showComplaints, setShowComplaints] = useState(false);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingAuthority, setSendingAuthority] = useState(null);
  const [authoritySentLabel, setAuthoritySentLabel] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/analytics"),
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const STAT_CARDS = [
    {
      label: "Pending",
      val: stats?.pending || 0,
      gradient: "from-amber-400 via-orange-400 to-orange-500",
      shadow: "shadow-orange-200",
      ring: "ring-orange-300",
      bg: "from-orange-50 to-amber-50",
      accent: "text-orange-500",
      bar: "bg-orange-400",
      icon: FaClock,
      desc: "Awaiting assignment",
      filter: { status: "pending" },
    },
    {
      label: "In Progress",
      val: stats?.inProgress || 0,
      gradient: "from-blue-400 via-blue-500 to-indigo-500",
      shadow: "shadow-blue-200",
      ring: "ring-blue-300",
      bg: "from-blue-50 to-indigo-50",
      accent: "text-blue-500",
      bar: "bg-blue-400",
      icon: FaLayerGroup,
      desc: "Being handled",
      filter: { status: "in_progress" },
    },
    {
      label: "Urgent",
      val: stats?.urgent || 0,
      gradient: "from-rose-400 via-red-500 to-red-600",
      shadow: "shadow-red-200",
      ring: "ring-red-300",
      bg: "from-red-50 to-rose-50",
      accent: "text-red-500",
      bar: "bg-red-500",
      icon: FaFire,
      desc: "Needs immediate action",
      filter: { priority: "urgent" },
    },
    {
      label: "Resolved",
      val: stats?.resolved || 0,
      gradient: "from-emerald-400 via-green-500 to-teal-500",
      shadow: "shadow-green-200",
      ring: "ring-green-300",
      bg: "from-green-50 to-emerald-50",
      accent: "text-green-500",
      bar: "bg-green-500",
      icon: FaCheckCircle,
      desc: "Successfully closed",
      filter: { status: "resolved" },
    },
  ];

  const total =
    (stats?.pending || 0) + (stats?.inProgress || 0) + (stats?.resolved || 0);

  const handleSendToAuthority = async (e, card) => {
    e.stopPropagation();
    if (!window.confirm(`Send all "${card.label}" complaints to authority?`))
      return;
    setSendingAuthority(card.label);
    try {
      const payload = {};
      if (card.filter.status) payload.status = card.filter.status;
      if (card.filter.priority) payload.priority = card.filter.priority;
      const res = await api.post("/admin/bulk-send-to-authority", payload);
      setAuthoritySentLabel(card.label);
      setTimeout(() => setAuthoritySentLabel(null), 3000);
      alert(res.data.message);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send to authority.");
    } finally {
      setSendingAuthority(null);
    }
  };

  const handleCardClick = (card) => {
    setStatFilter(card.filter);
    setActiveCardLabel(card.label);
    setShowComplaints(true);
    setActiveTab("complaints");
    setTimeout(() => {
      document
        .getElementById("complaint-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-railway-dark mb-1">
              Admin Dashboard
            </h1>
            <p className="text-gray-500">
              Monitor complaints, track performance, dispatch actions
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 text-sm bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
          >
            ↻ Refresh
          </button>
        </div>

        {/* ── BIG Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-slide-up">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            const pct = total > 0 ? Math.round((card.val / total) * 100) : 0;
            const isActive = activeCardLabel === card.label && showComplaints;
            return (
              <button
                key={card.label}
                onClick={() => handleCardClick(card)}
                className={`relative overflow-hidden rounded-2xl p-px transition-all duration-300 hover:scale-105 hover:shadow-2xl ${isActive ? `ring-4 ${card.ring} scale-105 shadow-2xl` : `shadow-lg ${card.shadow}`}`}
              >
                {/* gradient border */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-2xl`}
                />
                {/* card body */}
                <div
                  className={`relative rounded-2xl bg-gradient-to-br ${card.bg} p-6 h-full flex flex-col`}
                >
                  {/* top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}
                    >
                      <Icon className="text-white text-2xl" />
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${card.accent} bg-white/70 px-2 py-1 rounded-full`}
                    >
                      {card.label}
                    </span>
                  </div>

                  {/* number */}
                  <p className="text-5xl font-extrabold text-gray-800 leading-none mb-1">
                    {card.val}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">{card.desc}</p>

                  {/* progress bar */}
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Share of total</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${card.bar} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* click hint */}
                  <div
                    className={`mt-4 flex items-center gap-1 text-xs font-semibold ${card.accent}`}
                  >
                    {isActive ? "Showing below ↓" : "Click to view"}
                    <FaArrowRight className="text-[10px]" />
                  </div>

                  {/* Send to Authority button */}
                  <button
                    onClick={(e) => handleSendToAuthority(e, card)}
                    disabled={sendingAuthority === card.label}
                    className={`mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                      authoritySentLabel === card.label
                        ? "bg-green-500 text-white"
                        : `bg-gradient-to-r ${card.gradient} text-white hover:opacity-90 active:scale-95`
                    } shadow-md disabled:opacity-60`}
                  >
                    {sendingAuthority === card.label ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Sending...
                      </>
                    ) : authoritySentLabel === card.label ? (
                      <>
                        <FaCheckCircle />
                        Sent!
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Send to Authority
                      </>
                    )}
                  </button>
                </div>
              </button>
            );
          })}
        </div>

        {/* Total banner */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Total Complaints
            </p>
            <p className="text-3xl font-bold text-gray-800">
              {stats?.total || total}
            </p>
          </div>
          <div className="h-10 w-px bg-gray-200 hidden sm:block" />
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {STAT_CARDS.map((c) => (
              <span key={c.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${c.bar}`} />
                {c.label}: <strong className="text-gray-700">{c.val}</strong>
              </span>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveTab("analytics");
                setShowComplaints(false);
                setActiveCardLabel(null);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "analytics" && !showComplaints ? "bg-railway-blue text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              <FaChartBar className="inline mr-1" /> Analytics
            </button>
            <button
              onClick={() => {
                setActiveTab("complaints");
                setStatFilter({});
                setActiveCardLabel("All");
                setShowComplaints(true);
                setTimeout(
                  () =>
                    document
                      .getElementById("complaint-section")
                      ?.scrollIntoView({ behavior: "smooth" }),
                  100,
                );
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "complaints" && showComplaints ? "bg-railway-blue text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              <FaList className="inline mr-1" /> All Complaints
            </button>
            <button
              onClick={() => {
                setActiveTab("controlUnit");
                setShowComplaints(false);
                setActiveCardLabel(null);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "controlUnit" ? "bg-red-600 text-white shadow" : "bg-gray-100 text-red-600 hover:bg-red-50"}`}
            >
              <FaSatelliteDish className="inline mr-1" /> Control Unit
            </button>
          </div>
        </div>

        {/* Analytics */}
        {activeTab === "analytics" && !showComplaints && (
          <AnalyticsCharts analytics={analytics} />
        )}

        {/* Control Unit */}
        {activeTab === "controlUnit" && !showComplaints && <ControlUnitPanel />}

        {/* Complaints section — only appears after card click */}
        {showComplaints && (
          <div id="complaint-section" className="animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {activeCardLabel === "All"
                    ? "All Complaints"
                    : `${activeCardLabel} Complaints`}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeCardLabel === "All"
                    ? "Showing all complaints"
                    : `Filtered by: ${activeCardLabel.toLowerCase()}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowComplaints(false);
                  setActiveCardLabel(null);
                }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm transition-all hover:bg-gray-50"
              >
                <FaTimes /> Close
              </button>
            </div>
            <ComplaintManagement
              onUpdate={fetchData}
              initialFilter={statFilter}
            />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
