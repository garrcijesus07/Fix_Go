import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "../styles/TallerDashboard.css";

const accesos = [
    { ruta: "/taller/citas", icono: "▣", titulo: "Citas", texto: "Acepta, asigna y consulta el estado de cada servicio." },
    { ruta: "/taller/mecanicos", icono: "◎", titulo: "Mecánicos", texto: "Administra tu equipo y sus horarios individuales." },
    { ruta: "/taller/horarios", icono: "◷", titulo: "Horarios", texto: "Configura la disponibilidad semanal de tus talleres." },
    { ruta: "/taller/nuevo", icono: "+", titulo: "Registrar taller", texto: "Agrega otro establecimiento a tu cuenta." },
];

export default function TallerDashboard() {
    return <><Navbar /><main className="taller-dashboard-container">
        <section className="taller-dashboard-hero">
            <div><p>Panel del taller</p><h1>Todo tu taller, en un solo lugar</h1><span>Gestiona citas, personal y disponibilidad con una vista clara.</span></div>
            <div className="taller-dashboard-emblema" aria-hidden="true">FG</div>
        </section>
        <section className="taller-dashboard-contenido">
            <header><div><p>Accesos rápidos</p><h2>¿Qué quieres administrar?</h2></div></header>
            <div className="taller-dashboard-acciones">
                {accesos.map((acceso) => <Link key={acceso.ruta} to={acceso.ruta}>
                    <span className="taller-dashboard-icono" aria-hidden="true">{acceso.icono}</span>
                    <div><h3>{acceso.titulo}</h3><p>{acceso.texto}</p></div><strong aria-hidden="true">›</strong>
                </Link>)}
            </div>
        </section>
    </main></>;
}
