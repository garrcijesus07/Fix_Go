import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/AdminCategorias.css";

const formularioVacio = { nombre: "", slug: "", orden: 0 };
const mensajeError = (error, respaldo) => error.response?.data?.mensaje || respaldo;
const sugerirSlug = (nombre) => nombre.trim().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export default function AdminCategorias() {
    const [categorias, setCategorias] = useState([]);
    const [formulario, setFormulario] = useState(formularioVacio);
    const [editandoId, setEditandoId] = useState(null);
    const [slugEditado, setSlugEditado] = useState(false);
    const [confirmando, setConfirmando] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");

    const cargarCategorias = useCallback(async () => {
        setCargando(true);
        setError("");
        try {
            const respuesta = await api.get("/categorias/admin");
            setCategorias(respuesta.data);
        } catch (err) {
            setError(mensajeError(err, "No fue posible cargar las categorías."));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        let vigente = true;
        const cargarInicial = async () => {
            try {
                const respuesta = await api.get("/categorias/admin");
                if (vigente) setCategorias(respuesta.data);
            } catch (err) {
                if (vigente) setError(mensajeError(err, "No fue posible cargar las categorías."));
            } finally {
                if (vigente) setCargando(false);
            }
        };
        cargarInicial();
        return () => { vigente = false; };
    }, []);

    const resumen = useMemo(() => ({
        total: categorias.length,
        activas: categorias.filter((categoria) => categoria.activo).length,
        inactivas: categorias.filter((categoria) => !categoria.activo).length,
    }), [categorias]);

    const cambiarCampo = (evento) => {
        const { name, value } = evento.target;
        setFormulario((actual) => name === "nombre" && !slugEditado
            ? { ...actual, nombre: value, slug: sugerirSlug(value) }
            : { ...actual, [name]: value });
        if (name === "slug") setSlugEditado(true);
    };

    const cancelarEdicion = () => {
        setEditandoId(null);
        setFormulario(formularioVacio);
        setSlugEditado(false);
        setError("");
    };

    const editar = (categoria) => {
        setEditandoId(categoria.id);
        setFormulario({ nombre: categoria.nombre, slug: categoria.slug, orden: categoria.orden });
        setSlugEditado(true);
        setError("");
        setExito("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const guardar = async (evento) => {
        evento.preventDefault();
        setGuardando(true);
        setError("");
        setExito("");
        try {
            const datos = { ...formulario, orden: Number(formulario.orden) };
            if (editandoId) {
                await api.put(`/categorias/${editandoId}`, datos);
                setExito("Categoría actualizada correctamente.");
            } else {
                await api.post("/categorias", datos);
                setExito("Categoría creada correctamente.");
            }
            setFormulario(formularioVacio);
            setEditandoId(null);
            setSlugEditado(false);
            await cargarCategorias();
        } catch (err) {
            setError(mensajeError(err, "No fue posible guardar la categoría."));
        } finally {
            setGuardando(false);
        }
    };

    const cambiarEstado = async (categoria) => {
        setError("");
        setExito("");
        try {
            await api.patch(`/categorias/${categoria.id}/estado`, { activo: !categoria.activo });
            setConfirmando(null);
            setExito(`Categoría ${categoria.activo ? "desactivada" : "activada"} correctamente.`);
            await cargarCategorias();
        } catch (err) {
            setError(mensajeError(err, "No fue posible cambiar el estado."));
        }
    };

    return <>
        <Navbar />
        <main className="admin-categorias">
            <header className="admin-categorias-header">
                <div><p>Configuración</p><h1>Gestión de categorías</h1><span>Controla los servicios disponibles para talleres y clientes.</span></div>
                <Link to="/admin">Volver al panel</Link>
            </header>
            <section className="admin-categorias-resumen" aria-label="Resumen de categorías">
                <article><span>Total</span><strong>{resumen.total}</strong></article>
                <article><span>Activas</span><strong>{resumen.activas}</strong></article>
                <article><span>Inactivas</span><strong>{resumen.inactivas}</strong></article>
            </section>
            <section className="admin-categorias-formulario">
                <div><span>{editandoId ? "Edición" : "Nueva categoría"}</span><h2>{editandoId ? "Editar categoría" : "+ Nueva categoría"}</h2></div>
                <form onSubmit={guardar}>
                    <label>Nombre<input name="nombre" value={formulario.nombre} onChange={cambiarCampo} required maxLength="100" /></label>
                    <label>Slug<input name="slug" value={formulario.slug} onChange={cambiarCampo} required maxLength="100" pattern="[a-z0-9_]+" /></label>
                    <label>Orden<input name="orden" type="number" min="0" max="100000" step="1" value={formulario.orden} onChange={cambiarCampo} required /></label>
                    <div className="admin-categorias-form-acciones">
                        {editandoId && <button type="button" className="secundario" onClick={cancelarEdicion}>Cancelar</button>}
                        <button type="submit" disabled={guardando}>{guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear categoría"}</button>
                    </div>
                </form>
            </section>
            {error && <p className="admin-categorias-mensaje error" role="alert">{error}</p>}
            {exito && <p className="admin-categorias-mensaje exito" role="status">{exito}</p>}
            <section className="admin-categorias-listado">
                <header><div><span>Catálogo</span><h2>Categorías registradas</h2></div><strong>{categorias.length} registros</strong></header>
                {cargando ? <p className="admin-categorias-vacio">Cargando categorías...</p> : categorias.length === 0 ? <p className="admin-categorias-vacio">No hay categorías registradas.</p> :
                    <div className="admin-categorias-tabla">
                        <div className="admin-categorias-fila admin-categorias-cabecera" aria-hidden="true"><span>Nombre</span><span>Slug</span><span>Orden</span><span>Estado</span><span>Acciones</span></div>
                        {categorias.map((categoria) => <article className="admin-categorias-fila" key={categoria.id}>
                            <div data-label="Nombre"><strong>{categoria.nombre}</strong></div>
                            <div data-label="Slug"><code>{categoria.slug}</code></div>
                            <div data-label="Orden">{categoria.orden}</div>
                            <div data-label="Estado"><span className={`admin-categorias-badge ${categoria.activo ? "activo" : "inactivo"}`}>{categoria.activo ? "Activo" : "Inactivo"}</span></div>
                            <div data-label="Acciones" className="admin-categorias-acciones">
                                <button type="button" className="editar" onClick={() => editar(categoria)}>Editar</button>
                                {confirmando === categoria.id ? <div className="admin-categorias-confirmacion">
                                    <p>Esta categoría dejará de aparecer en nuevos registros y filtros, pero conservará sus asociaciones existentes.</p>
                                    <button type="button" onClick={() => cambiarEstado(categoria)}>Confirmar</button>
                                    <button type="button" className="secundario" onClick={() => setConfirmando(null)}>Cancelar</button>
                                </div> : <button type="button" className={categoria.activo ? "desactivar" : "activar"} onClick={() => categoria.activo ? setConfirmando(categoria.id) : cambiarEstado(categoria)}>{categoria.activo ? "Desactivar" : "Activar"}</button>}
                            </div>
                        </article>)}
                    </div>}
            </section>
        </main>
    </>;
}
