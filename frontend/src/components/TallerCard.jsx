import { Link } from "react-router-dom";
import "../styles/TallerCard.css";

function TallerCard({ taller }) {
    return <article className="taller-card">
        <div className="taller-card-imagen" style={taller.imagen ? { backgroundImage: `url(${taller.imagen})` } : undefined}>
            {!taller.imagen && <span aria-hidden="true">FG</span>}
            <small>Servicio automotriz</small>
        </div>
        <div className="taller-card-contenido">
            <div className="taller-card-titulo"><h3>{taller.nombre}</h3></div>
            <div className="taller-card-categorias">{(taller.categorias || []).map((categoria) => <span key={categoria.id}>{categoria.nombre}</span>)}</div>
            <p className="taller-card-descripcion">{taller.descripcion || "Consulta información, horarios y disponibilidad del taller."}</p>
            {taller.direccion && <p className="taller-card-dato"><span aria-hidden="true">⌖</span>{taller.direccion}</p>}
            {taller.telefono && <p className="taller-card-dato"><span aria-hidden="true">◦</span>{taller.telefono}</p>}
            <div className="taller-card-acciones">
                <Link className="taller-card-secundario" to={`/cliente/taller/${taller.id}`}>Ver taller</Link>
                <Link className="taller-card-btn" to={`/cliente/taller/${taller.id}/agendar`}>Agendar cita</Link>
            </div>
        </div>
    </article>;
}

export default TallerCard;
