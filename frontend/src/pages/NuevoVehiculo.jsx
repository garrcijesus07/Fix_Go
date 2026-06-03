import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function NuevoVehiculo() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        marca: "",
        modelo: "",
        anio: "",
        placas: "",
        color: ""
    });

    const guardarVehiculo = async (e) => {

        e.preventDefault();

        try {

            await api.post(
                "/vehiculos",
                form,
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            alert("Vehículo registrado");

            navigate("/cliente/vehiculos");

        } catch (error) {

            console.error(error);

            alert("Error al registrar");

        }

    };

    return (

        <div style={{ padding: "20px" }}>

            <h1>Registrar Vehículo</h1>

            <form onSubmit={guardarVehiculo}>

                <input
                    placeholder="Marca"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            marca: e.target.value
                        })
                    }
                />

                <br /><br />

                <input
                    placeholder="Modelo"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            modelo: e.target.value
                        })
                    }
                />

                <br /><br />

                <input
                    placeholder="Año"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            anio: e.target.value
                        })
                    }
                />

                <br /><br />

                <input
                    placeholder="Placas"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            placas: e.target.value
                        })
                    }
                />

                <br /><br />

                <input
                    placeholder="Color"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            color: e.target.value
                        })
                    }
                />

                <br /><br />

                <button type="submit">
                    Guardar Vehículo
                </button>

            </form>

        </div>

    );

}

export default NuevoVehiculo;