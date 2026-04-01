import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Search, 
  ExternalLink,
  Play,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Edit2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/r2';
import { Recommendation } from '../types';
import { ImageUploader } from './ImageUploader';

interface RecommendationEditorProps {
  onBack: () => void;
}

export const RecommendationEditor: React.FC<RecommendationEditorProps> = ({ onBack }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState<Partial<Recommendation>>({
    title: 'El equipo de Shonalime recomienda',
    anime_name: '',
    trailer_url: '',
    image_url: ''
  });

  const resetForm = () => {
    setFormData({
      title: 'El equipo de Shonalime recomienda',
      anime_name: '',
      trailer_url: '',
      image_url: ''
    });
    setIsAdding(false);
    setError(null);
  };

  const handleEdit = (rec: Recommendation) => {
    setFormData(rec);
    setIsAdding(true);
    setError(null);
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('recomendacion')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (err: any) {
      setError('Error al cargar recomendaciones: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.anime_name || !formData.trailer_url || !formData.image_url) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let finalImageUrl = formData.image_url;
      if (finalImageUrl && finalImageUrl.startsWith('data:')) {
        try {
          finalImageUrl = await uploadToR2(finalImageUrl, 'recomendaciones');
        } catch (r2Error: any) {
          throw new Error(`Error subiendo imagen a R2: ${r2Error.message || 'Error desconocido'}`);
        }
      }

      const payload = {
        ...formData,
        image_url: finalImageUrl
      };

      const { data, error } = await supabase
        .from('recomendacion')
        .upsert([payload])
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No se recibió confirmación del servidor al guardar.');

      if (formData.id) {
        // Update existing
        setRecommendations(prev => prev.map(r => r.id === formData.id ? data[0] : r));
      } else {
        // Add new
        setRecommendations([data[0], ...recommendations]);
      }
      
      resetForm();
    } catch (err: any) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres borrar esta recomendación?')) return;

    try {
      const { error } = await supabase
        .from('recomendacion')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRecommendations(recommendations.filter(r => r.id !== id));
    } catch (err: any) {
      setError('Error al eliminar: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-zinc-900 px-10 py-8 rounded-[3rem] border border-zinc-800 shadow-2xl">
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-zinc-800 hover:border-pink-500/50 transition-colors"
          >
            <ArrowLeft size={20} className="text-pink-500" />
          </motion.button>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-2">Recomendaciones</h1>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest tracking-tighter">Gestiona la sección "Te Recomendamos"</p>
          </div>
        </div>

        {isAdding && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetForm}
            className="px-8 py-4 bg-zinc-800 rounded-2xl flex items-center gap-3 text-white font-black uppercase tracking-widest text-xs shadow-lg active:translate-y-1 transition-all border border-zinc-700"
          >
            <ArrowLeft size={18} />
            Volver al Listado
          </motion.button>
        )}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500"
        >
          <AlertCircle size={24} />
          <p className="font-medium">{error}</p>
        </motion.div>
      )}

      {isAdding ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl"
        >
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 px-2">Título de la sección</label>
                <input
                  type="text"
                  value={formData.title}
                  readOnly
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-zinc-400 focus:outline-none transition-colors font-medium cursor-not-allowed opacity-60"
                  placeholder="Ej: El equipo de Shonalime recomienda"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 px-2">Nombre del Anime</label>
                <input
                  type="text"
                  value={formData.anime_name}
                  onChange={(e) => setFormData({ ...formData, anime_name: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-pink-500 transition-colors font-medium"
                  placeholder="Ej: Oshi no Ko"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 px-2">URL del Trailer (YouTube)</label>
                <div className="relative">
                  <Play className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="text"
                    value={formData.trailer_url}
                    onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-pink-500 transition-colors font-medium"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 px-2">Imagen de Portada</label>
                <div className="relative">
                  <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-pink-500 transition-colors font-medium"
                    placeholder="URL de la imagen o Sube una"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
               <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 px-2">O sube una imagen</label>
               <ImageUploader 
                 currentImage={formData.image_url || null}
                 onUpload={(url) => setFormData({ ...formData, image_url: url })}
               />
            </div>

            <div className="flex justify-end pt-6">
              <motion.button
                type="submit"
                disabled={isSaving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-12 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:translate-y-1 transition-all"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSaving ? 'Guardando...' : formData.id ? 'Actualizar Recomendación' : 'Publicar Recomendación'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-pink-500" size={48} />
              <p className="text-zinc-500 font-black tracking-widest uppercase text-xs">Cargando recomendaciones...</p>
            </div>
          ) : (
            Array.from({ length: 4 }).map((_, index) => {
              const rec = recommendations[index];
              if (rec) {
                return (
                  <motion.div
                    key={rec.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group relative bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-pink-500/30 transition-all duration-500"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img src={rec.image_url} alt={rec.anime_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    </div>
                    
                    <div className="absolute top-6 right-6 flex gap-2">
                       <button 
                         onClick={() => handleEdit(rec)}
                         className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl flex items-center justify-center hover:bg-white hover:text-black transition-all transform hover:-rotate-6 shadow-lg"
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                         onClick={() => handleDelete(rec.id)}
                         className="w-10 h-10 bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all transform hover:rotate-6 shadow-lg"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>

                    <div className="p-8 relative">
                       <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500 py-1 px-3 bg-pink-500/10 rounded-full border border-pink-500/20">
                             {rec.title}
                          </span>
                       </div>
                       <h3 className="text-2xl font-black text-white tracking-tighter mb-4">{rec.anime_name}</h3>
                       
                       <div className="flex items-center gap-4">
                         <a 
                           href={rec.trailer_url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex-1 flex items-center justify-center gap-3 bg-white text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-pink-500 hover:text-black transition-all group/btn"
                         >
                            <Play size={14} className="fill-current" />
                            Ver Trailer
                            <ExternalLink size={14} className="ml-1 opacity-50 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                         </a>
                       </div>
                    </div>
                  </motion.div>
                );
              } else {
                return (
                  <motion.div
                    key={`empty-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      resetForm();
                      setIsAdding(true);
                    }}
                    className="group relative bg-zinc-900/50 border-2 border-zinc-800 border-dashed rounded-[2.5rem] overflow-hidden hover:border-pink-500/50 transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900"
                  >
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-zinc-800 mb-6 group-hover:scale-110 group-hover:border-pink-500/50 transition-all duration-500">
                      <Plus size={24} className="text-zinc-600 group-hover:text-pink-500 transition-colors" />
                    </div>
                    <p className="text-white font-black tracking-widest uppercase text-sm mb-2">Añadir Recomendación</p>
                    <p className="text-zinc-500 font-medium text-[10px] uppercase tracking-widest">Espacio {index + 1} de 4</p>
                  </motion.div>
                );
              }
            })
          )}
        </div>
      )}
    </div>
  );
};
