import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  User, 
  Loader2, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UsernameSetupProps {
  email: string;
  onComplete: (username: string) => void;
}

export const UsernameSetup: React.FC<UsernameSetupProps> = ({ email, onComplete }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Check if the username is already taken in the user_profiles table
      const { data: exists } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (exists) {
        throw new Error('Este nombre de usuario ya está en uso. Elige otro.');
      }

      // 2. Clear to proceed - save to user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          email: email,
          username: cleanUsername,
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      onComplete(cleanUsername);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans selection:bg-yellow-500/30 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 perspective-1000">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-yellow-500/10 to-transparent blur-3xl rounded-full translate-y-[-50%]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-orange-500/10 to-transparent blur-3xl rounded-full translate-y-[50%]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800 rounded-[3rem] p-12 shadow-2xl relative">
          {/* Header */}
          <div className="flex flex-col items-center mb-12">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-24 h-24 bg-gradient-to-tr from-yellow-500 to-orange-500 rounded-[2rem] flex items-center justify-center mb-10 shadow-xl shadow-yellow-500/20 text-black"
            >
              <User size={48} className="drop-shadow-lg" />
            </motion.div>
            
            <h1 className="text-4xl font-extrabold text-white tracking-tighter mb-4 text-center">
              Perfil de Administrador
            </h1>
            <p className="text-zinc-500 text-center leading-relaxed text-sm max-w-xs mx-auto">
              Toda publicación llevará tu firma. Elige un nombre de usuario profesional.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-8 relative z-10">
            <div className="space-y-2 group">
              <label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 ml-4">
                User Name (Autor)
              </label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-500 transition-colors">
                  <Sparkles size={22} />
                </div>
                <input 
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-800 rounded-[1.5rem] py-6 pl-16 pr-6 text-white text-xl font-bold focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/10 outline-none transition-all placeholder:text-zinc-800 tracking-tight"
                  placeholder="Tu alias..."
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-500/5 border border-red-500/20 text-red-500/80 p-5 rounded-[1.5rem] text-sm flex items-center gap-3 backdrop-blur-md"
                >
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="font-semibold leading-tight">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading || !username}
              className="w-full bg-yellow-500 text-black py-6 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-yellow-400 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-yellow-500/20"
            >
              {loading ? (
                <Loader2 className="animate-spin text-black" size={24} />
              ) : (
                <>
                  <span>Empezar a Construir</span>
                  <ChevronRight size={24} strokeWidth={3} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 flex items-center gap-2 justify-center text-[10px] text-zinc-700 font-black uppercase tracking-widest">
            <ShieldCheck size={14} />
            <span>Validando sesión: {email}</span>
          </div>

          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/5 to-transparent rounded-bl-[100%] pointer-events-none" />
        </div>

        <div className="mt-10 text-center">
           <p className="text-zinc-700 text-xs font-bold uppercase tracking-widest opacity-40">Shonalime © 2026 | Private Access</p>
        </div>
      </motion.div>
    </div>
  );
};
