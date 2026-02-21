import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const { user, token } = useContext(AuthContext);
    const location = useLocation();

    // If no token, redirect to login
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user data is still loading (from useEffect in AuthContext), show a loader or null
    // But usually user role is parsed quickly from token
    if (!user) {
        return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
    }

    // If role is not allowed, redirect to dashboard (or a dedicated 403 page)
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleProtectedRoute;
