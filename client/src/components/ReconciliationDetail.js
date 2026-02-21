import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useContext, useCallback } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const ReconciliationDetail = () => {
    const { jobId } = useParams();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    const [selectedResult, setSelectedResult] = useState(null);
    const [correctionAmount, setCorrectionAmount] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [error, setError] = useState(null);

    const fetchResults = useCallback(async () => {
        if (!jobId || jobId === ':jobId') {
            setError('Please select a specific operation from the dashboard.');
            setLoading(false);
            return;
        }

        try {
            const res = await api.get(`/reconcile/${jobId}`);
            setResults(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to synchronize operation results.');
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const handleCorrect = async () => {
        if (isNaN(parseFloat(correctionAmount))) {
            setStatus({ type: 'danger', message: 'Input validation failed: Numeric value required.' });
            return;
        }
        try {
            await api.put(`/reconcile/correct/${selectedResult._id}`, {
                correctionData: { amount: parseFloat(correctionAmount) }
            });
            setStatus({ type: 'success', message: 'Record recalibrated successfully.' });
            setSelectedResult(null);
            fetchResults();
        } catch (err) {
            console.error(err);
            setStatus({ type: 'danger', message: 'Recalibration sequence failed.' });
        }
    };

    const getBadgeColor = (status) => {
        switch (status) {
            case 'Matched': return 'bg-success bg-opacity-10 text-success border-success border-opacity-20';
            case 'Partially Matched': return 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-20';
            case 'Not Matched': return 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-20';
            case 'Duplicate': return 'bg-info bg-opacity-10 text-info border-info border-opacity-20';
            default: return 'bg-light bg-opacity-10 text-white border-white border-opacity-10';
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
                    <i className="bi bi-shield-exclamation fs-1 d-block mb-3 text-warning"></i>
                    <h4 className="fw-bold">{error}</h4>
                    <Link to="/" className="btn-premium mt-4 d-inline-block text-decoration-none">Return to Dashboard</Link>

                </div>
            </div>
        );
    }

    return (
        <div className="container pb-5">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
                <div>
                    <h2 className="fw-bold mb-1 tracking-tight">Discrepancy Analysis</h2>
                    <p className="text-muted small mb-0">Granular view of transaction alignment and variances</p>
                </div>
                <div className="d-flex gap-2">
                    <Link to="/reconcile" className="btn btn-outline-primary btn-sm px-3 text-decoration-none d-flex align-items-center">
                        <i className="bi bi-arrow-left me-2"></i> History
                    </Link>
                    <Link to="/" className="btn btn-primary btn-sm px-4 text-decoration-none">Dashboard</Link>
                </div>
            </div>

            {status.message && (
                <div className={`alert alert-${status.type} border-0 rounded-3 small mb-4 animate-fade-in`}>
                    <i className={`bi bi-${status.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                    {status.message}
                </div>
            )}

            <div className="glass-card animate-fade-in">
                <div className="table-responsive">
                    <table className="table table-custom mb-0">
                        <thead>
                            <tr>
                                <th className="px-4 py-3">Vector Status</th>
                                <th className="px-4 py-3">Ref Identifier</th>
                                <th className="px-4 py-3 text-center">Values (Uploaded | System)</th>
                                <th className="px-4 py-3">Variances</th>
                                <th className="px-4 py-3 text-end">Operations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(r => (
                                <tr key={r._id}>
                                    <td className="px-4 py-3">
                                        <span className={`badge border ${getBadgeColor(r.matchStatus)} rounded-pill px-3`} style={{ fontSize: '0.65rem' }}>
                                            {r.matchStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="fw-medium small text-truncate" style={{ maxWidth: '120px' }} title={r.recordId?.referenceNumber}>
                                            {r.recordId?.referenceNumber}
                                        </div>
                                        <div className="text-muted opacity-50" style={{ fontSize: '0.6rem' }}>TX: {r.recordId?.transactionId}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                            <span className={`fw-bold ${r.mismatches?.some(m => m.field === 'amount') ? 'text-danger' : 'opacity-75'}`}>
                                                ${r.recordId?.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="opacity-25 fs-7">|</span>
                                            <span className="text-success fw-bold">
                                                ${r.systemRecordId?.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {r.mismatches?.map((m, i) => (
                                            <div key={i} className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-10 small fw-normal">
                                                {m.variance ? `Δ ${m.variance}` : m.field}
                                            </div>
                                        ))}
                                        {r.matchStatus === 'Duplicate' && <span className="text-muted small italic">Redundant Vector</span>}
                                        {r.matchStatus === 'Matched' && <i className="bi bi-check-all text-success opacity-50 fs-5"></i>}
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            {user?.role === 'Admin' && (
                                                <Link to={`/audit-detail/${r.recordId?._id}`} className="btn btn-sm btn-outline-primary" title="Audit Timeline">
                                                    <i className="bi bi-activity"></i>
                                                </Link>
                                            )}
                                            {r.matchStatus !== 'Matched' && (user?.role === 'Admin' || user?.role === 'Analyst') && (
                                                <button
                                                    className="btn btn-sm btn-outline-primary border-opacity-20"
                                                    onClick={() => {
                                                        setSelectedResult(r);
                                                        setCorrectionAmount(r.systemRecordId?.amount || r.recordId?.amount);
                                                        setStatus({ type: '', message: '' });
                                                    }}
                                                >
                                                    Fix
                                                </button>
                                            )}

                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedResult && (
                <div className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="glass-card animate-fade-in w-100" style={{ maxWidth: '450px' }}>
                        <div className="px-4 py-3 border-bottom border-light border-opacity-10 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0">Record Correction</h5>
                            <button className="btn-close opacity-50" onClick={() => setSelectedResult(null)}></button>

                        </div>



                        <div className="p-4">
                            <div className="row g-2 mb-4">
                                <div className="col-6">
                                    <div className="p-2 rounded bg-light text-center border">
                                        <small className="text-muted d-block small mb-1">Source Value</small>
                                        <span className="text-danger fw-bold fs-5">${selectedResult.recordId?.amount?.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-2 rounded bg-light text-center border border-success border-opacity-20">
                                        <small className="text-muted d-block small mb-1">Target Match</small>
                                        <span className="text-success fw-bold fs-5">${selectedResult.systemRecordId?.amount?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label small fw-bold text-muted text-uppercase tracking-wider">Correct Amount</label>


                                <input
                                    type="number"
                                    className="form-control"
                                    value={correctionAmount}
                                    onChange={(e) => setCorrectionAmount(e.target.value)}
                                />

                            </div>

                            <div className="d-flex gap-2">
                                <button className="btn btn-outline-secondary flex-grow-1" onClick={() => setSelectedResult(null)}>Cancel</button>
                                <button className="btn-premium flex-grow-1" onClick={handleCorrect}>Update</button>
                            </div>


                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReconciliationDetail;

