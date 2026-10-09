import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/HorariosMecanico.css";

const nombresDias = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

const semanaVacia = () => nombresDias.map((nombre, diaSemana) => ({
  diaSemana,
  nombre,
  bloques: [],
}));

const horaCorta = (hora = "") => hora.slice(0, 5);

const construirSemana = (horarios = []) => {
  const semana = semanaVacia();
  horarios.forEach((horario, indice) => {
    const dia = Number(horario.dia_semana);
    if (Number.isInteger(dia) && dia >= 0 && dia <= 6) {
      semana[dia].bloques.push({
        id: horario.id || `cargado-${dia}-${indice}`,
        hora_inicio: horaCorta(horario.hora_inicio),
        hora_fin: horaCorta(horario.hora_fin),
      });
    }
  });
  return semana;
};

const agruparHorarioTaller = (horarios = []) => {
  const porDia = Array.from({ length: 7 }, () => []);
  horarios.forEach((horario) => {
    const dia = Number(horario.dia_semana);
    if (Number.isInteger(dia) && dia >= 0 && dia <= 6) {
      porDia[dia].push({
        hora_inicio: horaCorta(horario.hora_inicio),
        hora_fin: horaCorta(horario.hora_fin),
      });
    }
  });
  return porDia;
};

const validarSemana = (semana, horarioTaller) => {
  for (const dia of semana) {
    const ordenados = [...dia.bloques].sort((a, b) =>
      a.hora_inicio.localeCompare(b.hora_inicio));
    const unicos = new Set();

    for (const bloque of ordenados) {
      if (!bloque.hora_inicio || !bloque.hora_fin) {
        return `Completa las horas de ${dia.nombre}.`;
      }
      if (bloque.hora_inicio >= bloque.hora_fin) {
        return `En ${dia.nombre}, la hora de inicio debe ser anterior a la hora de fin.`;
      }
      const clave = `${bloque.hora_inicio}-${bloque.hora_fin}`;
      if (unicos.has(clave)) return `Hay bloques duplicados en ${dia.nombre}.`;
      unicos.add(clave);

      const contenido = horarioTaller[dia.diaSemana].some((general) =>
        bloque.hora_inicio >= general.hora_inicio && bloque.hora_fin <= general.hora_fin);
      if (!contenido) {
        return `El horario de ${dia.nombre} debe estar dentro del horario general del taller.`;
      }
    }

    for (let indice = 1; indice < ordenados.length; indice += 1) {
      if (ordenados[indice].hora_inicio < ordenados[indice - 1].hora_fin) {
        return `Hay bloques superpuestos en ${dia.nombre}.`;
      }
    }
  }
  return "";
};

const mensajeError = (error, operacion) => {
  const status = error.response?.status;
  if (status === 401) return "";
  if (status === 400 || status === 409) {
    return error.response?.data?.mensaje || "El horario contiene datos no válidos.";
  }
  if (status === 403) return "No tienes permiso para administrar este horario.";
  if (status === 404) return "El taller o el mecánico asociado no fue encontrado.";
  return `No fue posible ${operacion}. Inténtalo nuevamente.`;
};

