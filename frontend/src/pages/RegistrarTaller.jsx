import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/RegistrarTaller.css";

const estadoInicial = {
  nombre: "",
  categoria_ids: [],
  descripcion: "",
  direccion: "",
  telefono: "",
  imagen: "",
};

function RegistrarTaller() {
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState(estadoInicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [errorCategorias, setErrorCategorias] = useState("");

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await api.get("/categorias");
        setCategorias(Array.isArray(response.data) ? response.data : []);
      } catch {
        setErrorCategorias("No fue posible cargar las categorías disponibles.");
      } finally {
        setCargandoCategorias(false);
      }
    };
    cargarCategorias();
  }, []);

  const actualizarCampo = (event) => {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
    setError("");
    setMensaje("");
  };

  const alternarCategoria = (categoriaId) => {
    setFormulario((actual) => ({
      ...actual,
      categoria_ids: actual.categoria_ids.includes(categoriaId)
        ? actual.categoria_ids.filter((id) => id !== categoriaId)
        : [...actual.categoria_ids, categoriaId],
    }));
    setError("");
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setError("");
    setMensaje("");

    const nombre = formulario.nombre.trim();
    if (!nombre) {
      setError("El nombre del taller es obligatorio.");
      return;
    }
    if (formulario.categoria_ids.length === 0) {
      setError("Selecciona al menos una categoría para el taller.");
      return;
    }

    const valorOpcional = (valor) => valor.trim() || null;
    const body = {
      nombre,
      categoria_ids: formulario.categoria_ids,
      descripcion: valorOpcional(formulario.descripcion),
      direccion: valorOpcional(formulario.direccion),
      telefono: valorOpcional(formulario.telefono),
      imagen: valorOpcional(formulario.imagen),
    };

    setEnviando(true);

    try {
      await api.post("/talleres", body);
      setMensaje("Taller registrado correctamente. Abriendo la configuración de horarios...");
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      navigate("/taller/horarios", { replace: true });
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 401) return;
      if (status === 400) {
        setError(requestError.response?.data?.mensaje || "Los datos del taller no son válidos.");
      } else if (status === 403) {
        setError("No tienes permiso para registrar un taller.");
      } else {
        setError("No fue posible registrar el taller. Inténtalo nuevamente.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="registrar-taller-container">
        <section className="registrar-taller-card">
          <div className="registrar-taller-encabezado">
            <div>
              <p className="registrar-taller-etiqueta">Panel del taller</p>
              <h1>Registrar mi taller</h1>
              <p>Agrega la información general antes de configurar los horarios.</p>
            </div>
            <Link to="/taller">Volver al panel</Link>
          </div>

          {error && <p className="registrar-taller-error" role="alert">{error}</p>}
          {mensaje && <p className="registrar-taller-exito" role="status">{mensaje}</p>}

          <form className="registrar-taller-form" onSubmit={manejarEnvio}>
            <label htmlFor="nombre">Nombre del taller</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formulario.nombre}
              onChange={actualizarCampo}
              maxLength={150}
              required
            />

            <fieldset className="registrar-taller-categorias">
              <legend>Categorías del taller</legend>
              {cargandoCategorias ? <p>Cargando categorías...</p> : errorCategorias ?
                <p className="registrar-taller-error" role="alert">{errorCategorias}</p> :
                <div>{categorias.map((categoria) => <label key={categoria.id} className={formulario.categoria_ids.includes(categoria.id) ? "seleccionada" : ""}>
                  <input type="checkbox" checked={formulario.categoria_ids.includes(categoria.id)} onChange={() => alternarCategoria(categoria.id)} />
                  <span>{categoria.nombre}</span>
                </label>)}</div>}
            </fieldset>

            <label htmlFor="descripcion">Descripción (opcional)</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formulario.descripcion}
              onChange={actualizarCampo}
              rows={4}
            />

            <label htmlFor="direccion">Dirección (opcional)</label>
            <textarea
              id="direccion"
              name="direccion"
              value={formulario.direccion}
              onChange={actualizarCampo}
              rows={3}
            />

            <label htmlFor="telefono">Teléfono (opcional)</label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              value={formulario.telefono}
              onChange={actualizarCampo}
              maxLength={20}
            />

            <label htmlFor="imagen">URL de imagen (opcional)</label>
            <input
              id="imagen"
              name="imagen"
              type="url"
              value={formulario.imagen}
              onChange={actualizarCampo}
              maxLength={255}
              placeholder="https://ejemplo.com/taller.jpg"
            />

            <button type="submit" disabled={enviando || cargandoCategorias || Boolean(errorCategorias) || !formulario.nombre.trim() || formulario.categoria_ids.length === 0}>
              {enviando ? "Registrando..." : "Registrar taller"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

export default RegistrarTaller;
