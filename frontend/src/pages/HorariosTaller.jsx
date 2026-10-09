import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/HorariosTaller.css";

const diasSemana = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const crearSemanaVacia = () => diasSemana.map((nombre, diaSemana) => ({
  diaSemana,
  nombre,
  bloques: [],
}));

const normalizarHora = (hora) => hora.slice(0, 5);

const construirSemana = (horarios) => {
  const semana = crearSemanaVacia();

  horarios.forEach((horario, indice) => {
    const diaSemana = Number(horario.dia_semana);
    if (Number.isInteger(diaSemana) && diaSemana >= 0 && diaSemana <= 6) {
      semana[diaSemana].bloques.push({
        id: `${diaSemana}-${indice}-${horario.hora_inicio}-${horario.hora_fin}`,
        hora_inicio: normalizarHora(horario.hora_inicio),
        hora_fin: normalizarHora(horario.hora_fin),
      });
    }
  });

  return semana;
};

const validarSemana = (semana) => {
  for (const dia of semana) {
    if (!Number.isInteger(dia.diaSemana) || dia.diaSemana < 0 || dia.diaSemana > 6) {
      return "El día de la semana no es válido.";
    }

    const bloquesOrdenados = [...dia.bloques].sort((a, b) =>
      a.hora_inicio.localeCompare(b.hora_inicio));
    const bloquesUnicos = new Set();

    for (const bloque of bloquesOrdenados) {
      if (!bloque.hora_inicio || !bloque.hora_fin) {
        return `Completa las horas de ${dia.nombre}.`;
      }

      if (bloque.hora_inicio === bloque.hora_fin) {
        return `En ${dia.nombre}, la hora de inicio no puede ser igual a la hora de fin.`;
      }

      if (bloque.hora_inicio > bloque.hora_fin) {
        return `En ${dia.nombre}, la hora de inicio debe ser anterior a la hora de fin.`;
      }

      const clave = `${bloque.hora_inicio}-${bloque.hora_fin}`;
      if (bloquesUnicos.has(clave)) {
        return `Hay bloques duplicados en ${dia.nombre}.`;
      }
      bloquesUnicos.add(clave);
    }

    for (let indice = 1; indice < bloquesOrdenados.length; indice += 1) {
      if (bloquesOrdenados[indice].hora_inicio < bloquesOrdenados[indice - 1].hora_fin) {
        return `Hay bloques superpuestos en ${dia.nombre}.`;
      }
    }
  }

  return "";
};

const manejarError = (requestError, operacion) => {
  const status = requestError.response?.status;

  if (status === 401) return "";
  if (status === 400) {
    return requestError.response?.data?.mensaje || "El horario contiene datos no válidos.";
  }
  if (status === 403) return "No tienes permiso para administrar estos horarios.";
  if (status === 404) return "El taller no existe o no está autorizado para tu cuenta.";
  return `No fue posible ${operacion}. Inténtalo nuevamente.`;
};

