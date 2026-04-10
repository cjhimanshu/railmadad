import { useCallback, useEffect, useState } from "react";
import {
  FaChartBar,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaSatelliteDish,
  FaShieldAlt,
  FaSyncAlt,
  FaTrain,
} from "react-icons/fa";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import AnalyticsCharts from "../components/AnalyticsCharts";
import ComplaintManagement from "../components/ComplaintManagement";
import api from "../utils/api";

const summaryCardStyles = {
  all: {
    shell: "from-white via-blue-50 to-sky-50 border-blue-200",
    icon: "from-railway-blue to-blue-600",
    accent: "text-blue-700",
    glow: "shadow-blue-100",
  },
  pending: {
    shell: "from-amber-50 via-white to-orange-50 border-amber-200",
    icon: "from-amber-400 to-orange-500",
    accent: "text-orange-700",
    glow: "shadow-orange-100",
  },
  progress: {
    shell: "from-sky-50 via-white to-indigo-50 border-sky-200",
    icon: "from-sky-500 to-indigo-500",
    accent: "text-sky-700",
    glow: "shadow-sky-100",
  },
  urgent: {
    shell: "from-rose-50 via-white to-orange-50 border-rose-200",
    icon: "from-rose-500 to-red-500",
    accent: "text-rose-700",
    glow: "shadow-rose-100",
  },
  resolved: {
    shell: "from-emerald-50 via-white to-teal-50 border-emerald-200",
    icon: "from-emerald-500 to-teal-500",
    accent: "text-emerald-700",
    glow: "shadow-emerald-100",
  },
};

