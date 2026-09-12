import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const rutasPorRol = {
    administrador: "/admin",
    taller: "/taller",
    mecanico: "/mecanico",
    cliente: "/cliente"
};

function ProtectedRoute({ rolesPermitidos }) {
    const { autenticado, rol } = useAuth();
    const location = useLocation();

    if (!autenticado) {
        return <Navigate to="/" replace state={{ desde: location.pathname }} />;
    }

    if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
        return <Navigate to={rutasPorRol[rol] || "/"} replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
