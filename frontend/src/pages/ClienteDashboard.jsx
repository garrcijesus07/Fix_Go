import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import TallerCard from "../components/TallerCard";
import Navbar from "../components/Navbar";
import "../styles/ClienteDashboard.css";

function ClienteDashboard() {
    const [talleres, setTalleres] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("");
    const [cargando, setCargando] = useState(true);
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        const cargarCategorias = async () => {
            try {
                const response = await api.get("/categorias");
                setCategorias(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error(error);
            }
        };
        cargarCategorias();
    }, []);

    useEffect(() => {
        const obtenerTalleres = async () => {
            setCargando(true);
            try {
                const response = await api.get("/talleres", { params: categoria ? { categoria } : {} });
                setTalleres(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error(error);
            } finally {
                setCargando(false);
            }
        };
        obtenerTalleres();
    }, [categoria]);

    const talleresVisibles = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return talleres.filter((taller) => {
            const contenido = [taller.nombre, taller.descripcion, taller.direccion].filter(Boolean).join(" ").toLowerCase();
            return !termino || contenido.includes(termino);
        });
    }, [talleres, busqueda]);

    return <div className="cliente-container">
        <Navbar />
        <section className="cliente-hero">
            <div className="cliente-hero-content">
                <p className="cliente-eyebrow">Servicios automotrices cerca de ti</p>
                <h1>Tu auto en las mejores manos</h1>
                <p>Encuentra talleres, revisa su información y agenda una cita en pocos pasos.</p>
                <label className="cliente-buscador">
                    <span aria-hidden="true">⌕</span>
                    <span className="sr-only">Buscar talleres o servicios</span>
                    <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar talleres o servicios..." />
                </label>
            </div>
            <div className="cliente-hero-visual" aria-hidden="true">
                <span>FIX_GO</span><strong>Servicio confiable</strong><small>Agenda · Confirma · Conduce</small>
            </div>
        </section>
        <main className="dashboard-content">
            <div className="cliente-categorias" aria-label="Filtrar por servicio">
                <button type="button" className={categoria === "" ? "activo" : ""} onClick={() => setCategoria("")}>Todos</button>
                {categorias.map((item) => <button type="button" key={item.id} className={categoria === item.slug ? "activo" : ""} onClick={() => setCategoria(item.slug)}>{item.nombre}</button>)}
            </div>
            <div className="cliente-seccion-encabezado">
                <div><p className="cliente-eyebrow">Explora opciones</p><h2>Talleres disponibles</h2></div>
                <span>{talleresVisibles.length} resultado{talleresVisibles.length === 1 ? "" : "s"}</span>
            </div>
            {cargando ? <p className="cliente-estado">Cargando talleres...</p> : talleresVisibles.length === 0 ?
                <p className="cliente-estado">No encontramos talleres con esos criterios.</p> :
                <div className="card-grid">{talleresVisibles.map((taller) => <TallerCard key={taller.id} taller={taller} />)}</div>}
        </main>
    </div>;
}

export default ClienteDashboard;
