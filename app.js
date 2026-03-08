// --- 1. NUESTRA "IA" (Base de datos local) ---
const bancoDeEjercicios = {
    listening: [
        "The quick brown fox jumps over the lazy dog.",
        "Learning backend development requires understanding databases.",
        "Playing sports outdoors is a great way to stay healthy, but remember sunscreen.",
        "Cybersecurity is crucial for protecting personal data on the internet."
    ],
    speaking: [
        "I am practicing my English skills today.",
        "I really enjoy playing video games on my console.",
        "A strong database is the heart of a good application.",
        "The weather gets extremely hot here during the summer."
    ],
    writing: [
        "Write at least 15 words explaining why you enjoy your favorite video game.",
        "Describe a team sport you like to play (like volleyball) and explain its basic rules.",
        "Write about the importance of protecting your passwords online.",
        "Describe your favorite perfume or scent, and when you prefer to wear it."
    ],
    reading: [
        {
            texto: "Phishing is a type of cyber attack where attackers deceive people into revealing sensitive information. They often use fake emails that look like they come from trusted companies to steal passwords.",
            preguntas: [
                { id: "q1", text: "What is the main goal of phishing?", opciones: { a: "Fix viruses", b: "Steal information", c: "Send emails" }, correcta: "b" },
                { id: "q2", text: "What tool do attackers commonly use for phishing?", opciones: { a: "Fake emails", b: "Phone calls", c: "USB drives" }, correcta: "a" }
            ]
        },
        {
            texto: "Volleyball is a team sport played by two teams of six players separated by a net. Each team tries to score points by grounding a ball on the other team's court under organized rules.",
            preguntas: [
                { id: "q1", text: "How many players are on a volleyball team?", opciones: { a: "Five", b: "Six", c: "Eleven" }, correcta: "b" },
                { id: "q2", text: "What separates the two teams?", opciones: { a: "A wall", b: "A net", c: "A line" }, correcta: "b" }
            ]
        }
    ]
};

// Variable global para guardar las respuestas correctas del reading actual
let respuestasCorrectasActuales = {};

// --- 2. MOTOR DE GENERACIÓN ALEATORIA ---
function obtenerElementoAleatorio(arreglo) {
    const indice = Math.floor(Math.random() * arreglo.length);
    return arreglo[indice];
}

function generarNuevosEjercicios() {
    // Limpiar feedbacks anteriores
    document.getElementById('feedback-speaking').innerText = '';
    document.getElementById('resultado-voz').innerText = '';
    document.getElementById('feedback-reading').innerText = '';
    document.getElementById('feedback-writing').innerText = '';
    document.getElementById('texto-writing').value = '';
    document.getElementById('contador-palabras').innerText = '0';

    // Asignar Listening, Speaking y Writing
    document.getElementById('texto-escuchar').innerText = obtenerElementoAleatorio(bancoDeEjercicios.listening);
    document.getElementById('texto-objetivo').innerText = obtenerElementoAleatorio(bancoDeEjercicios.speaking);
    document.getElementById('texto-prompt').innerText = "Prompt: " + obtenerElementoAleatorio(bancoDeEjercicios.writing);

    // Asignar Reading (Texto y Preguntas Dinámicas)
    const ejercicioReading = obtenerElementoAleatorio(bancoDeEjercicios.reading);
    document.getElementById('texto-reading').innerText = `"${ejercicioReading.texto}"`;
    
    const contenedorPreguntas = document.getElementById('contenedor-preguntas');
    contenedorPreguntas.innerHTML = ''; // Limpiar preguntas anteriores
    respuestasCorrectasActuales = {}; // Resetear diccionario de respuestas

    ejercicioReading.preguntas.forEach((pregunta, index) => {
        respuestasCorrectasActuales[pregunta.id] = pregunta.correcta;
        
        // Inyectamos el HTML de cada pregunta
        contenedorPreguntas.innerHTML += `
            <div class="mb-2">
                <p class="font-bold text-slate-700 mb-1">${index + 1}. ${pregunta.text}</p>
                <div class="flex flex-col gap-1 pl-2">
                    <label class="cursor-pointer text-sm flex items-center gap-2">
                        <input type="radio" name="${pregunta.id}" value="a" class="w-4 h-4 text-amber-500"> A) ${pregunta.opciones.a}
                    </label>
                    <label class="cursor-pointer text-sm flex items-center gap-2">
                        <input type="radio" name="${pregunta.id}" value="b" class="w-4 h-4 text-amber-500"> B) ${pregunta.opciones.b}
                    </label>
                    <label class="cursor-pointer text-sm flex items-center gap-2">
                        <input type="radio" name="${pregunta.id}" value="c" class="w-4 h-4 text-amber-500"> C) ${pregunta.opciones.c}
                    </label>
                </div>
            </div>
        `;
    });
}

// --- 3. FUNCIONES DE EVALUACIÓN Y NATIVAS ---

// Listening
function reproducirAudio() {
    const texto = document.getElementById('texto-escuchar').innerText;
    const locutor = new SpeechSynthesisUtterance(texto);
    locutor.lang = 'en-US'; locutor.rate = 0.9;
    window.speechSynthesis.speak(locutor);
}

