import { useState } from 'react';

export default function Login({ setUsuario, irARegistro }) {
  const [datos, setDatos] = useState({ email: '', password: '' });
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const toggleMostrarPassword = () => {
    setMostrarPassword(!mostrarPassword);
  };

  const entrar = async (e) => {
    e.preventDefault();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario_nombre', data.nombre);
      localStorage.setItem('id_usuario', data.id_usuario);
      setUsuario(data);
    } else {
      alert("❌ Acceso denegado: Revisa tu correo o contraseña.");
    }
  };

  return (
    <div className="login-container max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border-2 border-black mt-10">
      <h2 className="text-3xl font-extrabold mb-6 text-black text-center uppercase tracking-tighter">Acceso Alumnos</h2>
      <form onSubmit={entrar} className="space-y-5">
        <input 
          type="email" 
          placeholder="CORREO ELECTRÓNICO" 
          className="w-full p-4 border-2 border-black rounded-2xl outline-none focus:bg-blue-50 text-black font-bold placeholder:text-black transition-all"
          onChange={e => setDatos({...datos, email: e.target.value})} 
          required 
        />
        <div className="input-password-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input 
            type={mostrarPassword ? "text" : "password"} 
            placeholder="TU CONTRASEÑA" 
            className="w-full p-4 border-2 border-black rounded-2xl outline-none focus:bg-blue-50 text-black font-bold placeholder:text-black transition-all"
            style={{ paddingRight: '40px' }}
            onChange={e => setDatos({...datos, password: e.target.value})} 
            required 
          />
          <button 
            type="button" 
            onClick={toggleMostrarPassword}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            {mostrarPassword ? "🙈" : "👁️"} 
          </button>
        </div>
        <button className="w-full bg-black text-white font-black py-4 rounded-2xl hover:bg-slate-800 shadow-lg transform active:scale-95 transition-all uppercase">
          Ingresar al Simulador
        </button>
      </form>
      <p className="mt-6 text-center text-black font-bold cursor-pointer hover:underline" onClick={irARegistro}>
        ¿Eres nuevo? Regístrate aquí
      </p>
    </div>
  );
}