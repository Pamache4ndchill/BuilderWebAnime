import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  User, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  CircleDashed,
  XCircle,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  Loader2,
  AlertCircle,
  Hash,
  Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CommissionInquiry } from '../types';

interface CommissionInquiriesProps {
  onBack: () => void;
}

export const CommissionInquiries: React.FC<CommissionInquiriesProps> = ({ onBack }) => {
  const [inquiries, setInquiries] = useState<CommissionInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('commissions_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (err: any) {
      console.error('Error fetching inquiries:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: CommissionInquiry['status']) => {
    try {
      const { error } = await supabase
        .from('commissions_inquiries')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setInquiries(prev => prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));
    } catch (err: any) {
      alert('Error actualizando estado: ' + err.message);
    }
  };

  const getStatusIcon = (status: CommissionInquiry['status']) => {
    switch (status) {
      case 'pending': return <CircleDashed size={16} className="text-yellow-500" />;
      case 'in_progress': return <RotateCcw size={16} className="text-blue-500 animate-spin-slow" />;
      case 'completed': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'rejected': return <XCircle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: CommissionInquiry['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const getStatusText = (status: CommissionInquiry['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completado';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="text-zinc-500 font-black tracking-widest uppercase text-xs">Cargando solicitudes...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center gap-4 text-red-500">
          <AlertCircle size={24} />
          <p className="font-medium text-sm">{error}</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-[3rem]">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600">
            <MessageSquare size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white mb-2">No hay solicitudes todavía</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">Cuando los usuarios envíen solicitudes de comisión, aparecerán aquí.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {inquiries.map((inquiry) => (
            <motion.div
              key={inquiry.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden transition-all duration-300 ${selectedId === inquiry.id ? ' ring-2 ring-indigo-500/20 border-indigo-500/30' : ''}`}
            >
              <div 
                className="p-8 cursor-pointer" 
                onClick={() => setSelectedId(selectedId === inquiry.id ? null : inquiry.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight">{inquiry.full_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                          <Mail size={12} />
                          {inquiry.email}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium lowercase">
                          <Clock size={12} />
                          {new Date(inquiry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusColor(inquiry.status)}`}>
                      {getStatusIcon(inquiry.status)}
                      {getStatusText(inquiry.status)}
                    </div>
                    <motion.div
                      animate={{ rotate: selectedId === inquiry.id ? 180 : 0 }}
                      className="w-10 h-10 flex items-center justify-center text-zinc-600 group-hover:text-white transition-colors"
                    >
                      <ChevronDown size={20} />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedId === inquiry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-8 mt-8 border-t border-zinc-800/50 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2 px-1">
                              <Hash size={12} />
                              Red Social
                            </label>
                            <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase mb-1">{inquiry.social_platform}</span>
                                <span className="text-white font-black">{inquiry.social_username}</span>
                              </div>
                              <a 
                                href={`https://${inquiry.social_platform}.com/${inquiry.social_username}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-zinc-800 hover:bg-white hover:text-black rounded-lg flex items-center justify-center transition-all"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2 px-1">
                              <RotateCcw size={12} />
                              Actualizar Estado
                            </label>
                            <div className="flex gap-2">
                              {(['pending', 'in_progress', 'completed', 'rejected'] as const).map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(inquiry.id, s);
                                  }}
                                  className={`flex-1 py-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${inquiry.status === s ? getStatusColor(s) + ' ring-4 ring-offset-2 ring-offset-black ring-' + (s === 'pending' ? 'yellow' : s === 'in_progress' ? 'blue' : s === 'completed' ? 'green' : 'red') + '-500/20' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                  {getStatusText(s)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2 px-1">
                            <MessageSquare size={12} />
                            Mensaje / Descripción del Proyecto
                          </label>
                          <div className="bg-black/40 p-8 rounded-[2rem] border border-zinc-800/50 text-zinc-400 font-medium leading-relaxed">
                            {inquiry.message}
                          </div>
                        </div>

                        <div className="flex justify-end">
                            <a 
                              href={`mailto:${inquiry.email}`}
                              className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-xl"
                            >
                                <Send size={14} />
                                Responder por Email
                            </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
