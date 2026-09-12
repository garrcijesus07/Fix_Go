const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {

    const { nombre, correo, password, rol } = req.body;
    const rolesRegistroPublico = ['cliente', 'taller', 'mecanico'];

    if (rol === 'administrador') {
        return res.status(403).json({
            mensaje: 'No esta permitido registrar administradores'
        });
    }

    if (!rolesRegistroPublico.includes(rol)) {
        return res.status(400).json({
            mensaje: 'Rol no permitido para registro publico'
        });
    }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO usuarios
            (nombre, correo, password, rol)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [nombre, correo, hashedPassword, rol],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.status(201).json({
                    mensaje: 'Usuario registrado correctamente'
                });

            }
        );

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

};

exports.login = (req, res) => {

    const { correo, password } = req.body;

    db.query(
        'SELECT * FROM usuarios WHERE correo = ?',
        [correo],
        async (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    mensaje: 'Usuario no encontrado'
                });
            }

            const usuario = result[0];

            const passwordCorrecta = await bcrypt.compare(
                password,
                usuario.password
            );

            if (!passwordCorrecta) {

                return res.status(401).json({
                    mensaje: 'Contraseña incorrecta'
                });

            }

            const token = jwt.sign(
                {
                    id: usuario.id,
                    rol: usuario.rol
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '8h'
                }
            );

            res.json({
                mensaje: 'Login correcto',
                token,
                usuario: usuario.nombre,
                rol: usuario.rol
            });

        }
    );

};
