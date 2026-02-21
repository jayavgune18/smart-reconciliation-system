import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const StatCard = ({ title, value, color, icon, suffix = '' }) => (
  <div className="col-md-6 col-lg-4 col-xl-2">
    <div className="glass-card stat-card h-100 animate-fade-in">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className={`rounded-3 p-2 d-flex align-items-center justify-content-center bg-opacity-10 bg-${color}`} style={{ width: '40px', height: '40px' }}>
          <i className={`bi ${icon} text-${color} fs-5`}></i>
        </div>
      </div>
      <h6 className="text-muted small fw-medium text-uppercase tracking-wider mb-1">{title}</h6>
      <div className="d-flex align-items-baseline">
        <h3 className="fw-bold mb-0">{value ?? 0}</h3>
        {suffix && <span className="ms-1 text-muted small">{suffix}</span>}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState({ accuracyPercentage: '0.00' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSummary = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get(`/reconcile/summary?t=${Date.now()}`);
      setSummary(res.data || { accuracyPercentage: '0.00' });
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) return (
    <div className="container mt-5 pt-5 text-center">
      <div className="spinner-grow text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="container pb-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1 text-gradient">System Intelligence</h2>
          <p className="text-muted small mb-0">Real-time reconciliation analytics & oversight</p>
        </div>

        <div className="d-flex align-items-center gap-4">
          <div className="text-end d-none d-md-block">
            <p className="text-muted mb-0 small opacity-75">Last synchronized</p>
            <p className="fw-bold small mb-0 text-primary-light">{lastUpdated || 'Initial load...'}</p>
          </div>
          <button
            className="btn-premium d-flex align-items-center"
            onClick={() => fetchSummary(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <span className="spinner-border spinner-border-sm me-2"></span>
            ) : (
              <i className="bi bi-arrow-clockwise me-2"></i>
            )}
            {refreshing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      <div className="row g-3 mb-5">
        <StatCard title="Total Records" value={summary.total} color="primary" icon="bi-database-fill" />
        <StatCard title="Matched" value={summary.matched} color="success" icon="bi-check-circle-fill" />
        <StatCard title="Partial" value={summary.partiallyMatched} color="warning" icon="bi-exclamation-circle-fill" />
        <StatCard title="No Match" value={summary.notMatched} color="danger" icon="bi-x-circle-fill" />
        <StatCard title="Duplicates" value={summary.duplicate} color="info" icon="bi-layers-fill" />
        <StatCard title="Accuracy" value={summary.accuracyPercentage} suffix="%" color="primary" icon="bi-activity" />
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="px-4 py-3 border-bottom border-light border-opacity-10">
              <h5 className="fw-bold mb-0 small text-uppercase tracking-wider">Reconcile Matrix</h5>
            </div>
            <div className="p-4" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.chartData || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
                    }}
                    itemStyle={{ color: '#f8fafc', fontSize: '13px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={45}>
                    {(summary.chartData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="glass-card mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="px-4 py-3 border-bottom border-light border-opacity-10 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 small text-uppercase tracking-wider">Latest Ingestion</h5>
              {summary.latestJob && (
                <Link to={`/reconcile/${summary.latestJob.id}`} className="text-primary-light small text-decoration-none fw-semibold">
                  View <i className="bi bi-chevron-right ms-1"></i>
                </Link>
              )}
            </div>
            <div className="p-4">
              {summary.latestJob ? (
                <div>
                  <div className="d-flex align-items-center mb-4 p-3 rounded-4 bg-white bg-opacity-5 border border-white border-opacity-5">
                    <div className="bg-primary bg-opacity-20 rounded-3 p-2 me-3">
                      <i className="bi bi-file-earmark-spreadsheet-fill text-primary-light fs-4"></i>
                    </div>
                    <div className="overflow-hidden">
                      <p className="mb-0 fw-bold text-truncate small">{summary.latestJob.filename}</p>
                      <span className={`badge ${summary.latestJob.status === 'Completed' ? 'bg-success' : 'bg-warning'} rounded-pill mt-1`} style={{ fontSize: '0.65rem' }}>
                        {summary.latestJob.status}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    {summary.latestJob.results?.map((res, i) => (
                      <div key={i} className="d-flex justify-content-between align-items-center px-3 py-2 rounded-3 bg-white bg-opacity-5 border border-white border-opacity-5">
                        <span className="small text-muted">{res._id}</span>
                        <span className="fw-bold small">{res.count}</span>
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-cloud-slash text-muted fs-1 mb-2 d-block opacity-10"></i>
                  <p className="small text-muted mb-0">No data ingested</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="px-4 py-3 border-bottom border-light border-opacity-10">
              <h5 className="fw-bold mb-0 small text-uppercase tracking-wider">Audit Pulse</h5>
            </div>

            <div className="p-0">
              <div className="list-group list-group-flush">
                {summary.recentActivity?.map((log, i) => (
                  <div key={i} className="list-group-item bg-transparent border-light border-opacity-10 px-4 py-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-bold small text-primary-light">{log.action}</span>
                      <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mb-0 small text-muted">
                      <span className="text-primary-light fw-medium">@{log.user}</span> triggered system event
                    </p>
                  </div>
                ))}
                {!summary.recentActivity?.length && (
                  <div className="text-center py-5 px-3">
                    <p className="small text-muted mb-0 opacity-50">Pulse inactive</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
