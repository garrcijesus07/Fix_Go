import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

function PerfilTaller() {

    const { id } = useParams();

    const [taller, setTaller] = useState(null);

    useEffect(() => {

        cargarTaller();

    }, []);

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

    if (!taller) {
        return <h2>Cargando...</h2>;
    }

    return (

        <div style={{ padding: "20px" }}>

            <h1>{taller.nombre}</h1>

            <p>
                {taller.descripcion}
            </p>

            <p>
                📍 {taller.direccion}
            </p>

            <p>
                📞 {taller.telefono}
            </p>

            <hr />

            <button>
                Agendar Cita
            </button>

        </div>

    );

}

export default PerfilTaller;