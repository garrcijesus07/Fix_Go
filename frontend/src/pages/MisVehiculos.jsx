import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

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

        <div style={{ padding: "20px" }}>

            <h1>Mis Vehículos</h1>

            <Link to="/cliente/vehiculos/nuevo">

                <button>
                    Agregar Vehículo
                </button>

            </Link>

            <hr />

            {
                vehiculos.map((vehiculo) => (

                    <div
                        key={vehiculo.id}
                        style={{
                            border: "1px solid gray",
                            padding: "10px",
                            marginBottom: "10px"
                        }}
                    >

                        <h3>
                            {vehiculo.marca}
                            {" "}
                            {vehiculo.modelo}
                        </h3>

                        <p>
                            Año: {vehiculo.anio}
                        </p>

                        <p>
                            Placas: {vehiculo.placas}
                        </p>

                        <p>
                            Color: {vehiculo.color}
                        </p>

                    </div>

                ))
            }

        </div>

    );

}

export default MisVehiculos;