// Speaking
function iniciarMicrofono() {
    if (!('webkitSpeechRecognition' in window)) return alert("Usa Google Chrome o Edge.");
    
    const reconocimiento = new webkitSpeechRecognition();
    reconocimiento.lang = 'en-US'; reconocimiento.continuous = false;

    const btn = document.getElementById('btn-hablar');
    const textoObjetivo = document.getElementById('texto-objetivo').innerText.toLowerCase().replace(/[.,]/g, '');

    reconocimiento.onstart = () => {
        btn.innerText = "🔴 Escuchando..."; btn.classList.replace('bg-emerald-500', 'bg-red-500');
    };

    reconocimiento.onresult = (event) => {
        const transcripcion = event.results[0][0].transcript.toLowerCase().replace(/[.,]/g, '');
        document.getElementById('resultado-voz').innerText = `"${transcripcion}"`;
        const fb = document.getElementById('feedback-speaking');
        
        if (transcripcion === textoObjetivo) {
            fb.innerText = "✅ ¡Perfecto!"; fb.className = "mt-2 font-bold text-green-600 text-center";
        } else {
            fb.innerText = "❌ Casi. Intenta de nuevo."; fb.className = "mt-2 font-bold text-red-500 text-center";
        }
    };

    reconocimiento.onend = () => {
        btn.innerText = "Presiona y Habla"; btn.classList.replace('bg-red-500', 'bg-emerald-500');
    };
    reconocimiento.start();
}

// Reading (Evaluación múltiple)
function evaluarReading() {
    let score = 0;
    const totalPreguntas = Object.keys(respuestasCorrectasActuales).length;
    let todasRespondidas = true;

    for (const [idPregunta, respuestaCorrecta] of Object.entries(respuestasCorrectasActuales)) {
        const opciones = document.getElementsByName(idPregunta);
        let respondida = false;
        
        for (let op of opciones) {
            if (op.checked) {
                respondida = true;
                if (op.value === respuestaCorrecta) score++;
                break;
            }
        }
        if (!respondida) todasRespondidas = false;
    }

    const fb = document.getElementById('feedback-reading');
    if (!todasRespondidas) {
        fb.innerText = "⚠️ Responde todas las preguntas."; fb.className = "mt-3 font-bold text-amber-600 text-center";
        return;
    }

    if (score === totalPreguntas) {
        fb.innerText = `✅ ¡Excelente! ${score}/${totalPreguntas} correctas.`; fb.className = "mt-3 font-bold text-green-600 text-center";
    } else {
        fb.innerText = `❌ Tuviste ${score}/${totalPreguntas}. Revisa el texto.`; fb.className = "mt-3 font-bold text-red-500 text-center";
    }
}

// --- 4. Módulo de Writing (Evaluación Gramatical con IA) ---

// El contador de palabras en tiempo real se queda igual
document.getElementById('texto-writing').addEventListener('input', function() {
    const texto = this.value.trim();
    document.getElementById('contador-palabras').innerText = texto === "" ? 0 : texto.split(/\s+/).length;
});

async function evaluarWriting() {
    const texto = document.getElementById('texto-writing').value.trim();
    const fb = document.getElementById('feedback-writing');
    const correccionesHTML = document.getElementById('correcciones-writing');
    const cantPalabras = texto === "" ? 0 : texto.split(/\s+/).length;

    // Limpiamos resultados anteriores
    correccionesHTML.innerHTML = '';

    // 1. Validar longitud mínima
    if (cantPalabras === 0) { 
        fb.innerText = "⚠️ Escribe algo primero."; fb.className = "font-bold text-amber-500"; 
        return; 
    }
    if (cantPalabras < 15) { 
        fb.innerText = "❌ Necesitas 15 palabras mínimo."; fb.className = "font-bold text-red-500"; 
        return; 
    }

    // 2. Si pasa la longitud, llamamos a la API de LanguageTool
    fb.innerText = "⏳ Analizando gramática..."; 
    fb.className = "font-bold text-blue-500";

    try {
        // Hacemos la petición POST a la API pública
        const respuesta = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                text: texto,
                language: 'en-US' // Evaluamos en inglés
            })
        });

        const datos = await respuesta.json();
        const errores = datos.matches; // Aquí viene la lista de errores

        // 3. Sistema de Calificación (Base 100, restamos 10 puntos por cada error)
        let calificacion = 100 - (errores.length * 10);
        if (calificacion < 0) calificacion = 0;

        if (errores.length === 0) {
            fb.innerText = `✅ ¡Perfecto! Calificación: 100/100`; 
            fb.className = "font-bold text-green-600";
        } else {
            fb.innerText = `⚠️ Calificación: ${calificacion}/100. Tienes ${errores.length} error(es).`; 
            fb.className = "font-bold text-amber-600";
            
            // 4. Mostrar el detalle de los errores
            errores.forEach(error => {
                // Tomamos las primeras 3 sugerencias (si existen)
                const sugerencias = error.replacements.slice(0, 3).map(r => r.value).join(", ");
                const palabraEquivocada = texto.substring(error.offset, error.offset + error.length);

                correccionesHTML.innerHTML += `
                    <div class="bg-red-50 p-3 rounded border-l-4 border-red-400">
                        <p class="text-slate-700"><strong>Error detectado:</strong> "${palabraEquivocada}"</p>
                        <p class="text-slate-600 text-xs italic mb-1">${error.message}</p>
                        ${sugerencias ? `<p class="text-green-700 font-medium">💡 Sugerencia: ${sugerencias}</p>` : ''}
                    </div>
                `;
            });
        }

    } catch (error) {
        console.error("Error en la API:", error);
        fb.innerText = "❌ Error al conectar con el servidor de evaluación."; 
        fb.className = "font-bold text-red-500";
    }
}
generarNuevosEjercicios();