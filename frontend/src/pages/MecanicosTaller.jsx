import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/MecanicosTaller.css";

const mensajeError = (error, operacion) => {
  const status = error.response?.status;
  if (status === 401) return "";
  if (status === 400) return error.response?.data?.mensaje || "La entrada no es válida.";
  if (status === 403) return "No tienes permiso para realizar esta operación.";
  if (status === 404) return error.response?.data?.mensaje || "El recurso no fue encontrado.";
  if (status === 409) return error.response?.data?.mensaje || "El recurso ya existe.";
  return `No fue posible ${operacion}. Inténtalo nuevamente.`;
};

function MecanicosTaller() {
  const [talleres, setTalleres] = useState([]);
  const [tallerId, setTallerId] = useState("");
  const [mecanicos, setMecanicos] = useState([]);
  const [correo, setCorreo] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cargandoTalleres, setCargandoTalleres] = useState(true);
  const [cargandoMecanicos, setCargandoMecanicos] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [asociando, setAsociando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [desvinculandoId, setDesvinculandoId] = useState(null);
  const [nuevoMecanico, setNuevoMecanico] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    password_temporal: "",
    confirmar_password: "",
  });
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarMecanicos = useCallback(async (id) => {
    setCargandoMecanicos(true);
    setError("");
    try {
      const response = await api.get(`/talleres/${id}/mecanicos`);
      setMecanicos(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setMecanicos([]);
      setError(mensajeError(requestError, "cargar los mecánicos"));
    } finally {
      setCargandoMecanicos(false);
    }
  }, []);

  useEffect(() => {
    const cargarTalleres = async () => {
      try {
        const response = await api.get("/talleres/mios");
        const propios = Array.isArray(response.data) ? response.data : [];
        setTalleres(propios);
        if (propios.length > 0) {
          const primero = String(propios[0].id);
          setTallerId(primero);
          await cargarMecanicos(primero);
        }
      } catch (requestError) {
        setError(mensajeError(requestError, "cargar tus talleres"));
      } finally {
        setCargandoTalleres(false);
      }
    };

    cargarTalleres();
  }, [cargarMecanicos]);

  const cambiarTaller = (event) => {
    const nuevoId = event.target.value;
    setTallerId(nuevoId);
    setResultado(null);
    setCorreo("");
    setMensaje("");
    cargarMecanicos(nuevoId);
  };

  const buscarMecanico = async (event) => {
    event.preventDefault();
    const correoNormalizado = correo.trim().toLowerCase();
    setResultado(null);
    setMensaje("");
    setError("");

    if (!correoNormalizado) {
      setError("Escribe el correo exacto del mecánico.");
      return;
    }

    setBuscando(true);
    try {
      const response = await api.get(`/talleres/${tallerId}/mecanicos/buscar`, {
        params: { correo: correoNormalizado },
      });
      setResultado(response.data);
    } catch (requestError) {
      setError(mensajeError(requestError, "buscar el mecánico"));
    } finally {
      setBuscando(false);
    }
  };

  const asociarMecanico = async () => {
    if (!resultado?.id) return;
    setAsociando(true);
    setError("");
    setMensaje("");

    try {
      await api.post(`/talleres/${tallerId}/mecanicos`, {
        mecanico_id: resultado.id,
      });
      setMensaje("Mecánico agregado al taller correctamente.");
      setResultado(null);
      setCorreo("");
      await cargarMecanicos(tallerId);
    } catch (requestError) {
      setError(mensajeError(requestError, "agregar el mecánico"));
    } finally {
      setAsociando(false);
    }
  };

  const actualizarNuevoMecanico = (event) => {
    const { name, value } = event.target;
    setNuevoMecanico((actual) => ({ ...actual, [name]: value }));
  };

  const registrarMecanico = async (event) => {
    event.preventDefault();
    setError("");
    setMensaje("");

    const nombre = nuevoMecanico.nombre.trim();
    const correoNormalizado = nuevoMecanico.correo.trim().toLowerCase();
    const telefono = nuevoMecanico.telefono.trim();

    if (!nombre || !correoNormalizado) {
      setError("Nombre y correo son obligatorios.");
      return;
    }

    if (nuevoMecanico.password_temporal.length < 8) {
      setError("La contraseña temporal debe tener al menos 8 caracteres.");
      return;
    }

    if (nuevoMecanico.password_temporal !== nuevoMecanico.confirmar_password) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setRegistrando(true);
    try {
      await api.post(`/talleres/${tallerId}/mecanicos/nuevo`, {
        nombre,
        correo: correoNormalizado,
        ...(telefono ? { telefono } : {}),
        password_temporal: nuevoMecanico.password_temporal,
      });
      setNuevoMecanico({
        nombre: "",
        correo: "",
        telefono: "",
        password_temporal: "",
        confirmar_password: "",
      });
      setMensaje("Mecánico registrado y agregado al taller correctamente.");
      await cargarMecanicos(tallerId);
    } catch (requestError) {
      setNuevoMecanico((actual) => ({
        ...actual,
        password_temporal: "",
        confirmar_password: "",
      }));
      setError(mensajeError(requestError, "registrar el mecánico"));
    } finally {
      setRegistrando(false);
    }
  };

  const desvincularMecanico = async (mecanico) => {
    const confirmado = window.confirm(
      `¿Deseas desvincular a ${mecanico.nombre} de este taller?\n\nSu cuenta seguirá existiendo.`,
    );
    if (!confirmado) return;

    setDesvinculandoId(mecanico.id);
    setError("");
    setMensaje("");
    try {
      await api.delete(`/talleres/${tallerId}/mecanicos/${mecanico.id}`);
      setResultado(null);
      setCorreo("");
      setMensaje("Mecánico desvinculado correctamente. Su cuenta sigue existiendo.");
      await cargarMecanicos(tallerId);
    } catch (requestError) {
      setError(mensajeError(requestError, "desvincular el mecánico"));
    } finally {
      setDesvinculandoId(null);
    }
  };

  const tallerSeleccionado = talleres.find((taller) => String(taller.id) === tallerId);

  return (
    <>
      <Navbar />
      <main className="mecanicos-taller-container">
        <section className="mecanicos-taller-card">
          <header className="mecanicos-taller-encabezado">
            <div>
              <p className="mecanicos-taller-etiqueta">Panel del taller</p>
              <h1>Gestionar mecánicos</h1>
              <p>Consulta, agrega o registra mecánicos para tus talleres.</p>
            </div>
            <Link to="/taller">Volver al panel</Link>
          </header>

          {error && <p className="mecanicos-taller-error" role="alert">{error}</p>}
          {mensaje && <p className="mecanicos-taller-exito" role="status">{mensaje}</p>}

          {cargandoTalleres ? (
            <p className="mecanicos-taller-estado">Cargando tus talleres...</p>
          ) : talleres.length === 0 ? (
            <div className="mecanicos-taller-estado">
              <p>No tienes talleres registrados.</p>
              <Link to="/taller/nuevo">Registrar mi taller</Link>
            </div>
          ) : (
            <>
              <div className="mecanicos-taller-selector">
                <label htmlFor="taller-mecanicos">Taller seleccionado</label>
                {talleres.length > 1 ? (
                  <select id="taller-mecanicos" value={tallerId} onChange={cambiarTaller}>
                    {talleres.map((taller) => (
                      <option key={taller.id} value={taller.id}>{taller.nombre}</option>
                    ))}
                  </select>
                ) : <p>{tallerSeleccionado?.nombre}</p>}
              </div>

              <section className="mecanicos-taller-seccion">
                <h2>Mecánicos asociados</h2>
                {cargandoMecanicos ? (
                  <p className="mecanicos-taller-estado">Cargando mecánicos...</p>
                ) : mecanicos.length === 0 ? (
                  <p className="mecanicos-taller-estado">Aún no tienes mecánicos asociados.</p>
                ) : (
                  <div className="mecanicos-taller-lista">
                    {mecanicos.map((mecanico) => (
                      <article key={mecanico.id} className="mecanicos-taller-item">
                        <div>
                          <h3>{mecanico.nombre}</h3>
                          <p>{mecanico.correo}</p>
                          {mecanico.telefono && <p>{mecanico.telefono}</p>}
                        </div>
                        <div className="mecanicos-taller-acciones">
                          <span className={mecanico.activo ? "activo" : "inactivo"}>
                            {mecanico.activo ? "Activo" : "Inactivo"}
                          </span>
                          <Link to={`/taller/${tallerId}/mecanicos/${mecanico.id}/horarios`}>
                            Configurar horario
                          </Link>
                          <button
                            type="button"
                            className="mecanicos-taller-desvincular"
                            onClick={() => desvincularMecanico(mecanico)}
                            disabled={desvinculandoId === mecanico.id}
                          >
                            {desvinculandoId === mecanico.id ? "Desvinculando..." : "Desvincular"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="mecanicos-taller-seccion">
                <h2>Agregar mecánico existente</h2>
                <form className="mecanicos-taller-busqueda" onSubmit={buscarMecanico}>
                  <label htmlFor="correo-mecanico">Correo del mecánico</label>
                  <div>
                    <input
                      id="correo-mecanico"
                      type="email"
                      value={correo}
                      onChange={(event) => setCorreo(event.target.value)}
                      maxLength={100}
                      required
                    />
                    <button type="submit" disabled={buscando || !correo.trim()}>
                      {buscando ? "Buscando..." : "Buscar"}
                    </button>
                  </div>
                </form>

                {resultado && (
                  <article className="mecanicos-taller-resultado">
                    <h3>{resultado.nombre}</h3>
                    <p>{resultado.correo}</p>
                    {resultado.telefono && <p>{resultado.telefono}</p>}
                    {resultado.asociado_mismo_taller ? (
                      <p className="mecanicos-taller-aviso">Este mecánico ya pertenece a tu taller.</p>
                    ) : resultado.asociado ? (
                      <p className="mecanicos-taller-aviso">Este mecánico ya está asociado a otro taller.</p>
                    ) : (
                      <button type="button" onClick={asociarMecanico} disabled={asociando}>
                        {asociando ? "Agregando..." : "Agregar al taller"}
                      </button>
                    )}
                  </article>
                )}
              </section>

              <section className="mecanicos-taller-seccion">
                <h2>Registrar nuevo mecánico</h2>
                <p>
                  La nueva cuenta se asociará a <strong>{tallerSeleccionado?.nombre}</strong>.
                </p>
                <form className="mecanicos-taller-registro" onSubmit={registrarMecanico}>
                  <label htmlFor="nuevo-mecanico-nombre">Nombre</label>
                  <input
                    id="nuevo-mecanico-nombre"
                    name="nombre"
                    type="text"
                    value={nuevoMecanico.nombre}
                    onChange={actualizarNuevoMecanico}
                    maxLength={100}
                    required
                  />

                  <label htmlFor="nuevo-mecanico-correo">Correo</label>
                  <input
                    id="nuevo-mecanico-correo"
                    name="correo"
                    type="email"
                    value={nuevoMecanico.correo}
                    onChange={actualizarNuevoMecanico}
                    maxLength={100}
                    required
                  />

                  <label htmlFor="nuevo-mecanico-telefono">Teléfono</label>
                  <input
                    id="nuevo-mecanico-telefono"
                    name="telefono"
                    type="tel"
                    value={nuevoMecanico.telefono}
                    onChange={actualizarNuevoMecanico}
                    maxLength={20}
                  />

                  <label htmlFor="nuevo-mecanico-password">Contraseña temporal</label>
                  <input
                    id="nuevo-mecanico-password"
                    name="password_temporal"
                    type="password"
                    value={nuevoMecanico.password_temporal}
                    onChange={actualizarNuevoMecanico}
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                  <p className="mecanicos-taller-ayuda">
                    Esta contraseña será utilizada por el mecánico para iniciar sesión.
                  </p>

                  <label htmlFor="nuevo-mecanico-confirmar">Confirmar contraseña</label>
                  <input
                    id="nuevo-mecanico-confirmar"
                    name="confirmar_password"
                    type="password"
                    value={nuevoMecanico.confirmar_password}
                    onChange={actualizarNuevoMecanico}
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />

                  <button type="submit" disabled={registrando || !tallerId}>
                    {registrando ? "Registrando..." : "Registrar y agregar al taller"}
                  </button>
                </form>
              </section>
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default MecanicosTaller;
