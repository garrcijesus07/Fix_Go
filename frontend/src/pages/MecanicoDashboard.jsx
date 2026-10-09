import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/MecanicoDashboard.css";

const mensajeError = (error, operacion) => {
  const status = error.response?.status;
  if (status === 401) return "";
  if ([400, 404, 409].includes(status)) return error.response?.data?.mensaje || "La operación no está disponible.";
  if (status === 403) return "No tienes permiso para realizar esta operación.";
  return `No fue posible ${operacion}. Inténtalo nuevamente.`;
};
const fechaPartes = (valor) => {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return { fecha: valor, hora: "" };
  return { fecha: fecha.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" }), hora: fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) };
};

export default function MecanicoDashboard() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const cargarCitas = useCallback(async () => {
    setError("");
    try { const response = await api.get("/mecanicos/citas/mias"); setCitas(Array.isArray(response.data) ? response.data : []); }
    catch (requestError) { setCitas([]); setError(mensajeError(requestError, "cargar tus citas")); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { const iniciar = async () => cargarCitas(); iniciar(); }, [cargarCitas]);
  const confirmar = async (citaId) => {
    setConfirmandoId(citaId); setError(""); setMensaje("");
    try {
      const response = await api.patch(`/citas/${citaId}/confirmar-mecanico`);
      setCitas((actuales) => actuales.map((cita) => cita.id === citaId ? { ...cita, confirmada_mecanico: true, fecha_confirmacion_mecanico: response.data.cita.fecha_confirmacion_mecanico } : cita));
      setMensaje("Cita confirmada correctamente.");
    } catch (requestError) { setError(mensajeError(requestError, "confirmar la cita")); }
    finally { setConfirmandoId(null); }
  };
  const resumen = useMemo(() => ({
    pendientes: citas.filter((cita) => cita.estado === "aceptada" && !cita.confirmada_mecanico).length,
    confirmadas: citas.filter((cita) => cita.confirmada_mecanico && cita.estado === "aceptada").length,
    hoy: citas.filter((cita) => new Date(cita.fecha).toDateString() === new Date().toDateString()).length,
  }), [citas]);
  return <><Navbar /><main className="mecanico-dashboard-container">
    <section className="mecanico-dashboard-hero"><p>Panel del mecánico</p><h1>Hola, estas son tus citas</h1><span>Revisa los servicios asignados y confirma cuando estés listo.</span></section>
    <section className="mecanico-dashboard-card">
      <div className="mecanico-dashboard-resumen">
        <article><span>Pendientes</span><strong>{resumen.pendientes}</strong><small>Por confirmar</small></article>
        <article><span>Confirmadas</span><strong>{resumen.confirmadas}</strong><small>En agenda</small></article>
        <article><span>Hoy</span><strong>{resumen.hoy}</strong><small>Citas del día</small></article>
      </div>
      {error && <p className="mecanico-dashboard-error" role="alert">{error}</p>}
      {mensaje && <p className="mecanico-dashboard-exito" role="status">{mensaje}</p>}
      <header className="mecanico-dashboard-titulo"><div><p>Agenda de trabajo</p><h2>Mis citas asignadas</h2></div><span>{citas.length} total</span></header>
      {cargando ? <p className="mecanico-dashboard-estado">Cargando citas...</p> : citas.length === 0 ? <p className="mecanico-dashboard-estado">No tienes citas asignadas.</p> :
        <div className="mecanico-dashboard-lista">{citas.map((cita) => { const momento = fechaPartes(cita.fecha); return <article key={cita.id}>
          <div className="mecanico-cita-fecha"><strong>{momento.hora}</strong><span>{momento.fecha}</span></div>
          <div className="mecanico-cita-contenido"><div className="mecanico-cita-titulo"><h3>{cita.vehiculo.marca} {cita.vehiculo.modelo}</h3><span className={`mecanico-badge ${cita.confirmada_mecanico ? "confirmada" : "pendiente"}`}>{cita.confirmada_mecanico ? "Confirmada" : "Por confirmar"}</span></div>
            <p><strong>Taller:</strong> {cita.taller.nombre}</p><p><strong>Cliente:</strong> {cita.cliente.nombre}</p><p><strong>Placas:</strong> {cita.vehiculo.placas}</p><p><strong>Servicio:</strong> {cita.tipo_cita} · {cita.duracion_minutos} minutos</p>
            {cita.descripcion_falla && <p className="mecanico-cita-descripcion">{cita.descripcion_falla}</p>}
            <div className="mecanico-cita-pie"><span>Estado general: <strong>{cita.estado}</strong></span>{cita.estado === "aceptada" && !cita.confirmada_mecanico && <button type="button" onClick={() => confirmar(cita.id)} disabled={confirmandoId === cita.id}>{confirmandoId === cita.id ? "Confirmando..." : "Confirmar cita"}</button>}</div>
          </div>
        </article>; })}</div>}
    </section>
  </main></>;
}