function HorariosMecanico() {
  const { tallerId, mecanicoId } = useParams();
  const [taller, setTaller] = useState(null);
  const [mecanico, setMecanico] = useState(null);
  const [semana, setSemana] = useState(semanaVacia);
  const [horarioTaller, setHorarioTaller] = useState(() => Array.from({ length: 7 }, () => []));
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const siguienteId = useRef(1);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [respuestaMecanico, respuestaGeneral, respuestaTalleres] = await Promise.all([
        api.get(`/talleres/${tallerId}/mecanicos/${mecanicoId}/horarios`),
        api.get(`/talleres/${tallerId}/horarios`),
        api.get("/talleres/mios"),
      ]);
      const talleres = Array.isArray(respuestaTalleres.data) ? respuestaTalleres.data : [];
      setTaller(talleres.find((item) => String(item.id) === String(tallerId)) || null);
      setMecanico(respuestaMecanico.data.mecanico);
      setSemana(construirSemana(respuestaMecanico.data.horarios));
      setHorarioTaller(agruparHorarioTaller(respuestaGeneral.data.horarios));
      return true;
    } catch (requestError) {
      setError(mensajeError(requestError, "cargar los horarios"));
      return false;
    } finally {
      setCargando(false);
    }
  }, [tallerId, mecanicoId]);

  useEffect(() => {
    const iniciarCarga = async () => {
      await cargarDatos();
    };

    iniciarCarga();
  }, [cargarDatos]);

  const agregarBloque = (diaSemana) => {
    const referencia = horarioTaller[diaSemana][0];
    if (!referencia) return;
    setError("");
    setMensaje("");
    setSemana((actual) => actual.map((dia) => dia.diaSemana === diaSemana ? {
      ...dia,
      bloques: [...dia.bloques, {
        id: `nuevo-${siguienteId.current++}`,
        hora_inicio: referencia.hora_inicio,
        hora_fin: referencia.hora_fin,
      }],
    } : dia));
  };

  const editarBloque = (diaSemana, bloqueId, campo, valor) => {
    setError("");
    setMensaje("");
    setSemana((actual) => actual.map((dia) => dia.diaSemana === diaSemana ? {
      ...dia,
      bloques: dia.bloques.map((bloque) =>
        bloque.id === bloqueId ? { ...bloque, [campo]: valor } : bloque),
    } : dia));
  };

  const eliminarBloque = (diaSemana, bloqueId) => {
    setError("");
    setMensaje("");
    setSemana((actual) => actual.map((dia) => dia.diaSemana === diaSemana ? {
      ...dia,
      bloques: dia.bloques.filter((bloque) => bloque.id !== bloqueId),
    } : dia));
  };

  const guardar = async () => {
    setError("");
    setMensaje("");
    const errorValidacion = validarSemana(semana, horarioTaller);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    const horarios = semana.flatMap((dia) => dia.bloques.map((bloque) => ({
      dia_semana: dia.diaSemana,
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
    })));

    setGuardando(true);
    try {
      await api.put(`/talleres/${tallerId}/mecanicos/${mecanicoId}/horarios`, { horarios });
      const recargado = await cargarDatos();
      if (recargado) setMensaje("Horario del mecánico guardado y confirmado correctamente.");
    } catch (requestError) {
      setError(mensajeError(requestError, "guardar el horario"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="horarios-mecanico-container">
        <section className="horarios-mecanico-card">
          <header className="horarios-mecanico-encabezado">
            <div>
              <p className="horarios-mecanico-etiqueta">Panel del taller</p>
              <h1>Horario individual del mecánico</h1>
              <p>Taller: <strong>{taller?.nombre || "—"}</strong></p>
              <p>Mecánico: <strong>{mecanico?.nombre || "—"}</strong></p>
            </div>
            <Link to="/taller/mecanicos">Volver a mecánicos</Link>
          </header>

          {error && <p className="horarios-mecanico-error" role="alert">{error}</p>}
          {mensaje && <p className="horarios-mecanico-exito" role="status">{mensaje}</p>}

          {cargando ? <p className="horarios-mecanico-estado">Cargando horarios...</p> : (
            <>
              <div className="horarios-mecanico-semana">
                {semana.map((dia) => (
                  <article className="horarios-mecanico-dia" key={dia.diaSemana}>
                    <div className="horarios-mecanico-dia-encabezado">
                      <div>
                        <h2>{dia.nombre}</h2>
                        <p className="horarios-mecanico-general">
                          Taller: {horarioTaller[dia.diaSemana].length
                            ? horarioTaller[dia.diaSemana].map((bloque) =>
                              `${bloque.hora_inicio}–${bloque.hora_fin}`).join(", ")
                            : "Cerrado"}
                        </p>
                        <span>{dia.bloques.length ? `${dia.bloques.length} bloque(s)` : "Sin horario"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => agregarBloque(dia.diaSemana)}
                        disabled={horarioTaller[dia.diaSemana].length === 0}
                      >
                        Agregar horario
                      </button>
                    </div>

                    {dia.bloques.map((bloque, indice) => (
                      <div className="horarios-mecanico-bloque" key={bloque.id}>
                        <label>
                          Inicio
                          <input type="time" value={bloque.hora_inicio} onChange={(event) =>
                            editarBloque(dia.diaSemana, bloque.id, "hora_inicio", event.target.value)} />
                        </label>
                        <span aria-hidden="true">—</span>
                        <label>
                          Fin
                          <input type="time" value={bloque.hora_fin} onChange={(event) =>
                            editarBloque(dia.diaSemana, bloque.id, "hora_fin", event.target.value)} />
                        </label>
                        <button type="button" className="horarios-mecanico-eliminar" onClick={() =>
                          eliminarBloque(dia.diaSemana, bloque.id)}
                          aria-label={`Eliminar bloque ${indice + 1} de ${dia.nombre}`}>
                          Quitar
                        </button>
                      </div>
                    ))}
                  </article>
                ))}
              </div>
              <button className="horarios-mecanico-guardar" type="button" onClick={guardar} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar horario"}
              </button>
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default HorariosMecanico;
