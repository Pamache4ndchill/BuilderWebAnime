import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  ImageIcon,
  Loader2,
  AlertCircle,
  Edit2,
  Twitch,
  Tag,
  AlignLeft,
  User,
  ChevronDown,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/r2';
import { CommunityStreamer } from '../types';
import { ImageUploader } from './ImageUploader';

interface CommunityManagerProps {
  onBack: () => void;
}

export const CommunityManager: React.FC<CommunityManagerProps> = ({ onBack }) => {
  const [streamers, setStreamers] = useState<CommunityStreamer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CommunityStreamer>>({
    name: '',
    tagline: '',
    bio: '',
    image_url: '',
    twitch_url: '',
    order_index: 0
  });

  // To check if data has changed
  const originalData = useMemo(() => {
    if (expandedId) {
      return streamers.find(s => s.id === expandedId);
    }
    return null;
  }, [expandedId, streamers]);

  const hasChanges = useMemo(() => {
    if (isAdding) return true;
    if (!originalData) return false;
    
    return (
      formData.name !== originalData.name ||
      formData.tagline !== originalData.tagline ||
      formData.bio !== originalData.bio ||
      formData.image_url !== originalData.image_url ||
      formData.twitch_url !== originalData.twitch_url
    );
  }, [formData, originalData, isAdding]);

  const resetForm = () => {
    setFormData({
      name: '',
      tagline: '',
      bio: '',
      image_url: '',
      twitch_url: '',
      order_index: streamers.length + 1
    });
    setIsAdding(false);
    setExpandedId(null);
    setError(null);
  };

  const handleToggleAccordion = (streamer: CommunityStreamer) => {
    if (expandedId === streamer.id) {
      setExpandedId(null);
    } else {
      setExpandedId(streamer.id);
      setFormData(streamer);
      setIsAdding(false);
      setError(null);
    }
  };

  useEffect(() => {
    fetchStreamers();
  }, []);

  const fetchStreamers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_streamers')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setStreamers(data || []);
    } catch (err: any) {
      setError('Error al cargar streamers: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.twitch_url || !formData.image_url) {
      setError('Por favor completa los campos obligatorios (Nombre, Twitch e Imagen).');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let finalImageUrl = formData.image_url;
      if (finalImageUrl && finalImageUrl.startsWith('data:')) {
        try {
          finalImageUrl = await uploadToR2(finalImageUrl, 'streamers');
        } catch (r2Error: any) {
          throw new Error(`Error subiendo imagen a R2: ${r2Error.message || 'Error desconocido'}`);
        }
      }

      const payload = {
        name: formData.name,
        tagline: formData.tagline,
        bio: formData.bio,
        image_url: finalImageUrl,
        twitch_url: formData.twitch_url,
        order_index: formData.order_index || (isAdding ? streamers.length + 1 : originalData?.order_index)
      };

      let result;
      if (expandedId && !isAdding) {
        result = await supabase
          .from('community_streamers')
          .update(payload)
          .eq('id', expandedId)
          .select();
      } else {
        result = await supabase
          .from('community_streamers')
          .insert([payload])
          .select();
      }

      if (result.error) throw result.error;
      
      await fetchStreamers();
      resetForm();
    } catch (err: any) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres eliminar este streamer?')) return;

    try {
      const { error } = await supabase
        .from('community_streamers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStreamers(streamers.filter(s => s.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      setError('Error al eliminar: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-zinc-900 px-8 py-6 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
        <div className="flex items-center gap-5">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-zinc-800 hover:border-pink-500/50 transition-colors"
          >
            <ArrowLeft size={18} className="text-pink-500" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none mb-1">Streamers</h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Gestión de Comunidad</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (isAdding) {
              resetForm();
            } else {
              setFormData({
                name: '',
                tagline: '',
                bio: '',
                image_url: '',
                twitch_url: '',
                order_index: streamers.length + 1
              });
              setIsAdding(true);
              setExpandedId(null);
            }
          }}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg transition-all border ${
            isAdding 
              ? 'bg-zinc-800 border-zinc-700 text-zinc-400' 
              : 'bg-pink-500 border-pink-400 text-black'
          }`}
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'Cancelar' : 'Agregar Streamer'}
        </motion.button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500"
        >
          <AlertCircle size={24} />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {/* Modal for Adding New Streamer */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                  <Plus size={24} className="text-pink-500" />
                  Nuevo Perfil de Streamer
                </h2>
                <button 
                  onClick={resetForm}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <StreamerForm 
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleSave}
                  isSaving={isSaving}
                  showSave={true}
                />
              </div>

              {/* Decorative elements for the modal */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-[80px] pointer-events-none" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accordion List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-pink-500" size={32} />
            <p className="text-zinc-500 font-black tracking-widest uppercase text-[10px]">Cargando streamers...</p>
          </div>
        ) : streamers.length === 0 && !isAdding ? (
          <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-900/20">
            <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No hay streamers recomendados</p>
            <p className="text-zinc-700 text-[10px] uppercase tracking-widest mt-2">Agrega uno para comenzar</p>
          </div>
        ) : (
          streamers.map((streamer) => (
            <div 
              key={streamer.id}
              className={`bg-zinc-900 border rounded-2xl transition-all duration-300 overflow-hidden ${
                expandedId === streamer.id ? 'border-pink-500/50 shadow-lg' : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Accordion Header */}
              <button
                onClick={() => handleToggleAccordion(streamer)}
                className="w-full flex items-center justify-between px-6 py-5 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-800">
                    <img src={streamer.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight group-hover:text-pink-500 transition-colors">
                      {streamer.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                      {streamer.tagline || 'Streamer'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => handleDelete(e, streamer.id)}
                    className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                  <motion.div
                    animate={{ rotate: expandedId === streamer.id ? 180 : 0 }}
                    className="text-zinc-600"
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </div>
              </button>

              {/* Accordion Content */}
              <AnimatePresence>
                {expandedId === streamer.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-8 pb-8 pt-2 border-t border-zinc-800/50">
                      <StreamerForm 
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSave}
                        isSaving={isSaving}
                        showSave={hasChanges}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface StreamerFormProps {
  formData: Partial<CommunityStreamer>;
  setFormData: (data: Partial<CommunityStreamer>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  showSave: boolean;
}

const StreamerForm: React.FC<StreamerFormProps> = ({ formData, setFormData, onSubmit, isSaving, showSave }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Nombre</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-pink-500/50 transition-colors font-medium"
                placeholder="Nombre de usuario"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Categoría</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-pink-500/50 transition-colors font-medium"
                placeholder="Ej: Variedad • Artista"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Twitch URL</label>
            <div className="relative">
              <Twitch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input
                type="url"
                required
                value={formData.twitch_url || ''}
                onChange={(e) => setFormData({ ...formData, twitch_url: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-pink-500/50 transition-colors font-medium"
                placeholder="https://twitch.tv/..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Imagen de Perfil</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input
                type="text"
                required
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-pink-500/50 transition-colors font-medium"
                placeholder="URL o sube una"
              />
            </div>
          </div>
          <ImageUploader 
             currentImage={formData.image_url || null}
             onUpload={(url) => setFormData({ ...formData, image_url: url })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Biografía</label>
        <div className="relative">
          <AlignLeft className="absolute left-4 top-4 text-zinc-600" size={16} />
          <textarea
            value={formData.bio || ''}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-pink-500/50 transition-colors font-medium min-h-[100px] resize-none"
            placeholder="Escribe una breve biografía..."
          />
        </div>
      </div>

      <AnimatePresence>
        {showSave && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex justify-end pt-4"
          >
            <motion.button
              type="submit"
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-2 shadow-xl disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};
