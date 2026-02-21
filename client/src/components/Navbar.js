import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    if (!user) return null;

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar navbar-expand-lg navbar-dark navbar-custom sticky-top mb-4">
            <div className="container">
                <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
                    <div className="bg-primary rounded-3 p-1 me-2 d-flex align-items-center justify-content-center shadow-lg" style={{ width: '36px', height: '36px' }}>
                        <i className="bi bi-lightning-charge-fill text-white fs-5"></i>
                    </div>
                    <span className="tracking-tight text-white">Smart Reconciliation</span>
                </Link>
                <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item mx-lg-1">
                            <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/">Dashboard</Link>
                        </li>
                        {(user.role === 'Admin' || user.role === 'Analyst') && (
                            <>
                                <li className="nav-item mx-lg-1">
                                    <Link className={`nav-link ${isActive('/upload') ? 'active' : ''}`} to="/upload">Upload</Link>
                                </li>
                                <li className="nav-item mx-lg-1">
                                    <Link className={`nav-link ${isActive('/reconcile') ? 'active' : ''}`} to="/reconcile">Reconciliation</Link>
                                </li>
                            </>
                        )}
                        {user.role === 'Admin' && (
                            <li className="nav-item mx-lg-1">
                                <Link className={`nav-link ${isActive('/audit') ? 'active' : ''}`} to="/audit">Audit Logs</Link>
                            </li>
                        )}
                    </ul>
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-none d-md-flex align-items-center px-3 py-1 rounded-pill bg-white bg-opacity-5 border border-white border-opacity-10">
                            <div className="bg-success rounded-circle me-2 animate-pulse" style={{ width: '8px', height: '8px', boxShadow: '0 0 8px #10b981' }}></div>
                            <span className="small text-muted fw-medium">{user.role}</span>
                        </div>
                        <button className="btn-premium py-2 px-4 fs-7" onClick={logout}>
                            <i className="bi bi-box-arrow-right me-2"></i> Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

