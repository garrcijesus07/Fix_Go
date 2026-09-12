import { useEffect, useState } from "react";
import api from "../services/api";
import TallerCard from "../components/TallerCard";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

import "../styles/ClienteDashboard.css";

function ClienteDashboard() {

    const [talleres, setTalleres] = useState([]);

    useEffect(() => {

        const obtenerTalleres = async () => {

            try {

                const response = await api.get(
                    "/talleres"
                );

                setTalleres(response.data);

            } catch (error) {

                console.error(error);

            }

        };

        obtenerTalleres();

    }, []);

    return (

        <div className="cliente-container">

            <div className="navbar">

                <div className="navbar-top">

                    <h2>
                        Fix-Go
                    </h2>

                    <Navbar />

                    <Link
                        to="/cliente/perfil"
                        style={{
                            color: "white",
                            textDecoration: "none",
                            fontSize: "24px"
                        }}
                    >
                        👤
                    </Link>

                </div>

                <p>
                    Bienvenido nuevamente
                </p>

            </div>

            <div className="dashboard-content">

                <input
                    className="search-box"
                    type="text"
                    placeholder="🔍 Buscar talleres..."
                />

                <Link
                    to="/cliente/vehiculos"
                    style={{ textDecoration: "none" }}
                >

                    <button className="vehiculos-btn">
                        🚗 Mis Vehículos
                    </button>

                </Link>
                <div className="welcome-card">

                    <h3>
                        🚗 Gestiona tus vehículos
                    </h3>

                    <p>
                        Consulta citas, historial y estado de reparación.
                    </p>

                </div>
                <h2 className="section-title">
                    Talleres Disponibles
                </h2>

                <div className="card-grid">

                    {
                        talleres.map((taller) => (

                            <TallerCard
                                key={taller.id}
                                taller={taller}
                            />

                        ))
                    }

                </div>

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

export default ClienteDashboard;
