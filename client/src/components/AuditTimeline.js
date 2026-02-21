import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useParams, Link } from 'react-router-dom';

const AuditTimeline = () => {
    const { recordId } = useParams();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLogs = useCallback(async () => {
        if (!recordId || recordId === ':recordId') {
            setError('Please select a specific vector from the analysis matrix to view its trace.');
            setLoading(false);
            return;
        }
        try {
            const res = await api.get(`/audit/${recordId}`);
            setLogs(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to synchronize audit sequence.');

            setLoading(false);
        }
    }, [recordId]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getActionColor = (action) => {
        switch (action) {
            case 'Upload': return '#4f46e5';
            case 'Reconcile': return '#06b6d4';
            case 'Correction': return '#f59e0b';
            case 'Matched': return '#10b981';
            default: return '#94a3b8';
        }
    };

    if (loading) return (
        <div className="container mt-5 pt-5 text-center">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Syncing...</span>

            </div>
        </div>
    );

    if (error) {
        return (
            <div className="container mt-5 text-center">
                <div className="glass-card py-5 animate-fade-in mx-auto" style={{ maxWidth: '500px' }}>
                    <i className="bi bi-search fs-1 d-block mb-3 text-info"></i>
                    <h4 className="fw-bold">{error}</h4>
                    <Link to="/" className="btn-premium mt-4 d-inline-block text-decoration-none">Return to Dashboard</Link>

                </div>
            </div>
        );
    }

    return (
        <div className="container pb-5">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="fw-bold mb-1 tracking-tight">Audit Timeline</h2>
                    <p className="text-muted small mb-0">Historical state projection for Vector: {recordId.slice(-12).toUpperCase()}</p>


                </div>
                <Link to="/" className="btn btn-outline-primary btn-sm px-3 text-decoration-none">Go to Dashboard</Link>

            </div>

            {logs.length === 0 ? (
                <div className="glass-card p-5 text-center text-muted">
                    <i className="bi bi-terminal fs-1 mb-3 d-block opacity-25"></i>
                    <p>No telemetry recorded for this vector</p>
                </div>
            ) : (
                <div className="position-relative ps-4 ps-md-5">
                    <div className="position-absolute start-0 h-100 border-start border-light border-opacity-10" style={{ left: '24px' }}></div>

                    {logs.map((log, index) => (
                        <div key={log._id} className="mb-5 position-relative animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            {/* Marker */}
                            <div
                                className="position-absolute rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    left: '-32px',
                                    top: '4px',
                                    background: getActionColor(log.action),
                                    boxShadow: `0 0 15px ${getActionColor(log.action)}44`,
                                    zIndex: 2
                                }}
                            ></div>

                            <div className="glass-card p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 className="fw-bold mb-1">{log.action}</h5>
                                        <small className="text-muted small">
                                            <i className="bi bi-cpu me-2"></i>
                                            {new Date(log.timestamp).toLocaleString([], { dateStyle: 'long', timeStyle: 'medium' })}
                                        </small>
                                    </div>
                                    <span className="badge bg-light text-primary border border-primary border-opacity-10 px-3 py-2 rounded-pill small">
                                        <i className="bi bi-person-fill me-2"></i>
                                        {log.userId?.username || log.source || 'System Core'}



                                    </span>


                                </div>

                                {(log.oldValue || log.newValue) && (
                                    <div className="row g-3">
                                        {log.oldValue && (
                                            <div className="col-md-6">
                                                <div className="p-3 rounded-4 bg-light border border-secondary border-opacity-10 h-100">
                                                    <small className="fw-bold d-block mb-2 text-danger opacity-75 text-uppercase tracking-wider fs-8">Initial Projection</small>



                                                    <pre className="mb-0 small text-dark opacity-75" style={{ whiteSpace: 'pre-wrap' }}>
                                                        {typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue, null, 2) : log.oldValue}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}


                                        {log.newValue && (
                                            <div className="col-md-6">
                                                <div className="p-3 rounded-4 bg-primary bg-opacity-5 border border-primary border-opacity-10 h-100">
                                                    <small className="fw-bold d-block mb-2 text-success opacity-75 text-uppercase tracking-wider fs-8">Calibrated State</small>



                                                    <pre className="mb-0 small text-dark opacity-75" style={{ whiteSpace: 'pre-wrap' }}>
                                                        {typeof log.newValue === 'object' ? JSON.stringify(log.newValue, null, 2) : log.newValue}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AuditTimeline;


