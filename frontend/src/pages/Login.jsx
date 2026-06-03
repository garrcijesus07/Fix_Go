import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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

        <div>
            <h1>Iniciar Sesión</h1>

            <form onSubmit={login}>

                <input
                    type="email"
                    placeholder="Correo"
                    value={correo}
                    onChange={(e) =>
                        setCorreo(e.target.value)
                    }
                />

                <br /><br />

                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <br /><br />

                <button type="submit">
                    Ingresar
                </button>
                <p>
                    ¿No tienes cuenta?
                    <a href="/register"> Registrarse</a>
                </p>

            </form>
        </div>

    );

}

export default Login;