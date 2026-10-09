import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/CitasTaller.css";

const manejarError = (error, operacion) => {
  const status = error.response?.status;
  if (status === 401) return "";
  if ([400, 404, 409].includes(status)) return error.response?.data?.mensaje || "Operación no disponible.";
  if (status === 403) return "No tienes permiso para administrar estas citas.";
  return `No fue posible ${operacion}. Inténtalo nuevamente.`;
};
const mostrarFecha = (valor) => { const fecha = new Date(valor); return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }); };

function CitasTaller() {
  const [talleres, setTalleres] = useState([]); const [tallerId, setTallerId] = useState(""); const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true); const [cargandoCitas, setCargandoCitas] = useState(false); const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [candidatos, setCandidatos] = useState([]); const [consultando, setConsultando] = useState(false); const [asignandoId, setAsignandoId] = useState(null);
  const [actualizandoEstadoId, setActualizandoEstadoId] = useState(null); const [error, setError] = useState(""); const [mensaje, setMensaje] = useState("");
  const cargarCitas = useCallback(async (id) => { setCargandoCitas(true); setError(""); try { const response = await api.get(`/talleres/${id}/citas`); setCitas(Array.isArray(response.data?.citas) ? response.data.citas : []); } catch (requestError) { setCitas([]); setError(manejarError(requestError, "cargar las citas")); } finally { setCargandoCitas(false); } }, []);
  useEffect(() => { const cargar = async () => { try { const response = await api.get("/talleres/mios"); const propios = Array.isArray(response.data) ? response.data : []; setTalleres(propios); if (propios.length) { const primero = String(propios[0].id); setTallerId(primero); await cargarCitas(primero); } } catch (requestError) { setError(manejarError(requestError, "cargar tus talleres")); } finally { setCargando(false); } }; cargar(); }, [cargarCitas]);
  const cambiarTaller = (event) => { const id = event.target.value; setTallerId(id); setCitaSeleccionada(null); setCandidatos([]); setMensaje(""); cargarCitas(id); };
  const consultarCandidatos = async (citaId) => { setCitaSeleccionada(citaId); setCandidatos([]); setError(""); setConsultando(true); try { const response = await api.get(`/talleres/${tallerId}/citas/${citaId}/mecanicos-disponibles`); setCandidatos(Array.isArray(response.data?.mecanicos) ? response.data.mecanicos : []); } catch (requestError) { setError(manejarError(requestError, "consultar mecánicos disponibles")); } finally { setConsultando(false); } };
  const asignar = async (citaId, mecanicoId) => { setAsignandoId(mecanicoId); setError(""); setMensaje(""); try { await api.patch(`/citas/${citaId}/mecanico`, { mecanico_id: mecanicoId }); setMensaje("Mecánico asignado correctamente. La confirmación queda pendiente."); setCitaSeleccionada(null); setCandidatos([]); await cargarCitas(tallerId); } catch (requestError) { setError(manejarError(requestError, "asignar el mecánico")); } finally { setAsignandoId(null); } };
  const actualizarEstado = async (citaId, estado) => { setActualizandoEstadoId(citaId); setError(""); setMensaje(""); try { await api.patch(`/citas/${citaId}/estado`, { estado }); setMensaje(`Cita ${estado} correctamente.`); await cargarCitas(tallerId); } catch (requestError) { setError(manejarError(requestError, "actualizar el estado de la cita")); } finally { setActualizandoEstadoId(null); } };
  const tallerActual = talleres.find((taller) => String(taller.id) === tallerId); const esActiva = (estado) => estado === "pendiente" || estado === "aceptada";

  return <><Navbar /><main className="citas-taller-container"><section className="citas-taller-card">
    <header className="citas-taller-encabezado"><div><p>Panel del taller</p><h1>Citas del taller</h1><span>Administra el recorrido completo de cada servicio.</span></div><Link to="/taller">Volver al panel</Link></header>
    {error && <p className="citas-taller-error" role="alert">{error}</p>}{mensaje && <p className="citas-taller-exito" role="status">{mensaje}</p>}
    {cargando ? <p className="citas-taller-estado">Cargando tus talleres...</p> : talleres.length === 0 ? <div className="citas-taller-estado"><p>No tienes talleres registrados.</p><Link to="/taller/nuevo">Registrar mi taller</Link></div> : <>
      <div className="citas-taller-selector"><label htmlFor="taller-citas">Taller seleccionado</label>{talleres.length > 1 ? <select id="taller-citas" value={tallerId} onChange={cambiarTaller}>{talleres.map((taller) => <option key={taller.id} value={taller.id}>{taller.nombre}</option>)}</select> : <p>{tallerActual?.nombre}</p>}</div>
      {cargandoCitas ? <p className="citas-taller-estado">Cargando citas...</p> : citas.length === 0 ? <p className="citas-taller-estado">Este taller aún no tiene citas.</p> : <div className="citas-taller-lista">{citas.map((cita) => <article className="citas-taller-item" key={cita.cita_id}>
        <div className="citas-taller-item-cabecera"><div><span>Fecha y hora</span><h2>{mostrarFecha(cita.fecha)}</h2></div><span className={`citas-taller-badge estado-${cita.estado}`}>{cita.estado}</span></div>
        <div className="citas-taller-datos"><p><span>Cliente</span><strong>{cita.cliente.nombre}</strong></p><p><span>Vehículo</span><strong>{cita.vehiculo.marca} {cita.vehiculo.modelo}</strong><small>{cita.vehiculo.placas}</small></p><p><span>Servicio</span><strong>{cita.tipo_cita}</strong><small>{cita.duracion_minutos} minutos</small></p><p><span>Mecánico</span><strong>{cita.mecanico?.nombre || "Sin asignar"}</strong></p></div>
        {cita.descripcion_falla && <p className="citas-taller-descripcion"><strong>Descripción:</strong> {cita.descripcion_falla}</p>}
        <p className={`citas-taller-confirmacion ${cita.confirmada_mecanico ? "confirmada" : "pendiente-confirmacion"}`}>{cita.confirmada_mecanico ? "Confirmada por el mecánico" : "Pendiente de confirmación del mecánico"}</p>
        <div className="citas-taller-acciones-estado">{cita.estado === "pendiente" && <button type="button" disabled={actualizandoEstadoId === cita.cita_id} onClick={() => actualizarEstado(cita.cita_id, "aceptada")}>Aceptar cita</button>}{esActiva(cita.estado) && <button type="button" className="cancelar" disabled={actualizandoEstadoId === cita.cita_id} onClick={() => actualizarEstado(cita.cita_id, "cancelada")}>Cancelar</button>}{cita.estado === "aceptada" && <button type="button" disabled={actualizandoEstadoId === cita.cita_id || !cita.mecanico || !cita.confirmada_mecanico} title={!cita.mecanico || !cita.confirmada_mecanico ? "Requiere mecánico asignado y confirmación" : ""} onClick={() => actualizarEstado(cita.cita_id, "finalizada")}>Finalizar cita</button>}</div>
        {esActiva(cita.estado) && <button className="citas-taller-asignar" type="button" onClick={() => consultarCandidatos(cita.cita_id)}>{cita.mecanico ? "Cambiar mecánico" : "Asignar mecánico"}</button>}
        {citaSeleccionada === cita.cita_id && <div className="citas-taller-candidatos"><h3>Mecánicos disponibles</h3>{consultando ? <p>Consultando disponibilidad...</p> : candidatos.length === 0 ? <p>No hay mecánicos disponibles para esta cita.</p> : candidatos.map((mecanico) => <div key={mecanico.id}><span>{mecanico.nombre} · Disponible</span><button type="button" disabled={asignandoId === mecanico.id} onClick={() => asignar(cita.cita_id, mecanico.id)}>{asignandoId === mecanico.id ? "Asignando..." : "Asignar"}</button></div>)}</div>}
      </article>)}</div>}
    </>}
  </section></main></>;
}
export default CitasTaller;
