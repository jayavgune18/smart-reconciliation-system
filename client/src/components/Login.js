import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Analyst');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        setLoading(true);

        try {
            if (isLogin) {
                await login(username, password);
                navigate('/');
            } else {
                await api.post('/auth/register', { username, password, role });
                setStatus({ type: 'success', message: 'Identity Created. You may now authenticate.' });
                setIsLogin(true);
                setPassword('');
            }
        } catch (err) {
            setStatus({ type: 'danger', message: err.response?.data?.error || 'Authentication failure. Check credentials.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5 pt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5 col-xl-4">
                    <div className="glass-card p-5 animate-fade-in shadow-lg">
                        <div className="text-center mb-5">
                            <div className="bg-primary bg-opacity-20 rounded-circle p-4 d-inline-flex mb-4 shadow-lg border border-primary border-opacity-20">
                                <i className="bi bi-shield-lock-fill text-primary-light fs-1"></i>
                            </div>
                            <h3 className="fw-bold text-gradient mb-2">{isLogin ? 'Welcome Back' : 'Create Identity'}</h3>
                            <p className="text-muted small">Access the reconciliation intelligence suite</p>
                        </div>
                        {status.message && (
                            <div className={`alert alert-${status.type} border-0 small py-3 mb-4 animate-fade-in`}>
                                <i className={`bi bi-${status.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2`}></i>
                                {status.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="form-label small fw-bold text-muted text-uppercase tracking-widest mb-2">Username</label>

                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-end-0 text-muted border-white border-opacity-10 py-3">
                                        <i className="bi bi-person-fill"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 ps-0 border-white border-opacity-10"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        placeholder="Administrator / User"
                                    />
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="form-label small fw-bold text-muted text-uppercase tracking-widest mb-2">Access Token</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-end-0 text-muted border-white border-opacity-10 py-3">
                                        <i className="bi bi-key-fill"></i>
                                    </span>
                                    <input
                                        type="password"
                                        className="form-control border-start-0 ps-0 border-white border-opacity-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {!isLogin && (
                                <div className="mb-5 animate-fade-in">
                                    <label className="form-label small fw-bold text-muted text-uppercase tracking-widest mb-2">Privilege Level</label>
                                    <select
                                        className="form-select border-white border-opacity-10 py-3"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Analyst">Analyst</option>
                                        <option value="Viewer">Viewer</option>
                                    </select>
                                </div>
                            )}

                            <button type="submit" className="btn-premium w-100 py-3 mb-4" disabled={loading}>
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Authenticating...</>
                                ) : (
                                    isLogin ? 'Enter Workspace' : 'Initialize Profile'
                                )}
                            </button>
                        </form>

                        <div className="text-center">
                            <button
                                className="btn btn-link text-muted small text-decoration-none opacity-50 hover-opacity-100"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setStatus({ type: '', message: '' });
                                }}
                            >
                                {isLogin ? "Need access? Request Credentials" : "Back to Security Gateway"}
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-muted small mt-5 opacity-25">
                        &copy; 2024 Smart Reconciliation Systems v1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

