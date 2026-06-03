import { Link } from "react-router-dom";

function TallerCard({ taller }) {

    return (
        <div
            style={{
                border: "1px solid #ccc",
                padding: "15px",
                marginBottom: "15px",
                borderRadius: "10px"
            }}
        >
            <h2>{taller.nombre}</h2>

            <p>{taller.descripcion}</p>

            <p>
                📍 {taller.direccion}
            </p>

            <p>
                📞 {taller.telefono}
            </p>

            <Link
                to={`/cliente/taller/${taller.id}`}
            >
                <button>
                    Ver Perfil
                </button>
            </Link>

        </div>
    );

}

export default TallerCard;