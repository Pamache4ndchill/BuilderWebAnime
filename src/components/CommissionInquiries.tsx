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

  const getStatusText = (status: CommissionInquiry['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Respondido';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  const statusOptions = [
    { id: 'pending', label: 'Pendiente', color: 'yellow' },
    { id: 'completed', label: 'Respondido', color: 'emerald' },
    { id: 'rejected', label: 'Rechazado', color: 'red' }
  ] as const;

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
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <motion.div
              key={inquiry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden hover:border-zinc-700 transition-all shadow-2xl"
            >
              {/* Header / Clickable Area */}
              <div 
                onClick={() => setSelectedId(selectedId === inquiry.id ? null : inquiry.id)}
                className={`p-8 cursor-pointer flex items-center justify-between group transition-colors ${selectedId === inquiry.id ? 'bg-zinc-800/30' : ''}`}
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Nombre</label>
                  <p className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{inquiry.full_name}</p>
                </div>
                
                <div className="flex items-center gap-6">
                   <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                      inquiry.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      inquiry.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                   }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        inquiry.status === 'pending' ? 'bg-yellow-500' :
                        inquiry.status === 'completed' ? 'bg-emerald-500' :
                        'bg-red-500'
                      }`} />
                      {getStatusText(inquiry.status)}
                   </div>
                   <motion.div
                     animate={{ rotate: selectedId === inquiry.id ? 180 : 0 }}
                     className="text-zinc-600"
                   >
                     <ChevronDown size={20} />
                   </motion.div>
                </div>
              </div>

              {/* Expandable Content */}
              <AnimatePresence>
                {selectedId === inquiry.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-black/20"
                  >
                    <div className="p-10 pt-4 border-t border-zinc-800/50">
                      <div className="flex flex-col lg:flex-row gap-12 mt-4">
                        {/* Info Column */}
                        <div className="flex-1 space-y-8">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Red Social</label>
                            <div className="flex items-center gap-3 bg-black/40 p-5 rounded-2xl border border-zinc-800/50 w-full">
                               <div className="flex flex-col">
                                  <span className="text-[11px] text-zinc-500 font-bold uppercase mb-1">{inquiry.social_platform}</span>
                                  <span className="text-white font-black text-lg">{inquiry.social_username}</span>
                               </div>
                               <a 
                                 href={`https://${inquiry.social_platform}.com/${inquiry.social_username}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="ml-auto w-10 h-10 bg-zinc-800 hover:bg-white hover:text-black rounded-xl flex items-center justify-center transition-all"
                               >
                                 <ExternalLink size={16} />
                               </a>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Correo Electrónico</label>
                            <p className="text-lg font-bold text-zinc-400">{inquiry.email}</p>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Mensaje / Proyecto</label>
                            <div className="bg-black/40 p-8 rounded-[2rem] border border-zinc-800/50 text-white text-lg font-medium leading-relaxed">
                              {inquiry.message}
                            </div>
                          </div>
                        </div>

                        {/* Status Column */}
                        <div className="lg:w-72 shrink-0">
                          <div className="p-6 bg-black/30 rounded-[2.5rem] border border-zinc-800/50">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-6 block text-center">Gestionar Estado</label>
                            
                            <div className="space-y-3">
                              {statusOptions.map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(inquiry.id, opt.id as any);
                                  }}
                                  className={`w-full py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                                    inquiry.status === opt.id 
                                      ? opt.id === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/40 ring-4 ring-yellow-500/10' :
                                        opt.id === 'completed' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40 ring-4 ring-emerald-500/10' :
                                        'bg-red-500/10 text-red-500 border-red-500/40 ring-4 ring-red-500/10'
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700'
                                  }`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${inquiry.status === opt.id ? 
                                    (opt.id === 'pending' ? 'bg-yellow-500' : opt.id === 'completed' ? 'bg-emerald-500' : 'bg-red-500') 
                                    : 'bg-zinc-800'}`} 
                                  />
                                  {opt.label}
                                </button>
                              ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-zinc-800/50 flex flex-col items-center">
                               <span className="text-[10px] font-black text-zinc-700 uppercase tracking-tighter">Recibido el</span>
                               <span className="text-xs font-bold text-zinc-500 mt-1">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
