require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Inicialización y Middleware (¡Esto siempre va primero!)
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "itc_culiacan_secret_2026";

// 2. Configuración de MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'simulador_pro'
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
app.post('/api/auth/registro', async (req, res) => {
    const { nombre, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const query = 'INSERT INTO alumnos (nombre, email, password_hash) VALUES (?, ?, ?)';
    db.query(query, [nombre, email, hash], (err) => {
        if (err) return res.status(500).json({ error: "Error al registrar" });
        res.json({ mensaje: "Alumno registrado con éxito" });
    });
});

// --- RUTA DE ESTADO ---
app.get('/api/estado', (req, res) => {
    res.json({ mensaje: '¡El motor del simulador está encendido!' });
});

// --- RUTA DE LA IA ---
// --- RUTA DE LA IA (Actualizada para máxima variedad) ---
app.get('/api/ia/generar/:modulo', async (req, res) => {
    const modulo = req.params.modulo;
    
    // 1. LA MAGIA: Creamos un banco de temas aleatorios y creativos
    const temas = [
        "a futuristic city on Mars", "a weird cooking disaster in a restaurant", 
        "time travel to the 1980s", "a deep ocean exploration submarine", 
        "a funny misunderstanding at an airport", "surviving a zombie apocalypse", 
        "ancient Egyptian myths", "a secret agent mission gone wrong",
        "a magical forest with talking animals", "extreme sports like skydiving",
        "a chaotic family dinner", "artificial intelligence taking over a smart home",
        "a mystery novel plot", "a music festival in the rain"
    ];
    
    // 2. Escogemos un tema diferente en cada petición
    const temaAleatorio = temas[Math.floor(Math.random() * temas.length)];

    // 3. Le exigimos a la IA que use el tema aleatorio y sea original
    const instrucciones = {
        listening: `Generate a highly unique and creative sentence STRICTLY IN ENGLISH about: ${temaAleatorio}. It MUST be different from typical examples. Return JSON: { "original": "full english sentence", "missing": "one key word" }`,
        
        reading: `Create a unique 50-word story STRICTLY IN ENGLISH about: ${temaAleatorio}. Make the plot interesting and unpredictable. Then create 3 multiple choice questions about it. Return JSON: { "texto": "...", "preguntas": [...] }`,
        
        writing: `Give a creative writing challenge STRICTLY IN ENGLISH for a student. The topic MUST be about: ${temaAleatorio}. Return JSON: { "prompt": "..." }`,
        
        speaking: `Generate a unique, natural conversational sentence STRICTLY IN ENGLISH (10-15 words) about: ${temaAleatorio}. Return JSON: { "text_to_speak": "..." }`
    };

    try {
        const prompt = instrucciones[modulo] || instrucciones.listening;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Limpiamos el JSON para evitar errores en React
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
    // Pedimos el token que viene en los "Headers" de la petición
    const token = req.header('Authorization');
    
    if (!token) return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    
    try {
        // Verificamos que la firma sea la tuya y no esté falsificada
        const verificado = jwt.verify(token, JWT_SECRET);
        req.usuario = verificado;
        next(); // Si el token es real, lo dejamos pasar a la ruta
    } catch (error) {
        res.status(400).json({ error: 'Token inválido o expirado.' });
    }
};

// ==========================================
//    NUEVA RUTA: SALÓN DE LA FAMA (RANKING)
// ==========================================
app.get('/api/ranking', verificarToken, (req, res) => {
    // CORRECCIÓN: Apuntamos a tu tabla 'usuarios' y cruzamos los datos con 'historial_practicas'
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

// 1. GUARDAR LA NOTA (De React a MySQL)
app.post('/api/progreso/guardar', (req, res) => {
    const { id_usuario, modulo, aciertos } = req.body; 
    
    // Guardamos en historial_practicas
    const query = 'INSERT INTO historial_practicas (id_usuario, id_ejercicio, puntaje, texto_ingresado) VALUES (?, 1, ?, ?)';
    
    db.query(query, [id_usuario, aciertos, modulo], (err) => {
        if (err) {
            console.error("Error al guardar en BD:", err);
            return res.status(500).json({ error: "Error de base de datos" });
        }
        res.json({ mensaje: "Nota registrada exitosamente" });
    });
});

// 2. LEER LAS NOTAS (De MySQL a React para 'Ver Mis Notas')
app.get('/api/progreso/:id_usuario', (req, res) => {
    const id_usuario = req.params.id_usuario;
    
    // Pedimos a la BD las columnas exactas de tu tabla, 
    // y usamos "AS" para que React las reciba con los nombres que espera
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
        // Le enviamos la lista de calificaciones a React
        res.json(resultados);
    });
});
// 5. Iniciar el servidor (¡Siempre al final!)
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});