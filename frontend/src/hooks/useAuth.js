import { useContext } from "react";
import AuthContext from "../context/authContextDefinition";

function useAuth() {
    const contexto = useContext(AuthContext);

    if (!contexto) {
        throw new Error("useAuth debe utilizarse dentro de AuthProvider");
    }

    return contexto;
}

export default useAuth;
