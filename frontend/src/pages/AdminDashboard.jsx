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
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-railway-light via-white to-blue-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-railway-dark mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage complaints and view analytics</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
          {[
            {
              label: "Pending",
              val: stats?.pending || 0,
              color: "from-yellow-500 to-yellow-600",
              tab: "complaints",
              filter: "pending",
              icon: FaClock,
            },
            {
              label: "In Progress",
              val: stats?.inProgress || 0,
              color: "from-blue-500 to-blue-600",
              tab: "complaints",
              filter: "in_progress",
              icon: FaList,
            },
            {
              label: "Urgent",
              val: stats?.urgent || 0,
              color: "from-red-500 to-red-600",
              tab: "complaints",
              filter: "urgent",
              icon: FaExclamationTriangle,
            },
            {
              label: "Resolved",
              val: stats?.resolved || 0,
              color: "from-green-500 to-green-600",
              tab: "complaints",
              filter: "resolved",
              icon: FaChartBar,
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => {
                  setActiveTab(s.tab);
                  setStatFilter(
                    s.label === "Urgent"
                      ? { priority: "urgent" }
                      : { status: s.filter === "urgent" ? "" : s.filter },
                  );
                }}
                className={`card bg-gradient-to-br ${s.color} text-white w-full text-left transition-all hover:scale-105 hover:shadow-xl`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold opacity-90">
                      {s.label}
                    </h3>
                    <p className="text-4xl font-bold mt-2">{s.val}</p>
                  </div>
                  <Icon className="text-5xl opacity-20" />
                </div>
                <p className="text-xs opacity-60 mt-2">Click to view →</p>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "analytics"
                ? "bg-railway-blue text-white shadow-lg"
                : "bg-white text-railway-blue hover:bg-gray-50"
            }`}
          >
            <FaChartBar className="inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("complaints")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "complaints"
                ? "bg-railway-blue text-white shadow-lg"
                : "bg-white text-railway-blue hover:bg-gray-50"
            }`}
          >
            <FaList className="inline mr-2" />
            Manage Complaints
          </button>
          <button
            onClick={() => setActiveTab("controlUnit")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "controlUnit"
                ? "bg-red-600 text-white shadow-lg"
                : "bg-white text-red-600 hover:bg-red-50 border border-red-200"
            }`}
          >
            <FaSatelliteDish className="inline mr-2" />
            Control Unit
          </button>
        </div>

        {/* Content */}
        {activeTab === "analytics" && <AnalyticsCharts analytics={analytics} />}
        {activeTab === "complaints" && (
          <ComplaintManagement
            onUpdate={fetchData}
            initialFilter={statFilter}
          />
        )}
        {activeTab === "controlUnit" && <ControlUnitPanel />}
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
