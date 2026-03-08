import { useState } from 'react';

export default function Login({ setUsuario, irARegistro }) {
  const [datos, setDatos] = useState({ email: '', password: '' });

  const entrar = async (e) => {
    e.preventDefault();
    const res = await fetch('https://lingopro-simulador.onrender.com/api/auth/login', {
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
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border-2 border-black mt-10">
      <h2 className="text-3xl font-extrabold mb-6 text-black text-center uppercase tracking-tighter">Acceso Alumnos</h2>
      <form onSubmit={entrar} className="space-y-5">
        <input 
          type="email" 
          placeholder="CORREO ELECTRÓNICO" 
          className="w-full p-4 border-2 border-black rounded-2xl outline-none focus:bg-blue-50 text-black font-bold placeholder:text-black transition-all"
          onChange={e => setDatos({...datos, email: e.target.value})} 
          required 
        />
        <input 
          type="password" 
          placeholder="TU CONTRASEÑA" 
          className="w-full p-4 border-2 border-black rounded-2xl outline-none focus:bg-blue-50 text-black font-bold placeholder:text-black transition-all"
          onChange={e => setDatos({...datos, password: e.target.value})} 
          required 
        />
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