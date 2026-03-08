require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Inicialización y Middleware
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "itc_culiacan_secret_2026";

// 2. Configuración de MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
    if (err) return console.error('❌ Error MySQL:', err.message);
    console.log('✅ Conectado exitosamente a la base de datos MySQL');
});

// 3. Configuración de la IA de Google
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite-preview",
    generationConfig: { responseMimeType: "application/json" } 
});

// 4. Rutas (Endpoints)

// --- RUTAS DE AUTENTICACIÓN ---

// ✅ CORREGIDO: tabla 'usuarios', columna 'password', columna 'correo'
app.post('/api/auth/registro', async (req, res) => {
    const { nombre, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const query = 'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)';
    db.query(query, [nombre, email, hash], (err) => {
        if (err) {
            console.error("Error al registrar:", err);
            return res.status(500).json({ error: "Error al registrar. El correo puede ya existir." });
        }
        res.json({ mensaje: "Usuario registrado con éxito" });
    });
});

// ✅ NUEVA RUTA: Login (faltaba completamente)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM usuarios WHERE correo = ?', [email], async (err, resultados) => {
        if (err || resultados.length === 0)
            return res.status(401).json({ error: "Usuario no encontrado" });

        const usuario = resultados[0];
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida)
            return res.status(401).json({ error: "Contraseña incorrecta" });

        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, nombre: usuario.nombre },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            token, 
            nombre: usuario.nombre, 
            id_usuario: usuario.id_usuario 
        });
    });
});

// --- RUTA DE ESTADO ---
app.get('/api/estado', (req, res) => {
    res.json({ mensaje: '¡El motor del simulador está encendido!' });
});

// --- RUTA DE LA IA ---
app.get('/api/ia/generar/:modulo', async (req, res) => {
    const modulo = req.params.modulo;
    
    const temas = [
        "a futuristic city on Mars", "a weird cooking disaster in a restaurant", 
        "time travel to the 1980s", "a deep ocean exploration submarine", 
        "a funny misunderstanding at an airport", "surviving a zombie apocalypse", 
        "ancient Egyptian myths", "a secret agent mission gone wrong",
        "a magical forest with talking animals", "extreme sports like skydiving",
        "a chaotic family dinner", "artificial intelligence taking over a smart home",
        "a mystery novel plot", "a music festival in the rain"
    ];
    
    const temaAleatorio = temas[Math.floor(Math.random() * temas.length)];

    // Le decimos a la IA EXACTAMENTE cómo queremos que se llamen las llaves del JSON
    const instrucciones = {
        listening: `Generate a highly unique and creative sentence STRICTLY IN ENGLISH about: ${temaAleatorio}. It MUST be different from typical examples. Return JSON: { "original": "full english sentence", "missing": "one key word" }`,
        
        reading: `Create a unique 50-word story STRICTLY IN ENGLISH about: ${temaAleatorio}. Then create 3 multiple choice questions. CRITICAL RULES: 1) The "correcta" field MUST be ONLY a single lowercase letter: "a", "b", "c" or "d". NEVER write "a) text" or anything else, ONLY the letter. 2) Return ONLY this JSON, no extra text: { "texto": "...", "preguntas": [ { "pregunta": "...", "opciones": { "a": "...", "b": "...", "c": "...", "d": "..." }, "correcta": "b" } ] }`,
        
        writing: `Give a creative writing challenge STRICTLY IN ENGLISH for a student. The topic MUST be about: ${temaAleatorio}. Return JSON: { "prompt": "..." }`,
        
        speaking: `Generate a unique, natural conversational sentence STRICTLY IN ENGLISH (10-15 words) about: ${temaAleatorio}. Return JSON: { "text_to_speak": "..." }`
    };

    try {
        const prompt = instrucciones[modulo] || instrucciones.listening;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        let textoBruto = response.text();
        const textoLimpio = textoBruto.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(textoLimpio);
        
        res.json(data);
    } catch (error) {
        console.error("🚨 ERROR IA:", error);
        res.status(500).json({ error: "No se pudo generar el ejercicio" });
    }
});

// ==========================================
//    MIDDLEWARE DE SEGURIDAD (JWT)
// ==========================================
const verificarToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    
    try {
        const verificado = jwt.verify(token, JWT_SECRET);
        req.usuario = verificado;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token inválido o expirado.' });
    }
};

// ==========================================
//    RANKING
// ==========================================
app.get('/api/ranking', verificarToken, (req, res) => {
    const query = `
        SELECT 
            u.nombre, 
            ROUND(AVG(h.puntaje), 1) AS promedio, 
            COUNT(h.id_practica) AS total_ejercicios
        FROM usuarios u
        JOIN historial_practicas h ON u.id_usuario = h.id_usuario
        GROUP BY u.id_usuario
        ORDER BY promedio DESC, total_ejercicios DESC
        LIMIT 10
    `;
    
    db.query(query, (err, resultados) => {
        if (err) {
            console.error("Error al generar ranking:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
        }
        res.json(resultados);
    });
});

// ==========================================
//    RUTAS DE PROGRESO Y CALIFICACIONES
// ==========================================

// GUARDAR LA NOTA
app.post('/api/progreso/guardar', (req, res) => {
    const { id_usuario, modulo, aciertos } = req.body; 
    
    // CORRECCIÓN: Cambiamos el '1' por 'NULL' para que MySQL no pida que exista un ejercicio previo
    const query = 'INSERT INTO historial_practicas (id_usuario, id_ejercicio, puntaje, texto_ingresado) VALUES (?, NULL, ?, ?)';
    
    db.query(query, [id_usuario, aciertos, modulo], (err) => {
        if (err) {
            console.error("Error al guardar en BD:", err);
            return res.status(500).json({ error: "Error de base de datos" });
        }
        res.json({ mensaje: "Nota registrada exitosamente" });
    });
});

// LEER LAS NOTAS
app.get('/api/progreso/:id_usuario', (req, res) => {
    const id_usuario = req.params.id_usuario;
    
    const query = `
        SELECT 
            texto_ingresado AS modulo, 
            puntaje AS aciertos, 
            fecha_practica AS fecha 
        FROM historial_practicas 
        WHERE id_usuario = ? 
        ORDER BY fecha_practica DESC
    `;
    
    db.query(query, [id_usuario], (err, resultados) => {
        if (err) {
            console.error("Error al leer historial:", err);
            return res.status(500).json({ error: "Error al consultar la base de datos" });
        }
        res.json(resultados);
    });
});

// 5. Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Servidor en puerto ' + PORT);
});