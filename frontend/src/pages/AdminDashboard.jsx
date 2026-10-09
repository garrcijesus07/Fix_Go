import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
    return <>
        <Navbar />
        <main className="admin-dashboard">
            <header className="admin-dashboard-hero">
                <p>Administración</p>
                <h1>Panel de Administrador</h1>
                <span>Gestiona la configuración general de Fix_Go</span>
            </header>
            <section className="admin-dashboard-grid" aria-label="Módulos administrativos">
                <Link className="admin-module-card admin-module-card--active" to="/admin/categorias">
                    <span className="admin-module-icon" aria-hidden="true">◇</span>
                    <div><span className="admin-module-status">Disponible</span><h2>Categorías</h2><p>Administra el catálogo que utilizan talleres y clientes.</p></div>
                    <strong>Gestionar →</strong>
                </Link>
                <article className="admin-module-card admin-module-card--pending">
                    <span className="admin-module-icon" aria-hidden="true">▦</span>
                    <div><span className="admin-module-status">Próximamente</span><h2>Talleres</h2><p>La gestión administrativa aún no cuenta con soporte backend.</p></div>
                </article>
                <article className="admin-module-card admin-module-card--pending">
                    <span className="admin-module-icon" aria-hidden="true">◎</span>
                    <div><span className="admin-module-status">Próximamente</span><h2>Usuarios</h2><p>La gestión administrativa aún no cuenta con soporte backend.</p></div>
                </article>
            </section>
        </main>
    </>;
}
