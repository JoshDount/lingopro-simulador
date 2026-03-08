import { useState, useEffect } from 'react';

export default function ReadingModule() {
  const [ejercicio, setEjercicio] = useState({ texto: "", preguntas: [] });
  const [respuestas, setRespuestas] = useState({});
  const [feedback, setFeedback] = useState({ mensaje: "", tipo: "" });
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargarIA(); }, []);

  const cargarIA = async () => {
    setCargando(true);
    setRespuestas({});
    setFeedback({ mensaje: "", tipo: "" });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ia/generar/reading`);
      const data = await res.json();

      if (!data || !data.texto || !data.preguntas || !Array.isArray(data.preguntas)) {
        setEjercicio({ texto: "Error al generar la lectura. Presiona 'Nueva Lectura'.", preguntas: [] });
        return;
      }

      const preguntasNormalizadas = data.preguntas.map((p, index) => ({
        id: p.id ?? index + 1,
        text: p.text || p.question || p.pregunta || `Pregunta ${index + 1}`,
        opciones: p.opciones || p.options || {},
        correcta: p.correcta || p.correct || p.answer || "a"
      }));

      setEjercicio({ texto: data.texto, preguntas: preguntasNormalizadas });

    } catch (e) {
      setEjercicio({ texto: "Error de conexión con el servidor.", preguntas: [] });
    } finally {
      setCargando(false);
    }
  };

  // --- 1. FUNCIÓN PARA GUARDAR LA NOTA EN MYSQL ---
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
          modulo: 'reading',
          aciertos: puntajeFinal // Enviamos el puntaje del 0 al 10
        })
      });
      console.log(`Calificación de Reading (${puntajeFinal}/10) guardada en BD.`);
    } catch (error) {
      console.error("Error al guardar la calificación:", error);
    }
  };

  // --- 2. LÓGICA DE CALIFICACIÓN (0 a 10) Y AUTO-SIGUIENTE ---
  const evaluar = () => {
    if (ejercicio.preguntas.length === 0) return;

    if (Object.keys(respuestas).length < ejercicio.preguntas.length) {
      return setFeedback({ mensaje: "⚠️ Responde todas las preguntas antes de revisar.", tipo: "text-amber-600" });
    }

    let aciertos = 0;
    ejercicio.preguntas.forEach(p => {
      // 1. Obtenemos lo que seleccionaste ("0", "1", "a", "b")
      let seleccion = String(respuestas[p.id]).toLowerCase();

      // 2. MAGIA: Si la IA mandó un arreglo (0, 1, 2), lo convertimos a letras (a, b, c)
      if (!isNaN(seleccion)) {
          // El código ASCII de la 'a' es 97, así que 0 se vuelve 'a', 1 se vuelve 'b'...
          seleccion = String.fromCharCode(97 + parseInt(seleccion));
      }

      // 3. Limpiamos la respuesta correcta y el texto de tu opción
      const respuestaIA = String(p.correcta).trim().toLowerCase();
      const textoOpcion = String(p.opciones[respuestas[p.id]]).trim().toLowerCase();

      // 4. Comprobamos los 3 escenarios posibles en los que la IA te puede evaluar
      if (
          seleccion === respuestaIA.charAt(0) || // Escenario A: Tu letra coincide con la de la IA
          textoOpcion === respuestaIA ||         // Escenario B: El texto de la opción es exactamente la respuesta
          textoOpcion.includes(respuestaIA)      // Escenario C: La opción incluye la respuesta (ej. "a) gato")
      ) {
          aciertos++;
      }
    });

    // Matemática pura: Regla de 3 redondeada
    const puntaje = Math.round((aciertos / ejercicio.preguntas.length) * 10);

    setFeedback({
      mensaje: `Calificación: ${puntaje}/10. Cambiando de lectura...`,
      tipo: puntaje >= 7 ? "text-green-600" : "text-amber-600"
    });

    // Guardamos en BD
    guardarNota(puntaje);

    // Esperamos 3.5 segundos para que el alumno vea su nota y cargamos uno nuevo
    setTimeout(() => {
      cargarIA();
    }, 3500);
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
      <h2 className="text-2xl font-bold mb-4">📖 Reading IA</h2>

      <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm italic text-slate-700 leading-relaxed border border-slate-100 min-h-[80px]">
        {cargando
          ? <div className="animate-pulse space-y-2"><div className="h-3 bg-slate-200 rounded w-full"></div><div className="h-3 bg-slate-200 rounded w-5/6"></div></div>
          : ejercicio.texto
        }
      </div>

      <div className="space-y-6 flex-grow">
        {!cargando && ejercicio.preguntas.map((p) => (
          <div key={p.id} className="border-b border-slate-100 pb-4">
            <p className="font-bold text-slate-800 mb-3 text-sm">{p.text}</p>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(p.opciones).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setRespuestas({ ...respuestas, [p.id]: key })}
                  disabled={feedback.mensaje.includes("Calificación")} // Desactiva botones al revisar
                  className={`text-left p-2 rounded-lg text-xs transition-all border ${
                    respuestas[p.id] === key
                      ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-amber-200'
                  }`}
                >
                  <span className="uppercase mr-2 font-black">{key})</span> {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {/* Un solo botón principal para evaluar y avanzar */}
        <button
          onClick={evaluar}
          disabled={ejercicio.preguntas.length === 0 || feedback.mensaje.includes("Calificación")}
          className="w-full bg-amber-500 text-white font-bold py-3 rounded-2xl hover:bg-amber-600 disabled:opacity-40 uppercase tracking-widest transition-all active:scale-95 shadow-md"
        >
          Revisar y Continuar
        </button>
        <p className={`text-center font-black ${feedback.tipo}`}>{feedback.mensaje}</p>
      </div>
    </div>
  );
}