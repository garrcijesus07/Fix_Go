import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/AgendarCita.css";

function AgendarCita() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculoId, setVehiculoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarVehiculos = async () => {
      try {
        const response = await api.get("/vehiculos");
        setVehiculos(response.data);
      } catch (requestError) {
        if (requestError.response?.status !== 401) {
          setError("No fue posible cargar tus vehículos.");
        }
      } finally {
        setCargando(false);
      }
    };

    cargarVehiculos();
  }, []);

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setError("");

    if (!vehiculoId || !fecha) {
      setError("Selecciona un vehículo, una fecha y una hora.");
      return;
    }

    const fechaSeleccionada = new Date(fecha);
    if (Number.isNaN(fechaSeleccionada.getTime()) || fechaSeleccionada <= new Date()) {
      setError("La fecha y hora deben ser futuras.");
      return;
    }

    setEnviando(true);

    try {
      await api.post("/citas", {
        vehiculo_id: Number(vehiculoId),
        taller_id: Number(id),
        fecha,
      });

      window.alert("Cita creada correctamente.");
      navigate("/cliente/citas");
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 401) {
        return;
      }

      if (status === 409) {
        setError("El horario seleccionado ya tiene un conflicto.");
      } else if (status === 403) {
        setError("No tienes permiso para agendar esta cita.");
      } else if (status === 400 || status === 404) {
        setError(requestError.response?.data?.mensaje || "No fue posible crear la cita.");
      } else {
        setError("Ocurrió un error al crear la cita. Inténtalo nuevamente.");
      }
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return <div className="agendar-cita-estado">Cargando vehículos...</div>;
  }

  return (
    <div className="agendar-cita-container">
      <div className="agendar-cita-card">
        <h1>Agendar Cita</h1>

        {error && <p className="agendar-cita-error">{error}</p>}

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

            <label htmlFor="fecha">Fecha y hora</label>
            <input
              id="fecha"
              type="datetime-local"
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              required
            />

            <button type="submit" disabled={enviando}>
              {enviando ? "Agendando..." : "Confirmar cita"}
            </button>
          </form>
        )}

        <Link className="agendar-cita-volver" to={`/cliente/taller/${id}`}>
          Volver al taller
        </Link>
      </div>
    </div>
  );
}

export default AgendarCita;
