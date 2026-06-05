import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

import "../styles/MisVehiculos.css";

function MisVehiculos() {

    const [vehiculos, setVehiculos] = useState([]);

    useEffect(() => {

        obtenerVehiculos();

    }, []);

    const obtenerVehiculos = async () => {

        try {

            const response = await api.get(
                "/vehiculos",
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setVehiculos(response.data);

        } catch (error) {

            console.error(error);

        }

    };

    return (

        <div className="vehiculos-container">

            <div className="vehiculos-header">

                <h1 className="vehiculos-title">
                    🚗 Mis Vehículos
                </h1>

                <Link
                    to="/cliente/vehiculos/nuevo"
                >
                    <button
                        className="agregar-vehiculo-btn"
                    >
                        + Agregar
                    </button>
                </Link>

            </div>

            {
                vehiculos.length === 0 ? (

                    <p className="empty-message">
                        No tienes vehículos registrados.
                    </p>

                ) : (

                    <div className="vehiculos-grid">

                        {
                            vehiculos.map((vehiculo) => (

                                <div
                                    key={vehiculo.id}
                                    className="vehiculo-card"
                                >

                                    <h3>
                                        {vehiculo.marca} {vehiculo.modelo}
                                    </h3>

                                    <p>
                                        📅 Año: {vehiculo.anio}
                                    </p>

                                    <p>
                                        🚘 Placas: {vehiculo.placas}
                                    </p>

                                    <p>
                                        🎨 Color: {vehiculo.color}
                                    </p>

                                </div>

                            ))
                        }

                    </div>

                )
            }

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

export default MisVehiculos;