import { useCallback, useEffect, useMemo, useState } from "react";
import AuthContext from "./authContextDefinition";

const rolesValidos = ["administrador", "taller", "mecanico", "cliente"];

const decodificarToken = (token) => {
    try {
        const payloadBase64 = token.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        const payload = decodeURIComponent(
            atob(payloadBase64)
                .split("")
                .map((caracter) =>
                    `%${caracter.charCodeAt(0).toString(16).padStart(2, "0")}`
                )
                .join("")
        );

        return JSON.parse(payload);
    } catch {
        return null;
    }
};

const obtenerSesionInicial = () => {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");

    if (!token || !rol) {
        return { token: null, rol: null };
    }

    const payload = decodificarToken(token);
    const expirado = !payload?.exp || payload.exp * 1000 <= Date.now();
    const rolInvalido = !rolesValidos.includes(rol) || payload?.rol !== rol;

    if (!payload || expirado || rolInvalido) {
        localStorage.removeItem("token");
        localStorage.removeItem("rol");
        return { token: null, rol: null };
    }

    return { token, rol };
};

function AuthProvider({ children }) {
    const [sesion, setSesion] = useState(obtenerSesionInicial);

    const login = useCallback((token, rol) => {
        localStorage.setItem("token", token);
        localStorage.setItem("rol", rol);
        setSesion({ token, rol });
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("rol");
        setSesion({ token: null, rol: null });
    }, []);

    useEffect(() => {
        const cerrarSesion = () => logout();
        const sincronizarSesion = () => setSesion(obtenerSesionInicial());

        window.addEventListener("auth:logout", cerrarSesion);
        window.addEventListener("storage", sincronizarSesion);

        return () => {
            window.removeEventListener("auth:logout", cerrarSesion);
            window.removeEventListener("storage", sincronizarSesion);
        };
    }, [logout]);

    useEffect(() => {
        if (!sesion.token) return undefined;

        const payload = decodificarToken(sesion.token);
        const tiempoRestante = payload?.exp * 1000 - Date.now();

        if (!tiempoRestante || tiempoRestante <= 0) {
            const temporizadorExpirado = window.setTimeout(logout, 0);
            return () => window.clearTimeout(temporizadorExpirado);
        }

        const temporizador = window.setTimeout(logout, tiempoRestante);
        return () => window.clearTimeout(temporizador);
    }, [sesion.token, logout]);

    const valor = useMemo(() => ({
        token: sesion.token,
        rol: sesion.rol,
        autenticado: Boolean(sesion.token),
        login,
        logout
    }), [sesion, login, logout]);

    return (
        <AuthContext.Provider value={valor}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
