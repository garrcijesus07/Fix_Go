import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../styles/Navbar.css";

function Navbar() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const cerrarSesion = () => {
        logout();
        navigate("/", { replace: true });
    };

    return (
        <button
            type="button"
            className="logout-btn"
            onClick={cerrarSesion}
        >
            Cerrar sesión
        </button>
    );
}

export default Navbar;
