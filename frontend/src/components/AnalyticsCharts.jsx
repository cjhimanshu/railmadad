import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';

const COLORS = {
    primary: ['#004E89', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
    status: {
        pending: '#EAB308',
        in_progress: '#3B82F6',
        resolved: '#10B981',
        rejected: '#EF4444',
    },
    priority: {
        urgent: '#DC2626',
        high: '#F97316',
        medium: '#3B82F6',
        low: '#6B7280',
    },
    sentiment: {
        positive: '#10B981',
        neutral: '#6B7280',
        negative: '#EF4444',
    },
};

const AnalyticsCharts = ({ analytics }) => {
    if (!analytics) {
        return <div>Loading analytics...</div>;
    }

    // Prepare data for charts
    const statusData = Object.entries(analytics.complaintsByStatus || {}).map(([key, value]) => ({
        name: key.replace('_', ' '),
        value,
        color: COLORS.status[key],
    }));

    const categoryData = Object.entries(analytics.complaintsByCategory || {}).map(([key, value]) => ({
        name: key.replace('_', ' '),
        count: value,
    }));

    const priorityData = Object.entries(analytics.complaintsByPriority || {}).map(([key, value]) => ({
        name: key,
        value,
        color: COLORS.priority[key],
    }));

    const sentimentData = Object.entries(analytics.complaintsBySentiment || {}).map(([key, value]) => ({
        name: key,
        value,
        color: COLORS.sentiment[key],
    }));

    const trendData = analytics.complaintsTrend || [];

    return (
        <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Complaints</h3>
                    <p className="text-4xl font-bold text-railway-blue">{analytics.totalComplaints}</p>
                </div>
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
                    <p className="text-4xl font-bold text-railway-blue">{analytics.totalUsers}</p>
                </div>
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg Resolution Time</h3>
                    <p className="text-4xl font-bold text-railway-blue">
                        {analytics.avgResolutionTimeHours}h
                    </p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="card">
                    <h3 className="text-xl font-bold text-railway-dark mb-4">Complaints by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Priority Distribution */}
                <div className="card">
                    <h3 className="text-xl font-bold text-railway-dark mb-4">Complaints by Priority</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={priorityData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {priorityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Distribution */}
                <div className="card lg:col-span-2">
                    <h3 className="text-xl font-bold text-railway-dark mb-4">Complaints by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#004E89" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Sentiment Analysis */}
                <div className="card">
                    <h3 className="text-xl font-bold text-railway-dark mb-4">Sentiment Analysis</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={sentimentData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {sentimentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Trend Chart */}
                <div className="card">
                    <h3 className="text-xl font-bold text-railway-dark mb-4">
                        Complaints Trend (Last 30 Days)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#004E89"
                                strokeWidth={2}
                                dot={{ fill: '#004E89' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCharts;
