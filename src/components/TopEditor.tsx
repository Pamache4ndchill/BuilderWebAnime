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
    description: '',
    image: null
  }));

export const TopEditor: React.FC<TopEditorProps> = ({ onBack }) => {
  // ... (keep state and effects as they were)
  const [activeTab, setActiveTab] = useState<'anime' | 'manga'>('anime');
  const [tops, setTops] = useState<Record<'anime' | 'manga', TopList>>({
    anime: { id: 'anime-top', type: 'anime', items: DEFAULT_ITEMS('anime'), updatedAt: Date.now() },
    manga: { id: 'manga-top', type: 'manga', items: DEFAULT_ITEMS('manga'), updatedAt: Date.now() }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTops();
  }, [activeTab]);

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
            items: item.items.map((i: any) => ({ ...i, description: i.description || '' })),
            updatedAt: new Date(item.updated_at).getTime()
          }
        }));
      } else {
         // Reset to default if no data found
         setTops(prev => ({
           ...prev,
           [activeTab]: { id: `${activeTab}-top`, type: activeTab, items: DEFAULT_ITEMS(activeTab), updatedAt: Date.now() }
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
      
      const updatedItems = await Promise.all(currentTop.items.map(async (item) => {
        if (item.image && item.image.startsWith('data:')) {
          try {
            const url = await uploadToR2(item.image, `tops/${activeTab}`);
            return { ...item, image: url };
          } catch (r2Error: any) {
            throw new Error(`Error subiendo imagen a R2: ${r2Error.message || 'Error desconocido'}`);
          }
        }
        return item;
      }));

      const payload = {
        id: activeTab,
        items: updatedItems,
        updated_at: new Date().toISOString()
      };

      const { error: supabaseError } = await supabase
        .from(tableName)
        .upsert(payload);

      if (supabaseError) throw new Error(`Error en Supabase: ${supabaseError.message} (${supabaseError.code})`);

      setTops(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          items: updatedItems,
          updatedAt: Date.now()
        }
      }));

      console.log(`Top 10 de ${activeTab} guardado exitosamente`);
      alert(`Top 10 de ${activeTab} actualizado correctamente.`);
    } catch (error: any) {
      console.error('Error saving top:', error);
      alert(error.message || 'Error al guardar el ranking.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentItems = tops[activeTab].items;

  const renderItem = (item: TopItem) => (
    <motion.div 
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] group hover:border-yellow-500/30 transition-all flex items-stretch gap-6"
    >
      {/* Imagen a la izquierda (ocupa el alto del contenido) */}
      <div className="w-1/4 shrink-0 flex">
        <ImageUploader 
          currentImage={item.image}
          onUpload={(img) => handleUpdateItem(activeTab, item.rank, { image: img })}
          label="Póster"
          aspect="h-full"
          className="flex-1 w-full"
        />
      </div>
      
      {/* Contenido a la derecha (Título + Descripción) */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-4xl font-black text-yellow-500/20 group-hover:text-yellow-500 transition-colors tabular-nums">#{item.rank}</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>
        
        <div className="space-y-1 shrink-0">
          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-2">Título de la Obra</label>
          <input 
            type="text"
            placeholder="Nombre..."
            value={item.title}
            onChange={(e) => handleUpdateItem(activeTab, item.rank, { title: e.target.value })}
            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-4 text-purple-50 font-bold focus:ring-1 focus:ring-yellow-500/40 outline-none text-sm"
          />
        </div>

        <div className="flex-1 space-y-1 flex flex-col min-h-0">
          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-2">Descripción</label>
          <textarea 
            placeholder="¿Por qué está aquí?"
            value={item.description}
            onChange={(e) => handleUpdateItem(activeTab, item.rank, { description: e.target.value })}
            className="flex-1 w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 text-zinc-400 text-[11px] resize-none outline-none focus:ring-1 focus:ring-yellow-500/40 leading-relaxed scrollbar-hide"
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-purple-100 font-sans overflow-hidden">
      {/* Sidebar for Tabs */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <button onClick={onBack} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400">
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-zinc-900">
            <Trophy size={18} />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-yellow-500">Top´s</h1>
        </div>

        <div className="space-y-2">
          {['anime', 'manga'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                activeTab === tab 
                  ? 'bg-yellow-500 text-zinc-900 font-black shadow-lg shadow-yellow-500/20' 
                  : 'hover:bg-zinc-800 text-zinc-500'
              }`}
            >
              {tab === 'anime' ? <Sparkles size={18} /> : <ImageIcon size={18} />}
              <span className="capitalize">Top 10 {tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
        <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-10 bg-zinc-950/80 backdrop-blur-md">
          <h2 className="text-2xl font-black text-white tracking-tighter">Ranking {activeTab.toUpperCase()}</h2>
          <button 
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-yellow-500 text-zinc-900 font-black rounded-2xl hover:bg-yellow-400 transition-all min-w-[200px] justify-center shadow-lg shadow-yellow-500/10"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            <span>{isSaving ? 'Guardando...' : 'Guardar Ranking'}</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-12">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
               <Loader2 className="animate-spin" size={32} />
               <p className="font-bold">Cargando ranking...</p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {currentItems.map(renderItem)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
