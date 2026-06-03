import { useEffect, useState } from "react";
import api from "../services/api";
import TallerCard from "../components/TallerCard";
import { Link } from "react-router-dom";

function ClienteDashboard() {

    const [talleres, setTalleres] = useState([]);

    useEffect(() => {

        obtenerTalleres();

    }, []);

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

    return (


        <div style={{ padding: "20px" }}>

            <Link to="/cliente/vehiculos">

                <button>
                    Mis Vehículos
                </button>

            </Link>

            <h1>
                Talleres Disponibles
            </h1>

            {
                talleres.map((taller) => (

                    <TallerCard
                        key={taller.id}
                        taller={taller}
                    />

                ))
            }

        </div>

    );

}

export default ClienteDashboard;