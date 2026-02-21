import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Audit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit');
        setLogs(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to synchronize audit trails:', err);
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return (
    <div className="container mt-5 pt-5 text-center">
      <div className="spinner-grow text-primary" role="status">
        <span className="visually-hidden">Syncing Vault...</span>
      </div>
    </div>
  );

  return (
    <div className="container pb-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1 tracking-tight">Audit Logs</h2>
          <p className="text-muted small mb-0">Record of all changes and corrections</p>


        </div>

        <div className="bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill small border border-primary border-opacity-10">
          <i className="bi bi-shield-shaded me-2"></i>
          Registry Synchronized
        </div>
      </div>

      <div className="glass-card animate-fade-in">
        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 text-end">Details</th>
              </tr>



            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center">
                      <div className={`rounded-pill p-1 me-3 ${log.action === 'Correction' ? 'bg-warning' : 'bg-primary'
                        }`} style={{ width: '8px', height: '8px' }}></div>
                      <div>
                        <div className="fw-bold small">{log.action}</div>
                        <div className="text-muted italic" style={{ fontSize: '0.65rem' }}>
                          Vector: {log.recordId?._id?.slice(-12).toUpperCase() || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 opacity-75 small">
                    {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 opacity-75">
                    <span className="fw-medium text-primary">@{log.userId?.username || log.source || 'System'}</span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/audit-detail/${log.recordId?._id || log.recordId}`)}
                      disabled={!log.recordId}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted opacity-50 italic">
                    <i className="bi bi-safe fs-1 mb-3 d-block"></i>
                    Vault is empty. No signals recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Audit;
