const permitirRoles = (...rolesPermitidos) => (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            mensaje: 'Autenticacion requerida'
        });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
            mensaje: 'No tienes permiso para realizar esta accion'
        });
    }

    next();
};

module.exports = permitirRoles;
