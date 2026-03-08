import { useState } from 'react';

export default function Registro({ alTerminar }) {
  const [datos, setDatos] = useState({ nombre: '', email: '', password: '' });

  const enviar = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3000/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (res.ok) {
      alert("✅ ¡Alumno registrado! Ahora puedes iniciar sesión.");
      alTerminar(); 
    } else {
      alert("❌ Error: El correo ya existe en el sistema.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border-2 border-black mt-10">
      <h2 className="text-3xl font-extrabold mb-6 text-black text-center uppercase tracking-tighter">
        Registro de Alumnos
      </h2>
      
      <form onSubmit={enviar} className="space-y-5">
        {/* Campo Nombre */}
        <input 
          type="text" 
          placeholder="NOMBRE COMPLETO" 
          className="w-full p-4 border-2 border-black rounded-2xl outline-none focus:bg-emerald-50 text-black font-bold placeholder:text-black transition-all"
          onChange={e => setDatos({...datos, nombre: e.target.value})} 
          required 
        />

        {/* Campo Email */}
        <input 
          type="email" 
          placeholder="CORREO ELECTRÓNICO" 
          className="w-full p-4 border-2 border-black rounded-2xl outline-none focus:bg-emerald-50 text-black font-bold placeholder:text-black transition-all"
          onChange={e => setDatos({...datos, email: e.target.value})} 
          required 
        />

        {/* Campo Password */}
        <input 
          type="password" 
          placeholder="CREA TU CONTRASEÑA" 
          className="w-full p-4 border-2 border-black rounded-2xl outline-none focus:bg-emerald-50 text-black font-bold placeholder:text-black transition-all"
          onChange={e => setDatos({...datos, password: e.target.value})} 
          required 
        />

        <button className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all uppercase">
          Crear Cuenta
        </button>
      </form>
      
      <p className="mt-6 text-center text-black font-bold cursor-pointer hover:underline" onClick={alTerminar}>
        ¿Ya tienes cuenta? Inicia sesión aquí
      </p>
    </div>
  );
}