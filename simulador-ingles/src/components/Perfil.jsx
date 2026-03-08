import { useState, useEffect } from 'react';

export default function Perfil({ volverAlSimulador }) {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarHistorial = async () => {
      const id_usuario = localStorage.getItem('id_usuario');
      if (!id_usuario) return;

      try {
        const res = await fetch(`https://lingopro-simulador.onrender.com/api/progreso/${id_usuario}`, {
          headers: {
            'Authorization': localStorage.getItem('token')
          }
        });
        const data = await res.json();
        setHistorial(data);
      } catch (error) {
        console.error("Error al cargar calificaciones", error);
      } finally {
        setCargando(false);
      }
    };
    cargarHistorial();
  }, []);

  // --- MATEMÁTICAS: CÁLCULO DEL PROMEDIO GENERAL ---
  const calcularPromedio = () => {
    if (historial.length === 0) return 0;
    const suma = historial.reduce((acc, nota) => acc + nota.aciertos, 0);
    return (suma / historial.length).toFixed(1); // Redondeamos a 1 decimal
  };

  const promedio = calcularPromedio();

  // --- LÓGICA DE NIVELES (ESCALA INTERNACIONAL) ---
  const obtenerNivel = (prom) => {
    if (prom === 0) return { titulo: "Sin evaluar", color: "text-slate-400", bg: "bg-slate-100" };
    if (prom < 6) return { titulo: "A1 - Principiante", color: "text-red-600", bg: "bg-red-100" };
    if (prom < 8) return { titulo: "B1 - Intermedio", color: "text-amber-600", bg: "bg-amber-100" };
    if (prom < 9.5) return { titulo: "B2 - Avanzado", color: "text-blue-600", bg: "bg-blue-100" };
    return { titulo: "C1 - Experto", color: "text-emerald-600", bg: "bg-emerald-100" };
  };

  const nivelActual = obtenerNivel(Number(promedio));

  return (
    <div className="max-w-4xl mx-auto w-full bg-white p-8 rounded-3xl shadow-xl border-2 border-black mt-6">
      <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
        <h2 className="text-3xl font-extrabold text-black uppercase tracking-tighter">
          Mi Rendimiento
        </h2>
        <button 
          onClick={volverAlSimulador}
          className="bg-black text-white font-bold py-2 px-6 rounded-xl hover:bg-slate-800 transition-all uppercase text-sm border-2 border-transparent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          Volver a Practicar
        </button>
      </div>

      {cargando ? (
        <p className="text-center font-bold text-slate-500 animate-pulse">Analizando tus datos...</p>
      ) : historial.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">
          <p className="text-slate-500 font-bold text-lg">Aún no tienes calificaciones.</p>
          <p className="text-slate-400">¡Ve al simulador y completa ejercicios para ver tu nivel!</p>
        </div>
      ) : (
        <>
          {/* PANEL DE ESTADÍSTICAS FRONTALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border-2 border-black rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-sm font-black uppercase text-slate-500 tracking-widest mb-2">Promedio General</span>
              <span className="text-6xl font-black text-black">{promedio}</span>
              <span className="text-xs font-bold text-slate-400 mt-2 uppercase">De {historial.length} ejercicios</span>
            </div>
            
            <div className={`border-2 border-black rounded-2xl p-6 flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${nivelActual.bg}`}>
              <span className="text-sm font-black uppercase text-slate-800 tracking-widest mb-2">Nivel Estimado</span>
              <span className={`text-3xl font-black uppercase text-center ${nivelActual.color}`}>
                {nivelActual.titulo}
              </span>
            </div>
          </div>

          <h3 className="text-lg font-black uppercase mb-4 text-slate-800 border-b-2 border-slate-100 pb-2">Historial Detallado</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-white uppercase text-sm tracking-wider">
                  <th className="p-4 rounded-tl-xl border-r border-slate-700">Módulo</th>
                  <th className="p-4 border-r border-slate-700 text-center">Calificación</th>
                  <th className="p-4 rounded-tr-xl text-right">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((nota, index) => (
                  <tr key={index} className="border-b-2 border-slate-100 hover:bg-slate-50 transition-colors text-black font-bold">
                    <td className="p-4 capitalize">{nota.modulo}</td>
                    <td className={`p-4 text-center text-lg ${nota.aciertos >= 7 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {nota.aciertos}/10
                    </td>
                    <td className="p-4 text-right text-sm text-slate-500">
                      {new Date(nota.fecha).toLocaleDateString()} - {new Date(nota.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}