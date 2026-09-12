import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Citas.css";

const etiquetasEstado = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  cancelada: "Cancelada",
  finalizada: "Finalizada",
};

const formatearFecha = (valor) => {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return { fecha: "Fecha no disponible", hora: "" };
  }

  return {
    fecha: fecha.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    hora: fecha.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

function Citas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarCitas = async () => {
      try {
        const response = await api.get("/citas/mias");
        setCitas(response.data);
      } catch (requestError) {
        const status = requestError.response?.status;

        if (status === 401) {
          return;
        }

        if (status === 403) {
          setError("No tienes permiso para consultar estas citas.");
        } else {
          setError("No fue posible cargar tus citas. Inténtalo nuevamente.");
        }
      } finally {
        setCargando(false);
      }
    };

    cargarCitas();
  }, []);

  if (cargando) {
    return <div className="citas-estado-pagina">Cargando citas...</div>;
  }

  return (
    <main className="citas-container">
      <header className="citas-header">
        <h1>Mis Citas</h1>
      </header>

      {error ? (
        <p className="citas-error">{error}</p>
      ) : citas.length === 0 ? (
        <p className="citas-vacias">No tienes citas registradas.</p>
      ) : (
        <div className="citas-grid">
          {citas.map((cita) => {
            const fechaFormateada = formatearFecha(cita.fecha);
            const estadoLegible = etiquetasEstado[cita.estado] || cita.estado;

            return (
              <article className="cita-card" key={cita.id}>
                <h2>{cita.taller_nombre}</h2>
                <p>
                  <span>Vehículo:</span> {cita.marca} {cita.modelo}
                </p>
                <p>
                  <span>Placas:</span> {cita.placas}
                </p>
                <p>
                  <span>Fecha:</span> {fechaFormateada.fecha}
                </p>
                <p>
                  <span>Hora:</span> {fechaFormateada.hora}
                </p>
                <p>
                  <span>Estado:</span>{" "}
                  <strong className={`cita-estado cita-estado-${cita.estado}`}>
                    {estadoLegible}
                  </strong>
                </p>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Citas;
