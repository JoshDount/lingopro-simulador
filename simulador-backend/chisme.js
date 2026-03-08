require('dotenv').config();

// Reemplaza esto con tu API Key real
const API_KEY = process.env.GEMINI_API_KEY; 

console.log("🕵️‍♂️ Preguntándole a Google qué modelos tienes disponibles...");

fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + API_KEY)
  .then(res => res.json())
  .then(data => {
    console.log("\n🔥 RESULTADO DE GOOGLE:");
    if (data.models) {
        // Filtramos solo los modelos que sirven para generar texto
        const modelosDeTexto = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        modelosDeTexto.forEach(m => console.log("✅ Puedes usar:", m.name));
    } else {
        console.log("❌ Error raro de Google:", data);
    }
  })
  .catch(err => console.log("Error de conexión:", err));