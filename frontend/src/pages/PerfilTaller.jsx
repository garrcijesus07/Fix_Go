import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/PerfilTaller.css";

function PerfilTaller() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [taller, setTaller] = useState(null);

    useEffect(() => {

        const cargarTaller = async () => {

            try {

                const response = await api.get(
                    `/talleres/${id}`
                );

                setTaller(response.data);

            } catch (error) {

                console.error(error);

            }

        };

        cargarTaller();

    }, [id]);

    if (!taller) {

        return (
            <div className="loading">
                Cargando taller...
            </div>
        );

    }

    return (

        <div className="perfil-taller-container">

            <div className="taller-banner">

                <h1>
                    🔧 {taller.nombre}
                </h1>

            </div>

            <div className="taller-card">

                <p>
                    <span className="info-label">
                        Descripción:
                    </span>
                    <br />
                    {taller.descripcion}
                </p>

                <p>
                    <span className="info-label">
                        📍 Dirección:
                    </span>
                    <br />
                    {taller.direccion}
                </p>

                <p>
                    <span className="info-label">
                        📞 Teléfono:
                    </span>
                    <br />
                    {taller.telefono}
                </p>

                <button
                    className="agendar-btn"
                    onClick={() => navigate(`/cliente/taller/${id}/agendar`)}
                >
                    📅 Agendar Cita
                </button>

            </div>

            <div className="bottom-nav">

                <Link to="/cliente">
                    <button>🏠</button>
                </Link>

                <Link to="/cliente/vehiculos">
                    <button>🚗</button>
                </Link>

                <Link to="/cliente/citas">
                    <button>📅</button>
                </Link>

                <Link to="/cliente/perfil">
                    <button>👤</button>
                </Link>

            </div>

        </div>

    );

}

export default PerfilTaller;
