import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Trophy, 
  Image as ImageIcon,
  Type,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/r2';
import { ImageUploader } from './ImageUploader';
import { TopItem, TopList } from '../types';

interface TopEditorProps {
  onBack: () => void;
}

const DEFAULT_ITEMS = (type: 'anime' | 'manga'): TopItem[] => 
  Array.from({ length: 10 }, (_, i) => ({
    id: crypto.randomUUID(),
    rank: i + 1,
    title: '',
    image: null
  }));

export const TopEditor: React.FC<TopEditorProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'anime' | 'manga'>('anime');
  const [tops, setTops] = useState<Record<'anime' | 'manga', TopList>>({
    anime: { id: 'anime-top', type: 'anime', items: DEFAULT_ITEMS('anime'), updatedAt: Date.now() },
    manga: { id: 'manga-top', type: 'manga', items: DEFAULT_ITEMS('manga'), updatedAt: Date.now() }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTops();
  }, []);

  const fetchTops = async () => {
    setIsLoading(true);
    try {
      const tableName = activeTab === 'anime' ? 'top_anime' : 'top_manga';
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const item = data[0];
        setTops(prev => ({
          ...prev,
          [activeTab]: {
            id: item.id,
            type: activeTab,
            items: item.items,
            updatedAt: new Date(item.updated_at).getTime()
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching tops:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = (type: 'anime' | 'manga', rank: number, updates: Partial<TopItem>) => {
    setTops(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        items: prev[type].items.map(item => 
          item.rank === rank ? { ...item, ...updates } : item
        ),
        updatedAt: Date.now()
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentTop = tops[activeTab];
      const tableName = activeTab === 'anime' ? 'top_anime' : 'top_manga';
      
      // 1. Upload images to R2
      const updatedItems = await Promise.all(currentTop.items.map(async (item) => {
        if (item.image && item.image.startsWith('data:')) {
          const url = await uploadToR2(item.image, `tops/${activeTab}`);
          return { ...item, image: url };
        }
        return item;
      }));

      // 2. Save to Supabase (using type-specific tables)
      const payload = {
        id: activeTab, // Fixed ID: 'anime' or 'manga'
        items: updatedItems,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from(tableName)
        .upsert(payload);

      if (error) throw error;

      // Update local state
      setTops(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          items: updatedItems,
          updatedAt: Date.now()
        }
      }));

      console.log(`Top 10 de ${activeTab} guardado exitosamente`);
    } catch (error) {
      console.error('Error saving top:', error);
      alert('Error al guardar el ranking.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentItems = tops[activeTab].items;

  return (
    <div className="flex h-screen bg-zinc-950 text-purple-100 font-sans overflow-hidden">
      {/* Sidebar for Tabs */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <button 
            onClick={onBack}
            className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-zinc-900">
            <Trophy size={18} />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-yellow-500">Top´s</h1>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('anime')}
            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
              activeTab === 'anime' 
                ? 'bg-yellow-500 text-zinc-900 font-bold shadow-lg shadow-yellow-500/10' 
                : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Sparkles size={18} />
            <span>Top 10 Anime</span>
          </button>
          <button
            onClick={() => setActiveTab('manga')}
            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
              activeTab === 'manga' 
                ? 'bg-yellow-500 text-zinc-900 font-bold shadow-lg shadow-yellow-500/10' 
                : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <ImageIcon size={18} />
            <span>Top 10 Manga</span>
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-zinc-800">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-2">
            Última Actualización
          </p>
          <p className="text-xs text-zinc-500 italic">
            {new Date(tops[activeTab].updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <h2 className="text-xl font-bold text-purple-50 tracking-tight">
               Ranking {activeTab === 'anime' ? 'Anime' : 'Manga'}
             </h2>
          </div>

          <button 
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-yellow-500 text-zinc-900 text-sm font-bold rounded-lg hover:bg-yellow-400 transition-all shadow-sm disabled:opacity-50 min-w-[160px] justify-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Guardar Ranking</span>
              </>
            )}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
               <Loader2 className="animate-spin" size={32} />
               <p>Cargando rankings...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-5 gap-4">
              {currentItems.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: item.rank * 0.05 }}
                  className="flex flex-col gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-3xl group hover:border-yellow-500/30 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-3 left-3 flex flex-col items-center gap-1 z-10">
                    <span className="text-3xl font-black italic text-yellow-500/10 group-hover:text-yellow-500/30 transition-colors tabular-nums">
                      {item.rank}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <ImageUploader 
                      currentImage={item.image}
                      onUpload={(img) => handleUpdateItem(activeTab, item.rank, { image: img })}
                      label="Subir Póster"
                      aspect="aspect-[3/4]"
                      className="w-full"
                    />

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 flex items-center gap-1">
                        <Type size={10} /> Título
                      </label>
                      <input 
                        type="text"
                        placeholder="Nombre..."
                        value={item.title}
                        onChange={(e) => handleUpdateItem(activeTab, item.rank, { title: e.target.value })}
                        className="w-full bg-zinc-800/30 rounded-lg px-3 py-2 text-sm font-bold border-none focus:ring-1 focus:ring-yellow-500/50 placeholder:text-zinc-800 outline-none text-purple-100"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
