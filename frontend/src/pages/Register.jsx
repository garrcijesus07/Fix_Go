import { useState } from "react";
import api from "../services/api";

function Register() {

    const [form, setForm] = useState({
        nombre: "",
        correo: "",
        password: "",
        rol: "cliente"
    });

    const registrar = async (e) => {

        e.preventDefault();

        try {

            await api.post(
                "/auth/register",
                form
            );

            alert("Usuario registrado");

        } catch (error) {

            alert("Error al registrar");

        }

    };

    return (

        <div>

            <h1>Registro</h1>

            <form onSubmit={registrar}>

                <input
                    placeholder="Nombre"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            nombre: e.target.value
                        })
                    }
                />

                <br /><br />

                <input
                    placeholder="Correo"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            correo: e.target.value
                        })
                    }
                />

                <br /><br />

                <input
                    type="password"
                    placeholder="Contraseña"
                    onChange={(e) =>
                        setForm({
                            ...form,
                            password: e.target.value
                        })
                    }
                />

                <br /><br />

                <select
                    onChange={(e) =>
                        setForm({
                            ...form,
                            rol: e.target.value
                        })
                    }
                >
                    <option value="cliente">
                        Cliente
                    </option>

                    <option value="mecanico">
                        Mecánico
                    </option>

                    <option value="taller">
                        Taller
                    </option>
                </select>

                <br /><br />

                <button type="submit">
                    Registrarse
                </button>

                <p>
                    ¿Ya tienes cuenta?
                    <a href="/"> Iniciar sesión</a>
                </p>

            </form>

        </div>

    );

}

export default Register;