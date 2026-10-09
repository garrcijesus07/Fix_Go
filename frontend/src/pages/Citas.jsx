import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/Citas.css";

const estadoVisual = (cita) => {
  if (cita.estado === "cancelada") return { clave: "cancelada", etiqueta: "Cancelada" };
  if (cita.estado === "finalizada") return { clave: "finalizada", etiqueta: "Finalizada" };
  if (cita.estado === "pendiente") return { clave: "pendiente", etiqueta: "Pendiente" };
  if (cita.estado === "aceptada" && cita.confirmada_mecanico) return { clave: "confirmada", etiqueta: "Confirmada" };
  if (cita.estado === "aceptada") return { clave: "aceptada", etiqueta: "Aceptada - pendiente de confirmación" };
  return { clave: "pendiente", etiqueta: cita.estado };
};
const formatearFecha = (valor) => { const fecha = new Date(valor); if (Number.isNaN(fecha.getTime())) return { fecha: "Fecha no disponible", hora: "" }; return { fecha: fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }), hora: fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) }; };

function Citas() {
  const [citas, setCitas] = useState([]); const [cargando, setCargando] = useState(true); const [error, setError] = useState("");
  useEffect(() => { const cargarCitas = async () => { try { const response = await api.get("/citas/mias"); setCitas(response.data); } catch (requestError) { const status = requestError.response?.status; if (status === 401) return; setError(status === 403 ? "No tienes permiso para consultar estas citas." : "No fue posible cargar tus citas. Inténtalo nuevamente."); } finally { setCargando(false); } }; cargarCitas(); }, []);
  return <><Navbar /><main className="citas-container"><header className="citas-header"><p>Tu agenda</p><h1>Mis citas</h1><span>Consulta rápidamente el progreso de tus servicios.</span></header>
    {cargando ? <p className="citas-estado-pagina">Cargando citas...</p> : error ? <p className="citas-error">{error}</p> : citas.length === 0 ? <p className="citas-vacias">No tienes citas registradas.</p> :
      <div className="citas-grid">{citas.map((cita) => { const momento = formatearFecha(cita.fecha); const visual = estadoVisual(cita); return <article className="cita-card" key={cita.id}>
        <div className="cita-card-cabecera"><div><span>Taller</span><h2>{cita.taller_nombre}</h2></div><strong className={`cita-estado cita-estado-${visual.clave}`}>{visual.etiqueta}</strong></div>
        <div className="cita-card-datos"><p><span>Vehículo</span><strong>{cita.marca} {cita.modelo}</strong><small>{cita.placas}</small></p><p><span>Fecha</span><strong>{momento.fecha}</strong><small>{momento.hora}</small></p></div>
      </article>; })}</div>}
  </main></>;
}
export default Citas;
