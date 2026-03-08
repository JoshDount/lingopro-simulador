import { useState, useEffect } from 'react';

export default function SpeakingModule() {
  const [textoObjetivo, setTextoObjetivo] = useState("");
  const [transcripcion, setTranscripcion] = useState("...");
  const [feedback, setFeedback] = useState({ mensaje: "", tipo: "" });
  const [escuchando, setEscuchando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargarIA(); }, []);

  const cargarIA = async () => {
    setCargando(true);
    setTranscripcion("...");
    setFeedback({ mensaje: "", tipo: "" });
    try {
      const res = await fetch('https://lingopro-simulador.onrender.com/api/ia/generar/speaking');
      const data = await res.json();
      setTextoObjetivo(data.text_to_speak); 
    } catch (e) {
      setTextoObjetivo("Error al generar frase técnica.");
    } finally { 
      setCargando(false); 
    }
  };

  // --- 1. FUNCIÓN PARA GUARDAR EN MYSQL ---
  const guardarNota = async (puntajeFinal) => {
    const id_usuario = localStorage.getItem('id_usuario');
    if (!id_usuario) return;

    try {
      await fetch('https://lingopro-simulador.onrender.com/api/progreso/guardar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({
          id_usuario: id_usuario,
          modulo: 'speaking',
          aciertos: puntajeFinal
        })
      });
      console.log(`Calificación de Speaking (${puntajeFinal}/10) guardada en BD.`);
    } catch (error) {
      console.error("Error al guardar la calificación:", error);
    }
  };

  // --- 2. LÓGICA DE RECONOCIMIENTO Y CALIFICACIÓN ---
  const iniciarMicrofono = () => {
    if (!('webkitSpeechRecognition' in window)) return alert("Usa Chrome o Edge");
    
    const reconocimiento = new window.webkitSpeechRecognition();
    reconocimiento.lang = 'en-US';
    
    reconocimiento.onstart = () => { 
      setEscuchando(true); 
      setFeedback({ mensaje: "Grabando... habla ahora", tipo: "text-red-500 animate-pulse" }); 
    };
    
    reconocimiento.onresult = (event) => {
      // 1. Limpiamos ambos textos (quitamos puntos y comas para que sea justo)
      const escuchado = event.results[0][0].transcript.toLowerCase().replace(/[.,?!]/g, '');
      const objetivo = textoObjetivo.toLowerCase().replace(/[.,?!]/g, '');
      
      setTranscripcion(`"${escuchado}"`);

      // 2. Separamos por palabras para contar los errores
      const palabrasObjetivo = objetivo.split(' ');
      const palabrasEscuchadas = escuchado.split(' ');
      
      let errores = 0;
      
      // Verificamos cuántas palabras de la frase original NO dijiste o se entendieron mal
      palabrasObjetivo.forEach(palabra => {
        if (!palabrasEscuchadas.includes(palabra)) {
          errores++;
        }
      });

      // 3. Matemática de castigo: -2 pts por palabra mal pronunciada
      const puntaje = Math.max(0, 10 - (errores * 2));

      // 4. Damos feedback visual
      if (puntaje === 10) {
        setFeedback({ mensaje: "✅ ¡Pronunciación Perfecta! Calificación: 10/10. Cambiando...", tipo: "text-green-600 font-black" });
      } else {
        setFeedback({ mensaje: `⚠️ ${errores} palabras irreconocibles. Calificación: ${puntaje}/10. Cambiando en 4s...`, tipo: "text-amber-600 font-black" });
      }

      // 5. Guardamos en MySQL y programamos el cambio automático
      guardarNota(puntaje);
      
      setTimeout(() => {
        cargarIA();
      }, 4000);
    };

    reconocimiento.onend = () => setEscuchando(false);
    reconocimiento.start();
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">🎙️ Speaking IA</h2>
        
        <div className="bg-slate-50 p-6 rounded-2xl mb-6 min-h-[100px] flex items-center justify-center border border-dashed border-emerald-200">
          {cargando ? <p className="animate-pulse text-emerald-600 font-bold">Generando reto...</p> : 
          <p className="text-xl font-medium text-emerald-900 text-center leading-relaxed tracking-wide">
            {textoObjetivo}
          </p>}
        </div>
        
        <div className="mt-auto space-y-3 flex-grow flex flex-col justify-end">
          <button 
            onClick={iniciarMicrofono} 
            disabled={cargando || escuchando || feedback.mensaje.includes("Calificación")}
            className={`w-full font-bold py-4 rounded-2xl text-white transition-all uppercase tracking-widest shadow-md active:scale-95 ${
              escuchando ? 'bg-red-500 shadow-red-500/50' : 
              feedback.mensaje.includes("Calificación") ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {escuchando ? "🎙️ Escuchando..." : "Presiona y Habla"}
          </button>
        </div>
        
        <div className="mt-6 min-h-[60px] flex flex-col justify-center border-t border-slate-100 pt-4">
          <p className="text-sm text-center italic text-slate-500 mb-2">Lo que la IA escuchó: {transcripcion}</p>
          <p className={`text-center ${feedback.tipo}`}>{feedback.mensaje}</p>
        </div>
    </div>
  );
}