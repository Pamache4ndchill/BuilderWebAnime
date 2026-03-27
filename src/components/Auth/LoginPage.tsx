import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Mail, 
  Loader2, 
  ShieldCheck,
  Layout,
  ChevronRight,
  AlertCircle,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. First, check if the email is in the allowed_users white list
      const { data: allowed, error: allowedError } = await supabase
        .from('allowed_users')
        .select('email')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (allowedError) throw allowedError;

      if (!allowed) {
        throw new Error('Este correo no está en la lista blanca de acceso.');
      }

      // 2. Clear to proceed
      onLogin(cleanEmail);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans selection:bg-pink-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800/50 rounded-[3rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-12">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-pink-500/20"
            >
              <Layout size={48} className="text-black" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-4">Builder Access</h1>
            <p className="text-zinc-500 text-sm text-center leading-relaxed">
              Ingresa tu correo autorizado para acceder a <br/>
              tu panel de gestión de noticias.
            </p>
          </div>

          <form onSubmit={handleAccess} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-4">Authorized Email</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-pink-500 transition-colors" size={20} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-800 rounded-3xl py-6 pl-16 pr-6 text-white focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all placeholder:text-zinc-800 font-bold tracking-tight text-lg"
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/5 border border-red-500/20 text-red-500 p-5 rounded-[1.5rem] text-sm flex items-center gap-3 backdrop-blur-md"
                >
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="font-semibold leading-tight">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-6 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-white/5"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span>Verificar Acceso</span>
                  <ChevronRight size={24} strokeWidth={3} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center space-y-4">
            <div className="flex items-center gap-2 justify-center text-[10px] text-zinc-700 font-black uppercase tracking-widest">
              <ShieldCheck size={14} />
              <span>Protección activa por White-List</span>
            </div>
            <div className="flex items-center gap-2 justify-center text-[10px] text-zinc-700 font-black uppercase tracking-widest">
              <Database size={14} />
              <span>Validación directa Supabase</span>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-zinc-700 text-xs font-bold uppercase tracking-widest opacity-40">Shonalime © 2026 | Private Access</p>
        </div>
      </motion.div>
    </div>
  );
};
