import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Newspaper, 
  TrendingUp, 
  BookOpen, 
  Layout, 
  Settings,
  Trophy,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronRight,
  Loader2,
  ShoppingBag
} from 'lucide-react';
import { ContentBuilder } from './components/ContentBuilder';
import { TopEditor } from './components/TopEditor';
import { RecommendationEditor } from './components/RecommendationEditor';
import { IlaleliManager } from './components/IlaleliManager';
import { LoginPage } from './components/Auth/LoginPage';
import { UsernameSetup } from './components/Auth/UsernameSetup';
import { supabase } from './lib/supabase';

type ViewMode = 'home' | 'noticia' | 'tendencia' | 'manga' | 'videojuego' | 'tops' | 'recomendacion' | 'ilaleli';

export default function App() {
  const [view, setView] = useState<ViewMode>('home');
  const [email, setEmail] = useState<string | null>(localStorage.getItem('builder_user_email'));
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (email) {
      fetchProfile(email);
    } else {
      setIsLoading(false);
    }
  }, [email]);

  const fetchProfile = async (userEmail: string) => {
    setIsLoading(true);
    try {
      // 1. Check if profile exists in user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .ilike('email', userEmail)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUsername(data.username);
      } else {
        // If no profile, they need to set up username
        setUsername(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userEmail: string) => {
    localStorage.setItem('builder_user_email', userEmail);
    setEmail(userEmail);
  };

  const handleLogout = () => {
    localStorage.removeItem('builder_user_email');
    setEmail(null);
    setUsername(null);
    setView('home');
  };

  const cards = [
    {
      id: 'noticia' as const,
      title: 'Crear Noticia',
      description: 'Publica las últimas novedades del mundo anime.',
      icon: <Newspaper size={32} />,
      color: 'bg-blue-500',
    },
    {
      id: 'tendencia' as const,
      title: 'Crear Tendencia',
      description: 'Analiza lo que está marcando tendencia hoy.',
      icon: <TrendingUp size={32} />,
      color: 'bg-purple-500',
    },
    {
      id: 'manga' as const,
      title: 'Crear Manga',
      description: 'Escribe sobre los capítulos más recientes.',
      icon: <BookOpen size={32} />,
      color: 'bg-pink-500',
    },
    {
      id: 'videojuego' as const,
      title: 'Crear Videojuego',
      description: 'Reviews y noticias de los últimos juegos.',
      icon: <Layout size={32} />,
      color: 'bg-green-500',
    },
    {
      id: 'tops' as const,
      title: 'Top´s',
      description: 'Gestiona los rankings de los mejores animes y mangas.',
      icon: <Trophy size={32} />,
      color: 'bg-yellow-500',
    },
    {
      id: 'recomendacion' as const,
      title: 'Te Recomendamos',
      description: 'Destaca trailers y animes recomendados por el equipo.',
      icon: <Plus size={32} />,
      color: 'bg-pink-500',
    },
    {
      id: 'ilaleli' as const,
      title: 'Ilaleli',
      description: 'Gestiona los productos y pedidos de tu tienda virtual.',
      icon: <ShoppingBag size={32} />,
      color: 'bg-indigo-500',
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3], rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 border-t-2 border-r-2 border-pink-500 rounded-full"
        />
        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Verificando Credenciales...</p>
      </div>
    );
  }

  // Auth Flow
  if (!email) return <LoginPage onLogin={handleLogin} />;
  
  if (!username) return (
    <UsernameSetup 
      email={email} 
      onComplete={(newUsername) => setUsername(newUsername)} 
    />
  );

  return (
    <div className="min-h-screen bg-black text-purple-50 font-sans selection:bg-pink-500/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {view === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-6xl mx-auto px-6 py-20"
          >
            {/* Compact Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-8 bg-zinc-900/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
              <div className="flex items-center gap-5">
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-14 h-14 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0"
                >
                  <Layout size={32} className="text-black" />
                </motion.div>
                <div className="text-left">
                  <h1 className="text-3xl font-black tracking-tighter text-white leading-none mb-1">
                    Builder Dashboard
                  </h1>
                  <p className="text-zinc-500 text-sm font-medium tracking-tight">
                    Shonalime Content Management Service
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-black/40 rounded-[2rem] p-1.5 border border-zinc-800/50 shadow-inner">
                <div className="flex items-center gap-3 px-5 py-2 border-r border-zinc-800">
                  <div className="w-8 h-8 bg-gradient-to-tr from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-black shrink-0 shadow-lg shadow-orange-500/10">
                    <UserIcon size={16} />
                  </div>
                  <span className="text-sm font-black text-white tracking-tight">{username}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="group flex items-center gap-2 px-6 py-2 text-zinc-500 hover:text-red-400 transition-all"
                >
                  <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Salir</span>
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cards.map((card, index) => (
                <motion.button
                  key={card.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  onClick={() => setView(card.id)}
                  className="group relative flex flex-col items-start p-10 bg-zinc-900 border border-zinc-800 rounded-[3rem] hover:bg-zinc-800 transition-all duration-500 text-left shadow-2xl overflow-hidden hover:border-pink-500/20"
                >
                  <div className={`w-16 h-16 ${card.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 text-black shadow-lg`}>
                    {card.icon}
                  </div>
                  <h3 className="text-3xl font-black mb-4 text-white group-hover:text-pink-400 transition-colors tracking-tighter">
                    {card.title}
                  </h3>
                  <p className="text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors text-sm font-medium">
                    {card.description}
                  </p>
                  
                  <div className="mt-10 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-pink-500 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <span>Empezar ahora</span>
                    <ChevronRight size={18} />
                  </div>

                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500" />
                </motion.button>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-32 pt-12 border-t border-zinc-900/50 flex flex-col md:flex-row items-center justify-between gap-8"
            >
              <div className="flex items-center gap-8 text-[11px] text-zinc-700 font-black uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
                  White-List Secured
                </span>
                <span className="flex items-center gap-2.5">
                   <ShieldCheck size={18} />
                   Verified Admin
                </span>
                <span className="opacity-40">System Release v3.5.0</span>
              </div>
            </motion.div>
          </motion.div>
        ) : view === 'tops' ? (
          <TopEditor onBack={() => setView('home')} />
        ) : view === 'recomendacion' ? (
          <RecommendationEditor onBack={() => setView('home')} />
        ) : view === 'ilaleli' ? (
          <IlaleliManager onBack={() => setView('home')} />
        ) : (
          <ContentBuilder 
            key={view}
            title={cards.find(c => c.id === view)?.title || ''}
            contentType={view}
            author={username || 'Anónimo'}
            onBack={() => setView('home')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
