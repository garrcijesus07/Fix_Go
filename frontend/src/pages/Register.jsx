import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import "../styles/Register.css";

function Register() {

    const navigate = useNavigate();

    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [rol, setRol] = useState("cliente");

    const registrar = async (e) => {

        e.preventDefault();

        try {

            await api.post(
                "/auth/register",
                {
                    nombre,
                    correo,
                    password,
                    rol
                }
            );

            alert("Usuario registrado correctamente");

            navigate("/");

        } catch (error) {

            alert("Error al registrar usuario");

        }

    };

    return (

        <div className="register-container">

            <div className="register-card">

                <h1>Fix-Go</h1>

                <p>Crear cuenta</p>

                <form onSubmit={registrar}>

                    <input
                        type="text"
                        placeholder="Nombre"
                        value={nombre}
                        onChange={(e) =>
                            setNombre(e.target.value)
                        }
                        required
                    />

                    <input
                        type="email"
                        placeholder="Correo"
                        value={correo}
                        onChange={(e) =>
                            setCorreo(e.target.value)
                        }
                        required
                    />

                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                    />

                    <select
                        value={rol}
                        onChange={(e) =>
                            setRol(e.target.value)
                        }
                    >
                        <option value="cliente">
                            Cliente
                        </option>

                        <option value="taller">
                            Taller
                        </option>

                        <option value="mecanico">
                            Mecánico
                        </option>
                    </select>

                    <button type="submit">
                        Registrarse
                    </button>

                </form>

                <p
                    className="login-link"
                    onClick={() => navigate("/")}
                >
                    ¿Ya tienes cuenta? Inicia sesión
                </p>

            </div>

        </div>

    );

}

export default Register;