import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Reconciliation = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/upload');
        setJobs(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to synchronize reconciliation batches:', err);
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) return (
    <div className="container mt-5 pt-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Syncing Matrix...</span>
      </div>
    </div>
  );

  return (
    <div className="container pb-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1 tracking-tight">History</h2>
          <p className="text-muted small mb-0">Review previous uploads and their reconciliation status</p>
        </div>
        <div className="bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill small border border-primary border-opacity-10">
          <i className="bi bi-stack me-2"></i>
          {jobs.filter(j => j.status === 'Completed').length} Jobs
        </div>
      </div>
      <div className="glass-card animate-fade-in">
        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id}>
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                        <i className="bi bi-file-earmark-spreadsheet text-primary"></i>
                      </div>
                      <div>
                        <div className="fw-bold fs-7">{job.fileName}</div>
                        <div className="text-muted" style={{ fontSize: '0.65rem' }}>HEX: {job.fileHash?.slice(0, 12)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 opacity-75 small">
                    {new Date(job.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge border ${job.status === 'Completed' ? 'bg-success bg-opacity-10 text-success border-success border-opacity-20' :
                      job.status === 'Failed' ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-20' :
                        'bg-warning bg-opacity-10 text-warning border-warning border-opacity-20'
                      } rounded-pill px-3 py-1`} style={{ fontSize: '0.65rem' }}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 opacity-75 small text-primary fw-medium">
                    @{job.userId?.username || 'System'}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      className="btn-premium py-1 px-4 fs-7"
                      onClick={() => navigate(`/reconcile/${job._id}`)}
                      disabled={job.status !== 'Completed'}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted italic">
                    <i className="bi bi-inbox fs-2 mb-2 d-block opacity-25"></i>
                    No datasets available for analysis
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

export default Reconciliation;
