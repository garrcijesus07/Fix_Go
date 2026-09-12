import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/NuevoVehiculo.css";

function NuevoVehiculo() {

    const navigate = useNavigate();
    const { id } = useParams();
    const editando = Boolean(id);

    const [form, setForm] = useState({
        marca: "",
        modelo: "",
        anio: "",
        placas: "",
        color: ""
    });

    useEffect(() => {

        if (!editando) {
            return;
        }

        const obtenerVehiculo = async () => {

            try {

                const response = await api.get(
                    `/vehiculos/${id}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const { marca, modelo, anio, placas, color } = response.data;

                setForm({ marca, modelo, anio, placas, color });

            } catch (error) {

                console.error(error);
                alert(
                    error.response?.data?.mensaje ||
                    "Error al cargar el vehículo"
                );
                navigate("/cliente/vehiculos");

            }

        };

        obtenerVehiculo();

    }, [editando, id, navigate]);

    const guardarVehiculo = async (e) => {

        e.preventDefault();

        try {

            const metodo = editando ? api.put : api.post;
            const url = editando ? `/vehiculos/${id}` : "/vehiculos";

            await metodo(
                url,
                form,
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            alert(
                editando
                    ? "Vehículo actualizado"
                    : "Vehículo registrado"
            );

            navigate("/cliente/vehiculos");

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.mensaje ||
                (editando
                    ? "Error al actualizar"
                    : "Error al registrar")
            );

        }

    };

    return (

        <div className="nuevo-vehiculo-container">

            <div className="nuevo-vehiculo-card">

                <h1>
                    {editando
                        ? "Editar Vehículo"
                        : "Registrar Vehículo"}
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
                        {editando
                            ? "Guardar cambios"
                            : "Guardar Vehículo"}
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