const tabStyles = {
  complaints: "from-railway-blue to-blue-700",
  analytics: "from-violet-500 to-indigo-600",
  control: "from-railway-orange to-orange-500",
};

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
      if (filter.priority) {
        params.priority = filter.priority;
      }
      if (filter.dispatchType) {
        params.dispatchType = filter.dispatchType;
      }
      if (filter.acknowledged !== "") {
        params.acknowledged = filter.acknowledged;
      }

      const response = await api.get("/admin/dispatch-log", { params });
      setDispatches(response.data.data || []);
      setQueueStatus(
        response.data.queueStatus || {
          mediumQueue: 0,
          lowQueue: 0,
        },
      );
    } catch (error) {
      console.error("Failed to load dispatch log", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  const handleAcknowledge = async (batchId) => {
    try {
      await api.put(`/admin/dispatch-log/${batchId}/acknowledge`);
      fetchDispatches();
    } catch (error) {
      console.error("Failed to acknowledge dispatch", error);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-lg shadow-orange-100">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-300/30 blur-2xl" />
          <p className="text-xs uppercase tracking-[0.25em] text-amber-500">
            Medium queue
          </p>
          <p className="mt-3 text-4xl font-extrabold text-slate-900">
            {queueStatus.mediumQueue}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Records waiting for the 5-minute dispatch batch.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-lg shadow-emerald-100">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-300/30 blur-2xl" />
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-500">
            Low queue
          </p>
          <p className="mt-3 text-4xl font-extrabold text-slate-900">
            {queueStatus.lowQueue}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Records waiting for the 10-minute dispatch batch.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-lg shadow-slate-100 backdrop-blur-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={filter.priority}
            onChange={(event) =>
              setFilter((current) => ({
                ...current,
                priority: event.target.value,
              }))
            }
            className="input-field py-2 text-sm"
          >
            <option value="">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filter.dispatchType}
            onChange={(event) =>
              setFilter((current) => ({
                ...current,
                dispatchType: event.target.value,
              }))
            }
            className="input-field py-2 text-sm"
          >
            <option value="">All dispatch types</option>
            <option value="IMMEDIATE">Immediate</option>
            <option value="BATCH_5MIN">Batch 5 min</option>
            <option value="BATCH_10MIN">Batch 10 min</option>
          </select>

          <select
            value={filter.acknowledged}
            onChange={(event) =>
              setFilter((current) => ({
                ...current,
                acknowledged: event.target.value,
              }))
            }
            className="input-field py-2 text-sm"
          >
            <option value="">All records</option>
            <option value="false">Pending acknowledgement</option>
            <option value="true">Acknowledged</option>
          </select>

          <button
            type="button"
            onClick={fetchDispatches}
            className="rounded-xl bg-gradient-to-r from-railway-blue to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-100 hover:opacity-95"
          >
            Refresh dispatch log
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner" />
        </div>
      ) : dispatches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          No dispatch records found.
        </div>
      ) : (
        <div className="space-y-4">
          {dispatches.map((dispatch) => (
            <div
              key={dispatch._id}
              className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-100 backdrop-blur-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-slate-500">
                    {dispatch.batchId}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">
                    {dispatch.complaintCount} complaint
                    {dispatch.complaintCount !== 1 ? "s" : ""} in this batch
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
                    {dispatch.priority}
                  </span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">
                    {dispatch.dispatchType}
                  </span>
                  <span className="text-slate-400">
                    {new Date(dispatch.dispatchedAt).toLocaleString("en-IN")}
                  </span>
                  {dispatch.acknowledged ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                      Acknowledged
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(dispatch.batchId)}
                      className="rounded-full bg-gradient-to-r from-railway-orange to-orange-500 px-3 py-1 text-white shadow-sm hover:opacity-95"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {(dispatch.complaints || []).map((complaint) => (
                  <div
                    key={complaint._id}
                    className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3 text-sm text-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">
                        {complaint.title}
                      </span>
                      <span className="text-xs text-slate-500">
                        {complaint.assignedDepartment}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{complaint.category}</span>
                      <span>{complaint.priority}</span>
                      <span>{complaint.status}</span>
                    </div>
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

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("complaints");
  const [complaintFilter, setComplaintFilter] = useState({});
  const [complaintFilterLabel, setComplaintFilterLabel] = useState("All records");
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsResponse, analyticsResponse] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/analytics"),
      ]);
      setStats(statsResponse.data.data);
      setAnalytics(analyticsResponse.data.data);
    } catch (error) {
      console.error("Failed to load admin dashboard", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalComplaints =
    analytics?.totalComplaints ||
    ((stats?.pending || 0) +
      (stats?.inProgress || 0) +
      (stats?.resolved || 0) +
      (stats?.rejected || 0));

  const summaryCards = [
    {
      key: "all",
      label: "All records",
      value: totalComplaints,
      icon: FaClipboardList,
      filter: {},
      note: "Full complaint register",
    },
    {
      key: "pending",
      label: "Pending",
      value: stats?.pending || 0,
      icon: FaClock,
      filter: { status: "pending" },
      note: "Waiting for action",
    },
    {
      key: "progress",
      label: "In progress",
      value: stats?.inProgress || 0,
      icon: FaTrain,
      filter: { status: "in_progress" },
      note: "Currently being handled",
    },
    {
      key: "urgent",
      label: "Urgent",
      value: stats?.urgent || 0,
      icon: FaSatelliteDish,
      filter: { priority: "urgent" },
      note: "Needs fast intervention",
    },
    {
      key: "resolved",
      label: "Resolved",
      value: stats?.resolved || 0,
      icon: FaCheckCircle,
      filter: { status: "resolved" },
      note: "Closed successfully",
    },
  ];

  const openComplaintRecords = (card) => {
    setComplaintFilter(card.filter);
    setComplaintFilterLabel(card.label);
    setActiveTab("complaints");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-slate-50 to-sky-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-railway-blue via-blue-800 to-slate-900 p-7 text-white shadow-2xl shadow-blue-100">
          <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-orange-400/20 blur-3xl" />
          <div className="absolute left-1/3 top-0 h-32 w-32 rounded-full bg-sky-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm">
                <FaShieldAlt className="text-3xl text-orange-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-blue-200">
                  RailMadad admin
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                  Complaint records dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100/80">
                  A simpler command center with brighter visual hierarchy. Review
                  records, spot priority work quickly, and keep every complaint
                  history accessible from one place.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-xl bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <FaSyncAlt />
              Refresh dashboard
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            const style = summaryCardStyles[card.key];
            const active =
              activeTab === "complaints" && complaintFilterLabel === card.label;

            return (
              <button
                key={card.label}
                type="button"
                onClick={() => openComplaintRecords(card)}
                className={`relative overflow-hidden rounded-[1.6rem] border bg-gradient-to-br p-5 text-left shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${style.shell} ${style.glow} ${
                  active ? "ring-2 ring-offset-2 ring-railway-orange" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${style.icon} text-white shadow-md`}
                  >
                    <Icon className="text-lg" />
                  </div>
                  {active ? (
                    <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.24em] text-slate-400">
                  {card.label}
                </p>
                <p className={`mt-2 text-4xl font-extrabold ${style.accent}`}>
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{card.note}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-white/70 bg-white/80 p-3 shadow-lg shadow-slate-100 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2">
            {[
              {
                key: "complaints",
                label: "Complaints",
                icon: FaClipboardList,
              },
              {
                key: "analytics",
                label: "Analytics",
                icon: FaChartBar,
              },
              {
                key: "control",
                label: "Control unit",
                icon: FaSatelliteDish,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? `bg-gradient-to-r ${tabStyles[tab.key]} text-white shadow-lg`
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          {activeTab === "complaints" ? (
            <div className="space-y-4">
              <div className="rounded-[1.6rem] border border-white/70 bg-gradient-to-r from-white via-orange-50/60 to-blue-50/70 px-5 py-4 shadow-lg shadow-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Showing: {complaintFilterLabel}
                    </p>
                    <p className="text-sm text-slate-500">
                      Every complaint keeps a visible record and history trail.
                    </p>
                  </div>

                  {complaintFilterLabel !== "All records" ? (
                    <button
                      type="button"
                      onClick={() => openComplaintRecords(summaryCards[0])}
                      className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
                    >
                      Clear filter
                    </button>
                  ) : null}
                </div>
              </div>

              <ComplaintManagement
                onUpdate={fetchData}
                initialFilter={complaintFilter}
              />
            </div>
          ) : null}

          {activeTab === "analytics" ? (
            <AnalyticsCharts analytics={analytics} />
          ) : null}

          {activeTab === "control" ? <ControlUnitPanel /> : null}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
