LingoPro - Simulador de Inglés Avanzado con IA 🚀

LingoPro es una plataforma educativa Full-Stack que utiliza Inteligencia Artificial (Google Gemini) para generar retos de aprendizaje dinámicos. Evalúa las cuatro habilidades lingüísticas fundamentales (Reading, Listening, Speaking, Writing) mediante una arquitectura moderna distribuida en la nube.

🛠️ Tecnologías Utilizadas
Frontend (Vercel)
React + Vite: Interfaz de usuario rápida y reactiva.

Tailwind CSS: Diseño moderno, responsivo y basado en componentes.

Web Speech API: Utilizada para la síntesis de voz (Listening) y reconocimiento de voz (Speaking).

Backend (Render)
Node.js & Express: Servidor robusto para manejar la lógica de negocio y autenticación.

Google Generative AI (Gemini 3.1 Flash): Motor de IA encargado de generar contenido educativo único en cada sesión.

JWT & Bcrypt: Sistema de seguridad para autenticación de usuarios y protección de contraseñas.

Base de Datos (Aiven)
MySQL: Almacenamiento persistente de usuarios, historial de prácticas y rankings globales.

🌟 Funcionalidades Clave
1. Módulos de Práctica con IA
📖 Reading Module: Genera micro-historias creativas. Incluye una lógica de evaluación humana que normaliza las respuestas de la IA para evitar errores de formato (A/B/C).

🎧 Listening Module: Convierte texto a voz y desafía al usuario a identificar palabras clave. Cuenta con limpieza de puntuación para evitar fallos por puntos o comas.

🎙️ Speaking Module: Compara la pronunciación del usuario contra el texto objetivo de la IA, otorgando un puntaje basado en la precisión de las palabras reconocidas.

✍️ Writing Module: Evalúa la gramática y ortografía del usuario mediante la integración con la API de LanguageTool.

2. Gamificación y Seguimiento
🏆 Ranking Global: Un Top 10 que motiva a los estudiantes comparando promedios y cantidad de ejercicios realizados.

📈 Perfil de Rendimiento: Cálculo automático del nivel estimado del alumno (A1, B1, B2, C1) basado en sus notas históricas.

💻 Instalación y Configuración
Requisitos Previos
Node.js instalado.

Cuenta en Google AI Studio (para la API Key de Gemini).

Base de Datos MySQL activa.

Variables de Entorno (.env)
Servidor (/simulador-backend):

Fragmento de código
PORT=3000
DB_HOST=tu_host_aiven
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=tu_db
GEMINI_API_KEY=tu_key_gemini
JWT_SECRET=tu_secreto_para_tokens
Frontend (/simulador-ingles):

Fragmento de código
VITE_API_URL=https://tu-url-de-render.com

🚀 Despliegue (Deployment)
El proyecto está optimizado para trabajar en entornos distribuidos:

Backend: Desplegado en Render, configurado para reiniciar automáticamente al detectar cambios en la rama main.

Frontend: Desplegado en Vercel, apuntando al directorio raíz de la aplicación React.

Base de Datos: Alojada en Aiven con soporte SSL para conexiones seguras.

👤 Autor
JoshDount - Desarrollo Full-Stack y Arquitectura de IA.
