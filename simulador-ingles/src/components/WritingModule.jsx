import { useState, useEffect } from 'react';

export default function WritingModule() {
  const [texto, setTexto] = useState('');
  const [promptTexto, setPromptTexto] = useState("");
  const [feedback, setFeedback] = useState({ mensaje: "", tipo: "" });
  const [correcciones, setCorrecciones] = useState([]);
  const [cargandoDB, setCargandoDB] = useState(true);
  const [evaluando, setEvaluando] = useState(false);

  useEffect(() => { cargarIA(); }, []);

  const cargarIA = async () => {
    setCargandoDB(true);
    setTexto('');
    setCorrecciones([]);
    setFeedback({ mensaje: "", tipo: "" });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ia/generar/writing`);
      const data = await res.json();
      setPromptTexto(data.prompt); 
    } catch (e) { 
      setPromptTexto("Error al generar reto de escritura."); 
    } finally { 
      setCargandoDB(false); 
    }
  };

  const cantPalabras = texto.trim() === "" ? 0 : texto.trim().split(/\s+/).length;

  // --- 1. FUNCIÓN PARA GUARDAR EN MYSQL ---
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
          modulo: 'writing',
          aciertos: puntajeFinal
        })
      });
      console.log(`Calificación de Writing (${puntajeFinal}/10) guardada en BD.`);
    } catch (error) {
      console.error("Error al guardar la calificación:", error);
    }
  };

  // --- 2. LÓGICA DE EVALUACIÓN (0 a 10 con penalizaciones) ---
  const evaluarWriting = async () => {
    setCorrecciones([]);
    
    // Filtro inicial: Si no escribe al menos 10 palabras, no lo dejamos avanzar
    if (cantPalabras < 10) {
      return setFeedback({ mensaje: "⚠️ Escribe al menos 10 palabras para ser evaluado.", tipo: "text-amber-500" });
    }

    setEvaluando(true);
    setFeedback({ mensaje: "⏳ Analizando gramática minuciosamente...", tipo: "text-blue-500" });

    try {
      const res = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text: texto, language: 'en-US' })
      });
      const data = await res.json();
      const errores = data.matches;

      // Matemática de castigo: 10 menos 2 puntos por cada error (mínimo 0)
      const puntaje = Math.max(0, 10 - (errores.length * 2));

      setFeedback({ 
        mensaje: errores.length === 0 
          ? `✅ ¡Gramática perfecta! Calificación: 10/10. Cambiando de reto...` 
          : `⚠️ ${errores.length} errores encontrados. Calificación: ${puntaje}/10. Lee tus correcciones, cambiando en 6s...`, 
        tipo: puntaje >= 7 ? "text-green-600" : "text-amber-600" 
      });
      
      setCorrecciones(errores);
      guardarNota(puntaje);

      // Le damos 6 segundos para que analice sus errores antes de recargar
      setTimeout(() => {
        cargarIA();
      }, 6000);

    } catch (e) { 
      setFeedback({ mensaje: "Error de conexión en la evaluación.", tipo: "text-red-500" }); 
    } finally { 
      setEvaluando(false); 
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
      <h2 className="text-2xl font-bold mb-4 text-slate-800">✍️ Writing IA</h2>

      <div className="bg-indigo-50/50 p-4 rounded-2xl mb-4 border border-indigo-100">
        {cargandoDB ? <div className="animate-pulse h-4 bg-indigo-100 rounded w-full"></div> : 
        <p className="text-indigo-900 font-bold text-sm leading-relaxed italic">" {promptTexto} "</p>}
      </div>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows="5"
        className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-400 outline-none resize-none mb-4 text-slate-700 font-medium"
        placeholder="Escribe tu respuesta técnica aquí (Mínimo 10 palabras)..."
        disabled={cargandoDB || evaluando || feedback.mensaje.includes("Calificación")}
      ></textarea>

      <div className="grid grid-cols-1 mb-4">
        {/* Un solo botón de revisión */}
        <button 
          onClick={evaluarWriting} 
          disabled={evaluando || cargandoDB || feedback.mensaje.includes("Calificación")} 
          className="bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 shadow-md uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all"
        >
          {evaluando ? "Analizando..." : "Revisar y Continuar"}
        </button>
      </div>

      <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
        <span>Palabras: {cantPalabras}</span>
        <span className={feedback.tipo}>{feedback.mensaje}</span>
      </div>

      {/* Caja de correcciones: Solo aparece si hay errores */}
      {correcciones.length > 0 && (
        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2 border-t border-slate-100 pt-4">
          {correcciones.map((err, i) => (
            <div key={i} className="bg-red-50 p-3 rounded-xl border-l-4 border-red-400 text-xs">
              <p className="text-slate-700"><strong>Detalle:</strong> {err.message}</p>
              {err.replacements.length > 0 && (
                <p className="text-green-600 font-bold mt-1">Sugerencia: {err.replacements[0].value}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}