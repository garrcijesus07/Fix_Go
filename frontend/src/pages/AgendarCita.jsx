import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/AgendarCita.css";

const duracionesPorTipo = {
  diagnostico: 60,
  reparacion: 120,
};

const fechaLocalActual = () => {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

const horaDelSlot = (inicio) => {
  const coincidencia = inicio.match(/[T ](\d{2}:\d{2})/);
  return coincidencia ? coincidencia[1] : inicio;
};

function AgendarCita() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tallerId = Number(id);
  const [vehiculos, setVehiculos] = useState([]);
  const [taller, setTaller] = useState(null);
  const [vehiculoId, setVehiculoId] = useState("");
  const [tipoCita, setTipoCita] = useState("");
  const [descripcionFalla, setDescripcionFalla] = useState("");
  const [fecha, setFecha] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState("");
  const [disponibilidadConsultada, setDisponibilidadConsultada] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [errorDisponibilidad, setErrorDisponibilidad] = useState("");
  const solicitudDisponibilidad = useRef(0);

  useEffect(() => {
    const cargarVehiculos = async () => {
      try {
        const [respuestaVehiculos, respuestaTaller] = await Promise.all([
          api.get("/vehiculos"),
          api.get(`/talleres/${tallerId}`),
        ]);
        setVehiculos(respuestaVehiculos.data);
        setTaller(respuestaTaller.data);
      } catch (requestError) {
        if (requestError.response?.status !== 401) {
          setError("No fue posible cargar tus vehículos.");
        }
      } finally {
        setCargando(false);
      }
    };

    cargarVehiculos();
  }, [tallerId]);

  const cargarDisponibilidad = useCallback(async (
    fechaConsulta = fecha,
    tipoConsulta = tipoCita,
  ) => {
    if (!Number.isInteger(tallerId) || tallerId <= 0 || !fechaConsulta || !tipoConsulta) {
      return;
    }

    const solicitudId = ++solicitudDisponibilidad.current;
    setCargandoDisponibilidad(true);
    setDisponibilidadConsultada(false);
    setErrorDisponibilidad("");

    try {
      const response = await api.get("/citas/disponibilidad", {
        params: {
          taller_id: tallerId,
          fecha: fechaConsulta,
          tipo_cita: tipoConsulta,
        },
      });

      if (solicitudId !== solicitudDisponibilidad.current) {
        return;
      }

      setSlots(Array.isArray(response.data?.slots) ? response.data.slots : []);
      setDisponibilidadConsultada(true);
    } catch (requestError) {
      if (solicitudId !== solicitudDisponibilidad.current) {
        return;
      }

      setSlots([]);
      setDisponibilidadConsultada(true);
      const status = requestError.response?.status;

      if (status === 401) {
        return;
      }

      if (status === 400) {
        setErrorDisponibilidad(
          requestError.response?.data?.mensaje || "No fue posible consultar esa fecha.",
        );
      } else if (status === 404) {
        setErrorDisponibilidad("El taller seleccionado no existe.");
      } else if (status === 403) {
        setErrorDisponibilidad("No tienes permiso para consultar la disponibilidad.");
      } else {
        setErrorDisponibilidad("No fue posible consultar los horarios disponibles.");
      }
    } finally {
      if (solicitudId === solicitudDisponibilidad.current) {
        setCargandoDisponibilidad(false);
      }
    }
  }, [fecha, tallerId, tipoCita]);

  const limpiarDisponibilidad = () => {
    solicitudDisponibilidad.current += 1;
    setSlotSeleccionado("");
    setSlots([]);
    setDisponibilidadConsultada(false);
    setErrorDisponibilidad("");
    setCargandoDisponibilidad(false);
  };

  const manejarCambioTipo = (event) => {
    const nuevoTipo = event.target.value;
    limpiarDisponibilidad();
    setTipoCita(nuevoTipo);

    if (fecha && nuevoTipo) {
      cargarDisponibilidad(fecha, nuevoTipo);
    }
  };

  const manejarCambioFecha = (event) => {
    const nuevaFecha = event.target.value;
    limpiarDisponibilidad();
    setFecha(nuevaFecha);

    if (nuevaFecha && tipoCita) {
      cargarDisponibilidad(nuevaFecha, tipoCita);
    }
  };

  const descripcionNormalizada = descripcionFalla.trim();
  const descripcionRequeridaInvalida =
    tipoCita === "reparacion" && !descripcionNormalizada;
  const formularioInvalido =
    !vehiculoId ||
    !tipoCita ||
    !fecha ||
    !slotSeleccionado ||
    descripcionRequeridaInvalida ||
    enviando;

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setError("");

    if (formularioInvalido) {
      setError("Completa los datos requeridos y selecciona un horario disponible.");
      return;
    }

    if (descripcionNormalizada.length > 2000) {
      setError("La descripción de la falla no puede exceder 2000 caracteres.");
      return;
    }

    setEnviando(true);

    try {
      await api.post("/citas", {
        vehiculo_id: Number(vehiculoId),
        taller_id: tallerId,
        fecha: slotSeleccionado,
        tipo_cita: tipoCita,
        descripcion_falla: descripcionNormalizada,
      });

      window.alert("Cita creada correctamente.");
      navigate("/cliente/citas");
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 401) {
        return;
      }

      if (status === 409) {
        setSlotSeleccionado("");
        await cargarDisponibilidad(fecha, tipoCita);
        setError("Ese horario ya no está disponible. Selecciona otro.");
      } else if (status === 400) {
        setError(requestError.response?.data?.mensaje || "Los datos de la cita no son válidos.");
      } else if (status === 404) {
        setError("El taller o el vehículo ya no está disponible.");
      } else if (status === 403) {
        setError("No tienes permiso para agendar esta cita.");
      } else {
        setError("No fue posible crear la cita. Inténtalo nuevamente.");
      }
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return <div className="agendar-cita-estado">Cargando vehículos...</div>;
  }

  return (
    <><Navbar /><div className="agendar-cita-container">
      <div className="agendar-cita-card">
        <header className="agendar-cita-encabezado">
          <p>Reserva de servicio</p><h1>{taller?.nombre || "Agendar cita"}</h1>
          <span>{taller?.direccion || "Selecciona los detalles de tu próxima visita."}</span>
        </header>

        {error && <p className="agendar-cita-error" role="alert">{error}</p>}

        {vehiculos.length === 0 ? (
          <div className="agendar-cita-sin-vehiculos">
            <p>Necesitas registrar un vehículo antes de agendar una cita.</p>
            <Link to="/cliente/vehiculos/nuevo">Registrar vehículo</Link>
          </div>
        ) : (
          <form className="agendar-cita-form" onSubmit={manejarEnvio}>
            <label htmlFor="vehiculo">Vehículo</label>
            <select
              id="vehiculo"
              value={vehiculoId}
              onChange={(event) => setVehiculoId(event.target.value)}
              required
            >
              <option value="">Selecciona un vehículo</option>
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.id} value={vehiculo.id}>
                  {vehiculo.marca} {vehiculo.modelo} — {vehiculo.placas}
                </option>
              ))}
            </select>

            <label htmlFor="tipo-cita">Tipo de cita</label>
            <select
              id="tipo-cita"
              value={tipoCita}
              onChange={manejarCambioTipo}
              required
            >
              <option value="">Selecciona el tipo de cita</option>
              <option value="diagnostico">Diagnóstico</option>
              <option value="reparacion">Reparación</option>
            </select>

            {tipoCita && (
              <p className="agendar-cita-duracion">
                Duración estimada: {duracionesPorTipo[tipoCita]} minutos
              </p>
            )}

            <label htmlFor="descripcion-falla">
              Descripción de la falla {tipoCita === "reparacion" ? "(obligatoria)" : "(opcional)"}
            </label>
            <textarea
              id="descripcion-falla"
              value={descripcionFalla}
              onChange={(event) => setDescripcionFalla(event.target.value)}
              maxLength={2000}
              required={tipoCita === "reparacion"}
              rows={4}
              placeholder="Describe brevemente la falla del vehículo"
            />
            <span className="agendar-cita-contador">
              {descripcionFalla.length}/2000
            </span>

            <label htmlFor="fecha">Fecha</label>
            <input
              id="fecha"
              type="date"
              min={fechaLocalActual()}
              value={fecha}
              onChange={manejarCambioFecha}
              required
            />

            <fieldset className="agendar-cita-slots" disabled={cargandoDisponibilidad}>
              <legend>Hora disponible</legend>

              {cargandoDisponibilidad && (
                <p className="agendar-cita-informacion">Consultando horarios...</p>
              )}

              {!cargandoDisponibilidad && errorDisponibilidad && (
                <p className="agendar-cita-error" role="alert">{errorDisponibilidad}</p>
              )}

              {!cargandoDisponibilidad &&
                disponibilidadConsultada &&
                !errorDisponibilidad &&
                slots.length === 0 && (
                  <p className="agendar-cita-informacion">
                    No hay horarios disponibles para esta fecha.
                  </p>
                )}

              {!cargandoDisponibilidad && slots.length > 0 && (
                <div className="agendar-cita-slots-grid">
                  {slots.map((slot) => (
                    <label
                      className={`agendar-cita-slot ${
                        slotSeleccionado === slot.inicio ? "agendar-cita-slot-seleccionado" : ""
                      }`}
                      key={slot.inicio}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={slot.inicio}
                        checked={slotSeleccionado === slot.inicio}
                        onChange={() => setSlotSeleccionado(slot.inicio)}
                      />
                      <span>{horaDelSlot(slot.inicio)}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <button type="submit" disabled={formularioInvalido}>
              {enviando ? "Agendando..." : "Confirmar cita"}
            </button>
          </form>
        )}

        <Link className="agendar-cita-volver" to={`/cliente/taller/${id}`}>
          Volver al taller
        </Link>
      </div>
    </div></>
  );
}

export default AgendarCita;
