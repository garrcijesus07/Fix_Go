import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/NuevoVehiculo.css";

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

        <div className="nuevo-vehiculo-container">

            <div className="nuevo-vehiculo-card">

                <h1>
                    🚗 Registrar Vehículo
                </h1>

                <form
                    className="nuevo-vehiculo-form"
                    onSubmit={guardarVehiculo}
                >

                    <input
                        placeholder="Marca"
                        value={form.marca}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                marca: e.target.value
                            })
                        }
                        required
                    />

                    <input
                        placeholder="Modelo"
                        value={form.modelo}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                modelo: e.target.value
                            })
                        }
                        required
                    />

                    <input
                        type="number"
                        placeholder="Año"
                        value={form.anio}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                anio: e.target.value
                            })
                        }
                        required
                    />

                    <input
                        placeholder="Placas"
                        value={form.placas}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                placas: e.target.value
                            })
                        }
                        required
                    />

                    <input
                        placeholder="Color"
                        value={form.color}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                color: e.target.value
                            })
                        }
                        required
                    />

                    <button
                        type="submit"
                        className="guardar-btn"
                    >
                        Guardar Vehículo
                    </button>

                    <button
                        type="button"
                        className="cancelar-btn"
                        onClick={() =>
                            navigate("/cliente/vehiculos")
                        }
                    >
                        Cancelar
                    </button>

                </form>

            </div>

        </div>

    );
}

export default NuevoVehiculo;