function HorariosTaller() {
  const [talleres, setTalleres] = useState([]);
  const [tallerId, setTallerId] = useState("");
  const [semana, setSemana] = useState(crearSemanaVacia);
  const [cargandoTalleres, setCargandoTalleres] = useState(true);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const siguienteBloqueId = useRef(1);
  const solicitudHorarios = useRef(0);

  const cargarHorarios = useCallback(async (idSeleccionado) => {
    const solicitudId = ++solicitudHorarios.current;
    setCargandoHorarios(true);
    setSemana(crearSemanaVacia());
    setMensaje("");
    setError("");

    try {
      const response = await api.get(`/talleres/${idSeleccionado}/horarios`);
      if (solicitudId !== solicitudHorarios.current) return false;
      setSemana(construirSemana(response.data?.horarios || []));
      return true;
    } catch (requestError) {
      if (solicitudId !== solicitudHorarios.current) return false;
      setError(manejarError(requestError, "cargar el horario"));
      return false;
    } finally {
      if (solicitudId === solicitudHorarios.current) {
        setCargandoHorarios(false);
      }
    }
  }, []);

  useEffect(() => {
    const cargarTalleresPropios = async () => {
      try {
        const response = await api.get("/talleres/mios");
        const propios = Array.isArray(response.data) ? response.data : [];

        setTalleres(propios);

        if (propios.length > 0) {
          const primerTallerId = String(propios[0].id);
          setTallerId(primerTallerId);
          await cargarHorarios(primerTallerId);
        }
      } catch (requestError) {
        setError(manejarError(requestError, "cargar tus talleres"));
      } finally {
        setCargandoTalleres(false);
      }
    };

    cargarTalleresPropios();
  }, [cargarHorarios]);

  const manejarCambioTaller = (event) => {
    const nuevoTallerId = event.target.value;
    setTallerId(nuevoTallerId);
    cargarHorarios(nuevoTallerId);
  };

  const agregarBloque = (diaSemana) => {
    setMensaje("");
    setError("");
    setSemana((semanaActual) => semanaActual.map((dia) => (
      dia.diaSemana === diaSemana
        ? {
            ...dia,
            bloques: [
              ...dia.bloques,
              {
                id: `nuevo-${siguienteBloqueId.current++}`,
                hora_inicio: "09:00",
                hora_fin: "13:00",
              },
            ],
          }
        : dia
    )));
  };

  const eliminarBloque = (diaSemana, bloqueId) => {
    setMensaje("");
    setError("");
    setSemana((semanaActual) => semanaActual.map((dia) => (
      dia.diaSemana === diaSemana
        ? { ...dia, bloques: dia.bloques.filter((bloque) => bloque.id !== bloqueId) }
        : dia
    )));
  };

  const editarBloque = (diaSemana, bloqueId, campo, valor) => {
    setMensaje("");
    setError("");
    setSemana((semanaActual) => semanaActual.map((dia) => (
      dia.diaSemana === diaSemana
        ? {
            ...dia,
            bloques: dia.bloques.map((bloque) => (
              bloque.id === bloqueId ? { ...bloque, [campo]: valor } : bloque
            )),
          }
        : dia
    )));
  };

  const guardarHorario = async () => {
    setMensaje("");
    setError("");

    const errorValidacion = validarSemana(semana);
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
      await api.put(`/talleres/${tallerId}/horarios`, { horarios });
      const horarioRecargado = await cargarHorarios(tallerId);
      if (horarioRecargado) {
        setMensaje("Horario guardado y confirmado correctamente.");
      }
    } catch (requestError) {
      setError(manejarError(requestError, "guardar el horario"));
    } finally {
      setGuardando(false);
    }
  };

  const tallerSeleccionado = talleres.find((taller) => String(taller.id) === tallerId);
  const bloqueado = cargandoTalleres || cargandoHorarios || guardando || !tallerId;

  return (
    <>
      <Navbar />
      <main className="horarios-taller-container">
        <section className="horarios-taller-card">
          <div className="horarios-taller-encabezado">
            <div>
              <p className="horarios-taller-etiqueta">Panel del taller</p>
              <h1>Configurar horarios</h1>
              <p>Define el horario general que se utilizará para ofrecer citas.</p>
            </div>
            <Link to="/taller">Volver al panel</Link>
          </div>

          {error && <p className="horarios-taller-error" role="alert">{error}</p>}
          {mensaje && <p className="horarios-taller-exito" role="status">{mensaje}</p>}

          {cargandoTalleres ? (
            <p className="horarios-taller-estado">Cargando tus talleres...</p>
          ) : talleres.length === 0 ? (
            <div className="horarios-taller-estado horarios-taller-sin-registros">
              <p>No tienes talleres registrados.</p>
              <Link to="/taller/nuevo">Registrar mi taller</Link>
            </div>
          ) : (
            <>
              <div className="horarios-taller-selector">
                <label htmlFor="taller">Taller seleccionado</label>
                {talleres.length > 1 ? (
                  <select id="taller" value={tallerId} onChange={manejarCambioTaller}>
                    {talleres.map((taller) => (
                      <option key={taller.id} value={taller.id}>
                        {taller.nombre} (#{taller.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p>{tallerSeleccionado?.nombre}</p>
                )}
              </div>

              {cargandoHorarios ? (
                <p className="horarios-taller-estado">Cargando horario semanal...</p>
              ) : (
                <div className="horarios-taller-semana">
                  {semana.map((dia) => (
                    <article className="horarios-taller-dia" key={dia.diaSemana}>
                      <div className="horarios-taller-dia-encabezado">
                        <div>
                          <h2>{dia.nombre}</h2>
                          <span className={dia.bloques.length ? "abierto" : "cerrado"}>
                            {dia.bloques.length ? `${dia.bloques.length} bloque${dia.bloques.length > 1 ? "s" : ""}` : "Cerrado"}
                          </span>
                        </div>
                        <button type="button" onClick={() => agregarBloque(dia.diaSemana)}>
                          Agregar horario
                        </button>
                      </div>

                      {dia.bloques.map((bloque, indice) => (
                        <div className="horarios-taller-bloque" key={bloque.id}>
                          <label>
                            Inicio
                            <input
                              type="time"
                              value={bloque.hora_inicio}
                              onChange={(event) => editarBloque(
                                dia.diaSemana,
                                bloque.id,
                                "hora_inicio",
                                event.target.value,
                              )}
                            />
                          </label>
                          <span aria-hidden="true">—</span>
                          <label>
                            Fin
                            <input
                              type="time"
                              value={bloque.hora_fin}
                              onChange={(event) => editarBloque(
                                dia.diaSemana,
                                bloque.id,
                                "hora_fin",
                                event.target.value,
                              )}
                            />
                          </label>
                          <button
                            className="horarios-taller-eliminar"
                            type="button"
                            onClick={() => eliminarBloque(dia.diaSemana, bloque.id)}
                            aria-label={`Eliminar bloque ${indice + 1} de ${dia.nombre}`}
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </article>
                  ))}
                </div>
              )}

              <button
                className="horarios-taller-guardar"
                type="button"
                onClick={guardarHorario}
                disabled={bloqueado}
              >
                {guardando ? "Guardando..." : "Guardar horario"}
              </button>
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default HorariosTaller;
