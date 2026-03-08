import { useState, useEffect } from 'react'; 
import ListeningModule from './components/ListeningModule';
import SpeakingModule from './components/SpeakingModule';
import ReadingModule from './components/ReadingModule';
import WritingModule from './components/WritingModule';
import Registro from './components/Registro';
import Login from './components/Login';
import Perfil from './components/Perfil';
import Ranking from './components/Ranking';

function App() {
  // --- ESTADOS PARA LA SESIÓN ---
  const [usuario, setUsuario] = useState(null);
  const [verRegistro, setVerRegistro] = useState(false);
  const [verPerfil, setVerPerfil] = useState(false);
  const [verRanking, setVerRanking] = useState(false);

  // Al cargar la app, revisamos si el alumno ya tenía sesión iniciada en Culiacán
  useEffect(() => {
    const nombreGuardado = localStorage.getItem('usuario_nombre');
    const idGuardado = localStorage.getItem('id_usuario');
    if (nombreGuardado && idGuardado) {
      setUsuario({ nombre: nombreGuardado, id_usuario: idGuardado });
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('id_usuario');
    // También limpiamos el nombre por si acaso
    localStorage.removeItem('usuario_nombre');
    window.location.reload(); 
  };

  // --- LÓGICA DE PANTALLA DE ACCESO ---
  if (!usuario) {
    return (
      <div className="absolute inset-0 w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        {verRegistro ? (
          <Registro alTerminar={() => setVerRegistro(false)} />
        ) : (
          <Login setUsuario={setUsuario} irARegistro={() => setVerRegistro(true)} />
        )}
      </div>
    );
  }

  // --- LÓGICA DEL SIMULADOR ---
  return (
    <div className="absolute inset-0 w-full min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-800 overflow-x-hidden">
      
      {/* Navbar con nombre dinámico */}
      <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              <h1 className="text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
                LingoPro
              </h1>
            </div>
            
            {/* CONTENEDOR DE USUARIO CORREGIDO (Sin duplicados) */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setVerRanking(true); setVerPerfil(false); }} 
                className="text-sm font-bold text-amber-600 hover:text-amber-700 underline uppercase"
              >
                🏆 Top 10
              </button>
            
              <button 
                onClick={() => { setVerPerfil(true); setVerRanking(false); }} 
                className="text-sm font-bold text-slate-600 hover:text-black underline uppercase"
              >
                Ver Mis Notas
              </button>

              <span className="text-sm font-medium text-slate-500 hidden sm:block">
                ¡Hola, {usuario.nombre}!
              </span>
              
              <button onClick={cerrarSesion} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider">
                Cerrar Sesión
              </button>
              
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {usuario.nombre.substring(0, 2).toUpperCase()}
              </div>

            </div>
          </div>
        </div>
      </nav>

      <main className="w-full flex-grow flex flex-col px-4 sm:px-6 lg:px-12 py-6 md:py-10">
        {verRanking ? (
          // PANTALLA 1: EL RANKING
          <Ranking volverAlSimulador={() => setVerRanking(false)} />
        ) : verPerfil ? (
          // PANTALLA 2: EL PERFIL PERSONAL
          <Perfil volverAlSimulador={() => setVerPerfil(false)} />
        ) : (
          // PANTALLA 3: EL SIMULADOR (POR DEFECTO)
          <>
            <div className="mb-8 text-center w-full">
              <h2 className="text-2xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">
                Simulador de Práctica Avanzada
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 flex-grow w-full">
              <ListeningModule />
              <SpeakingModule />
              <ReadingModule />
              <WritingModule />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;