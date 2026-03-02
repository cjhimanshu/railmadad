import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  FaChartPie,
  FaExclamationTriangle,
  FaUsers,
  FaClock,
  FaSmile,
  FaMeh,
  FaFrown,
  FaFire,
  FaArrowUp,
} from "react-icons/fa";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending: "#F59E0B",
  in_progress: "#3B82F6",
  resolved: "#10B981",
  rejected: "#EF4444",
};
const PRIORITY_COLORS = {
  urgent: "#EF4444",
  high: "#F97316",
  medium: "#3B82F6",
  low: "#6B7280",
};
const SENTIMENT_COLORS = {
  positive: "#10B981",
  neutral: "#6B7280",
  negative: "#EF4444",
};

const CATEGORY_COLORS = [
  "#6366F1",
  "#3B82F6",
  "#0EA5E9",
  "#10B981",
  "#14B8A6",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#84CC16",
];

// ─── Donut chart with center label ────────────────────────────────────────────
const DonutChart = ({ data, total, label }) => (
  <div className="relative">
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={75}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((e, i) => (
            <Cell key={i} fill={e.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
    {/* centre label — CSS overlay */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <p className="text-2xl font-extrabold text-slate-800 leading-none">
          {total}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">
          {label}
        </p>
      </div>
    </div>
  </div>
);

// ─── Styled tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.92)",
        backdropFilter: "blur(8px)",
        borderRadius: 12,
        padding: "10px 16px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      {label && (
        <p style={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}>
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <p
          key={i}
          style={{ color: p.color || "#fff", fontWeight: 700, fontSize: 14 }}
        >
          {p.name}: <span style={{ color: "#fff" }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Glass card wrapper ─────────────────────────────────────────────────────────
const GlassPanel = ({ children, className = "" }) => (
  <div
    className={`bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-lg ${className}`}
  >
    {children}
  </div>
);

// ─── Panel header ───────────────────────────────────────────────────────────────
const PanelHeader = ({
  title,
  subtitle,
  accent = "from-blue-600 to-indigo-600",
}) => (
  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
    <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${accent}`} />
    <div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── Legend pill ────────────────────────────────────────────────────────────────
const LegendPill = ({ color, label, value }) => (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
      <span className="text-sm text-slate-600 capitalize">
        {label.replace(/_/g, " ")}
      </span>
    </div>
    <span className="text-sm font-bold text-slate-800">{value}</span>
  </div>
);

// ─── Main component ─────────────────────────────────────────────────────────────
const AnalyticsCharts = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  const statusData = Object.entries(analytics.complaintsByStatus || {}).map(
    ([k, v]) => ({ name: k, value: v, color: STATUS_COLORS[k] || "#94A3B8" }),
  );
  const priorityData = Object.entries(analytics.complaintsByPriority || {}).map(
    ([k, v]) => ({ name: k, value: v, color: PRIORITY_COLORS[k] || "#94A3B8" }),
  );
  const sentimentData = Object.entries(
    analytics.complaintsBySentiment || {},
  ).map(([k, v]) => ({
    name: k,
    value: v,
    color: SENTIMENT_COLORS[k] || "#94A3B8",
  }));
  const categoryData = Object.entries(analytics.complaintsByCategory || {})
    .map(([k, v], i) => ({
      name: k.replace(/_/g, " "),
      count: v,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.count - a.count);
  const trendData = (analytics.complaintsTrend || []).map((d) => ({
    date: d._id?.slice(5),
    count: d.count,
  }));

  const totalStatus = statusData.reduce((s, d) => s + d.value, 0);
  const totalPriority = priorityData.reduce((s, d) => s + d.value, 0);
  const recentPct = analytics.totalComplaints
    ? Math.round((analytics.recentComplaints / analytics.totalComplaints) * 100)
    : 0;

  // ── KPI banner ────────────────────────────────────────────────────────────
  const KPI_CARDS = [
    {
      label: "Total Complaints",
      value: analytics.totalComplaints,
      sub: `+${analytics.recentComplaints} this week`,
      grad: "from-blue-500 to-indigo-600",
      icon: FaChartPie,
      light: "bg-blue-50 text-blue-600",
    },
    {
      label: "Registered Users",
      value: analytics.totalUsers,
      sub: "Active accounts",
      grad: "from-violet-500 to-purple-600",
      icon: FaUsers,
      light: "bg-violet-50 text-violet-600",
    },
    {
      label: "Avg Resolution",
      value: `${analytics.avgResolutionTimeHours}h`,
      sub: "Mean time to close",
      grad: "from-teal-500 to-emerald-600",
      icon: FaClock,
      light: "bg-teal-50 text-teal-600",
    },
    {
      label: "This Week",
      value: analytics.recentComplaints,
      sub: `${recentPct}% of all time`,
      grad: "from-orange-500 to-rose-500",
      icon: FaArrowUp,
      light: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-md p-5 group hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* gradient accent strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${k.grad}`}
              />
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${k.light}`}>
                  <Icon className="text-lg" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800 leading-none mb-1">
                {k.value}
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {k.label}
              </p>
              <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── 30-day Trend (full width) ── */}
      <GlassPanel className="p-6">
        <PanelHeader
          title="Complaint Volume — Last 30 Days"
          subtitle="Daily submission trend"
          accent="from-blue-500 to-cyan-500"
        />
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={trendData}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              name="Complaints"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#trendGrad)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#3B82F6",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassPanel>

      {/* ── Donut row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status donut */}
        <GlassPanel className="p-6">
          <PanelHeader
            title="By Status"
            accent="from-amber-500 to-orange-500"
          />
          <DonutChart data={statusData} total={totalStatus} label="total" />
          <div className="mt-2 divide-y divide-gray-50">
            {statusData.map((d) => (
              <LegendPill
                key={d.name}
                color={d.color}
                label={d.name}
                value={d.value}
              />
            ))}
          </div>
        </GlassPanel>

        {/* Priority donut */}
        <GlassPanel className="p-6">
          <PanelHeader title="By Priority" accent="from-red-500 to-rose-500" />
          <DonutChart data={priorityData} total={totalPriority} label="total" />
          <div className="mt-2 divide-y divide-gray-50">
            {priorityData.map((d) => (
              <LegendPill
                key={d.name}
                color={d.color}
                label={d.name}
                value={d.value}
              />
            ))}
          </div>
        </GlassPanel>

        {/* Sentiment donut */}
        <GlassPanel className="p-6">
          <PanelHeader
            title="Sentiment"
            accent="from-emerald-500 to-teal-500"
          />
          <DonutChart
            data={sentimentData}
            total={sentimentData.reduce((s, d) => s + d.value, 0)}
            label="total"
          />
          <div className="mt-2 divide-y divide-gray-50">
            {sentimentData.map((d) => {
              const Icon =
                d.name === "positive"
                  ? FaSmile
                  : d.name === "negative"
                    ? FaFrown
                    : FaMeh;
              return (
                <div
                  key={d.name}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Icon style={{ color: d.color }} />
                    <span className="text-sm text-slate-600 capitalize">
                      {d.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    {d.value}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      {/* ── Category horizontal bar ── */}
      <GlassPanel className="p-6">
        <PanelHeader
          title="Complaints by Category"
          subtitle="Sorted by volume"
          accent="from-violet-500 to-purple-600"
        />
        <ResponsiveContainer
          width="100%"
          height={Math.max(280, categoryData.length * 34)}
        >
          <BarChart
            data={categoryData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
          >
            <defs>
              {categoryData.map((d, i) => (
                <linearGradient
                  key={i}
                  id={`catGrad${i}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor={d.fill} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={d.fill} stopOpacity={0.5} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#F1F5F9"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
            />
            <Bar
              dataKey="count"
              name="Complaints"
              radius={[0, 6, 6, 0]}
              barSize={18}
            >
              {categoryData.map((d, i) => (
                <Cell key={i} fill={`url(#catGrad${i})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassPanel>
    </div>
  );
};

export default AnalyticsCharts;
