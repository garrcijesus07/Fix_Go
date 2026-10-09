import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../styles/Navbar.css";

function Navbar() {
    const navigate = useNavigate();
    const { logout, rol } = useAuth();
    const enlaces = {
        cliente: [
            ["/cliente", "Inicio", "⌂"],
            ["/cliente/vehiculos", "Vehículos", "▱"],
            ["/cliente/citas", "Mis citas", "▣"],
            ["/cliente/perfil", "Perfil", "○"],
        ],
        taller: [
            ["/taller", "Inicio", "⌂"],
            ["/taller/citas", "Citas", "▣"],
            ["/taller/mecanicos", "Mecánicos", "◎"],
            ["/taller/horarios", "Horarios", "◷"],
        ],
        mecanico: [["/mecanico", "Mis citas", "▣"]],
        administrador: [
            ["/admin", "Inicio", "⌂"],
            ["/admin/categorias", "Categorías", "◇"],
        ],
    }[rol] || [];

    const cerrarSesion = () => {
        logout();
        navigate("/", { replace: true });
    };

    return <header className="app-navbar">
        <div className="app-navbar-inner">
            <NavLink className="app-brand" to={enlaces[0]?.[0] || "/"}>
                <span className="app-brand-mark" aria-hidden="true">FG</span>
                <span>Fix_<strong>Go</strong></span>
            </NavLink>
            <nav className="app-nav-links" aria-label="Navegación principal">
                {enlaces.map(([ruta, etiqueta, icono]) => (
                    <NavLink key={ruta} to={ruta} end={ruta === enlaces[0]?.[0]} className={({ isActive }) => isActive ? "activo" : ""}>
                        <span aria-hidden="true">{icono}</span><span>{etiqueta}</span>
                    </NavLink>
                ))}
            </nav>
            <button type="button" className="logout-btn" onClick={cerrarSesion}>
                <span aria-hidden="true">↪</span><span>Salir</span>
            </button>
        </div>
    </header>;
}

export default Navbar;
