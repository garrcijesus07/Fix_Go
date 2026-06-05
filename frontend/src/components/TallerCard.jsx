import { Link } from "react-router-dom";

import "../styles/TallerCard.css";

function TallerCard({ taller }) {

    return (

        <div className="taller-card">

            <h2>
                {taller.nombre}
            </h2>

            <p>
                {taller.descripcion}
            </p>

            <p>
                📍 {taller.direccion}
            </p>

            <p>
                📞 {taller.telefono}
            </p>

            <Link
                className="taller-card-link"
                to={`/cliente/taller/${taller.id}`}
            >

                <button
                    className="taller-card-btn"
                >
                    Ver Perfil
                </button>

            </Link>

        </div>

    );

}

export default TallerCard;