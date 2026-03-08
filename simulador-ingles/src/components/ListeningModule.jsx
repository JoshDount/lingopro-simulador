import { useState, useEffect } from 'react';

export default function ListeningModule() {
  const [ejercicio, setEjercicio] = useState({ full_sentence: "", display_sentence: "", correct_word: "" });
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState({ mensaje: "", tipo: "" });
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargarIA(); }, []);

  const cargarIA = async () => {
    setCargando(true);
    setUserInput("");
    setFeedback({ mensaje: "", tipo: "" });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ia/generar/listening`);
      const data = await res.json();
      
      const oracionManejada = data.original || data.full_sentence || "The API didn't return a valid sentence.";
      const palabraOculta = data.missing || data.correct_word || "API";

      setEjercicio({
        full_sentence: oracionManejada,
        display_sentence: oracionManejada.replace(new RegExp(palabraOculta, 'i'), "_______"),
        correct_word: palabraOculta
      });
    } catch (e) { 
      console.error("Error en Listening IA", e); 
      setEjercicio({
        full_sentence: "Error loading the exercise.",
        display_sentence: "Error loading the _______.",
        correct_word: "exercise"
      });
    }
    finally { setCargando(false); }
  };

  const hablar = () => {
    window.speechSynthesis.cancel();
    const textoALeer = ejercicio.full_sentence || "Please load a new exercise";
    const s = new SpeechSynthesisUtterance(textoALeer);
    s.lang = 'en-US';
    s.rate = 0.85; 
    window.speechSynthesis.speak(s);
  };

  const guardarNota = async (puntajeFinal) => {
    const id_usuario = localStorage.getItem('id_usuario'); 
    if (!id_usuario) return; 

    try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/progreso/guardar`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({
                id_usuario: id_usuario,
                modulo: 'listening', 
                aciertos: puntajeFinal // Ahora mandamos el 10 o el 0
            })
        });
        console.log(`Puntaje de ${puntajeFinal}/10 guardado.`);
    } catch (error) {
        console.error("Error al guardar la calificación:", error);
    }
  };

  // --- LÓGICA DE CALIFICACIÓN ACTUALIZADA ---
  const verificar = () => {
    let puntaje = 0;
    
    // 1. Verificamos si es correcto
    const miPalabra = userInput.toLowerCase().replace(/[.,?!]/g, '').trim();
    const palabraIA = ejercicio.correct_word.toLowerCase().replace(/[.,?!]/g, '').trim();

    if (miPalabra === palabraIA) {
      puntaje = 10;
      setFeedback({ mensaje: "✅ ¡Perfecto! Calificación: 10/10. Cambiando de ejercicio...", tipo: "text-green-600" });
    } else {
      puntaje = 0;
      setFeedback({ mensaje: `❌ Incorrecto. Era: "${ejercicio.correct_word}". Calificación: 0/10. Cambiando...`, tipo: "text-red-500" });
    }

    // 2. Guardamos la nota en MySQL
    guardarNota(puntaje);

    // 3. Pausa de 2.5 segundos y cargamos el siguiente automáticamente
    setTimeout(() => {
        cargarIA();
    }, 2500);
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">🎧 Listening Challenge</h2>
        
        <div className="bg-slate-50 p-8 rounded-2xl mb-6 text-center border border-dashed border-slate-200">
          {cargando ? <div className="animate-pulse h-6 bg-slate-200 rounded w-3/4 mx-auto"></div> : (
            <p className="text-xl font-mono font-bold text-slate-600 tracking-tight">
              {ejercicio.display_sentence}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <button onClick={hablar} disabled={cargando} className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-2xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2">
            <span className="text-xl">🔊</span> Escuchar Oración
          </button>

          <input 
            type="text" 
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={cargando}
            placeholder="Escribe la palabra faltante..."
            className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-blue-400 outline-none text-center font-bold text-slate-700 disabled:opacity-50"
          />

          <div className="grid grid-cols-1 gap-4">
            <button onClick={verificar} disabled={cargando || userInput === ""} className="bg-black text-white font-bold py-3 rounded-2xl hover:bg-slate-800 shadow-lg disabled:opacity-50 uppercase tracking-wider active:scale-95 transition-all">
              Revisar y Continuar
            </button>
          </div>
        </div>
        
        <p className={`mt-4 text-center font-black ${feedback.tipo}`}>{feedback.mensaje}</p>
    </div>
  );
}