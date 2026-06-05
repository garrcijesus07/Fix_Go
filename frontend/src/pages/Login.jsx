import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Login.css";

function Login() {

    const navigate = useNavigate();

    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");

    const login = async (e) => {

        e.preventDefault();

        try {

            const response = await api.post(
                "/auth/login",
                {
                    correo,
                    password
                }
            );

            const data = response.data;

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "rol",
                data.rol
            );

            switch (data.rol) {

                case "administrador":
                    navigate("/admin");
                    break;

                case "taller":
                    navigate("/taller");
                    break;

                case "mecanico":
                    navigate("/mecanico");
                    break;

                case "cliente":
                    navigate("/cliente");
                    break;

                default:
                    navigate("/");
            }

        } catch (error) {

            alert("Credenciales incorrectas");

        }

    };

    return (

        <div className="login-container">

            <div className="login-card">

                <div className="logo-section">
                    <h1>Fix-Go</h1>
                    <p>Tu taller de confianza</p>
                </div>

                <h2>Iniciar Sesión</h2>

                <form onSubmit={login}>

                    <input
                        type="email"
                        placeholder="Correo electrónico"
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

                    <button type="submit">
                        Ingresar
                    </button>

                </form>

                <p
                    className="register-link"
                    onClick={() => navigate("/register")}
                >
                    ¿No tienes cuenta? Regístrate
                </p>

            </div>

        </div>

    );

}

export default Login;