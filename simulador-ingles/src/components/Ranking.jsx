import { useState, useEffect } from 'react';

export default function Ranking({ volverAlSimulador }) {
  const [lideres, setLideres] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarRanking = async () => {
      try {
        const res = await fetch('https://lingopro-simulador.onrender.com/api/ranking', {
          headers: { 'Authorization': localStorage.getItem('token') } // Enviamos el token
        });
        if (res.ok) {
          const data = await res.json();
          setLideres(data);
        }
      } catch (error) {
        console.error("Error al cargar ranking", error);
      } finally {
        setCargando(false);
      }
    };
    cargarRanking();
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full bg-white p-8 rounded-3xl shadow-xl border-2 border-black mt-6">
      <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
        <h2 className="text-3xl font-extrabold text-black uppercase tracking-tighter">
          🏆 Top 10 Global
        </h2>
        <button 
          onClick={volverAlSimulador}
          className="bg-black text-white font-bold py-2 px-6 rounded-xl hover:bg-slate-800 transition-all uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          Volver
        </button>
      </div>

      {cargando ? (
        <p className="text-center font-bold text-slate-500 animate-pulse">Cargando a los mejores...</p>
      ) : lideres.length === 0 ? (
        <p className="text-center text-slate-500 font-bold">Aún no hay suficientes datos para el ranking.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white uppercase text-sm tracking-wider">
                <th className="p-4 rounded-tl-xl w-16 text-center">#</th>
                <th className="p-4">Alumno</th>
                <th className="p-4 text-center">Ejercicios</th>
                <th className="p-4 rounded-tr-xl text-center">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {lideres.map((lider, index) => (
                <tr key={index} className="border-b-2 border-slate-100 hover:bg-amber-50 transition-colors text-black font-bold">
                  <td className="p-4 text-center text-xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td className="p-4 uppercase text-slate-700">{lider.nombre}</td>
                  <td className="p-4 text-center text-slate-500">{lider.total_ejercicios}</td>
                  <td className="p-4 text-center text-emerald-600 text-2xl font-black">{lider.promedio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}