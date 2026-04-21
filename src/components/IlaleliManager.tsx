import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Users, 
  MessageSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { CommissionInquiries } from './CommissionInquiries';

interface IlaleliManagerProps {
  onBack: () => void;
}

export const IlaleliManager: React.FC<IlaleliManagerProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'commissions'>('menu');

  if (activeTab === 'commissions') {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-zinc-900 px-10 py-8 rounded-[3rem] border border-zinc-800 shadow-2xl">
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab('menu')}
              className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-zinc-800 hover:border-indigo-500/50 transition-colors"
            >
              <ArrowLeft size={20} className="text-indigo-500" />
            </motion.button>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-2">Comisiones</h1>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest tracking-tighter">Buzón de entrada de solicitudes</p>
            </div>
          </div>
        </div>

        <CommissionInquiries onBack={() => setActiveTab('menu')} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-16 h-16 bg-zinc-900 rounded-[2rem] flex items-center justify-center border border-zinc-800 hover:border-indigo-500/50 transition-colors shadow-2xl"
          >
            <ArrowLeft size={24} className="text-indigo-500" />
          </motion.button>
          <div>
            <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-3">Ilaleli</h1>
            <p className="text-zinc-500 font-medium text-lg uppercase tracking-widest">Artist Hub & Store Management</p>
          </div>
        </div>
        
        <div className="w-20 h-20 bg-indigo-500 rounded-[2.5rem] flex items-center justify-center text-black shadow-2xl shadow-indigo-500/20 rotate-12">
            <ShoppingBag size={40} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.button
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('commissions')}
            className="group relative h-[400px] bg-zinc-900 border border-zinc-800 rounded-[4rem] p-12 text-left overflow-hidden transition-all duration-500 hover:bg-zinc-800/80 hover:border-indigo-500/30 shadow-2xl"
          >
            <div className="relative z-10 h-full flex flex-col">
                <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-black mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all">
                    <Users size={32} />
                </div>
                
                <h3 className="text-4xl font-black text-white tracking-tighter mb-4">Contacto para comisión</h3>
                <p className="text-zinc-500 font-medium leading-relaxed max-w-sm mb-auto">
                    Gestiona todas las solicitudes entrantes de tus seguidores y clientes. Revisa perfiles sociales y detalles del proyecto.
                </p>

                <div className="flex items-center gap-3 text-indigo-400 font-black uppercase tracking-[0.2em] text-xs">
                    <span>Abrir Bandeja</span>
                    <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-2 transition-transform" />
                </div>
            </div>

            {/* Aesthetic Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-500/10 transition-colors" />
            <div className="absolute bottom-10 right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <MessageSquare size={160} className="text-white" />
            </div>
          </motion.button>

          <div className="group relative h-[400px] bg-zinc-900/40 border border-zinc-800/50 border-dashed rounded-[4rem] p-12 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-zinc-700 mb-6">
                <Sparkles size={32} />
             </div>
             <h3 className="text-2xl font-black text-zinc-600 tracking-tighter mb-2">Próximamente</h3>
             <p className="text-zinc-700 font-bold uppercase tracking-widest text-[10px]">Gestión de Tienda & Productos</p>
          </div>
      </div>
    </div>
  );
};
