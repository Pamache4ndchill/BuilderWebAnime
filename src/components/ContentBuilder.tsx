import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Type, 
  ChevronRight, 
  ChevronLeft,
  Search,
  Clock,
  Eye,
  Save,
  Layout,
  X,
  ArrowLeft,
  Loader2,
  CloudUpload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageUploader } from './ImageUploader';
import { NewsArticle, ContentBlock } from '../types';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/r2';

interface BuilderProps {
  title: string;
  contentType: string;
  author: string;
  onBack: () => void;
}

export const ContentBuilder: React.FC<BuilderProps> = ({ title, contentType, author, onBack }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedArticle = articles.find(a => a.id === selectedId);

  useEffect(() => {
    fetchArticles();
  }, [contentType]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from(contentType)
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setArticles(data.map(d => ({
          id: d.id,
          title: d.title,
          subtitle: d.subtitle,
          headerImage: d.header_image,
          content: d.content,
          createdAt: new Date(d.created_at).getTime(),
          updatedAt: new Date(d.updated_at).getTime(),
          status: d.status,
          author: d.author
        })));
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedArticle || isSaving) return;
    setIsSaving(true);

    try {
      // 1. Upload Header Image to R2 if it's new (base64)
      let headerImage = selectedArticle.headerImage;
      if (headerImage && headerImage.startsWith('data:')) {
        headerImage = await uploadToR2(headerImage, `${contentType}/headers`);
      }

      // 2. Upload Content Block Images to R2 if they are new
      const updatedContent = await Promise.all(selectedArticle.content.map(async (block) => {
        if (block.type === 'image' && block.value && block.value.startsWith('data:')) {
          const url = await uploadToR2(block.value, `${contentType}/blocks`);
          return { ...block, value: url };
        }
        return block;
      }));

      // 3. Save to Supabase (using contentType as table name)
      const payload = {
        id: selectedArticle.id,
        title: selectedArticle.title,
        subtitle: selectedArticle.subtitle,
        header_image: headerImage,
        content: updatedContent,
        status: selectedArticle.status,
        author: author,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from(contentType)
        .upsert(payload);

      if (error) throw error;

      // Update local state
      setArticles(prev => prev.map(a => 
        a.id === selectedArticle.id 
          ? { ...a, headerImage, content: updatedContent, updatedAt: Date.now() } 
          : a
      ));
      
      console.log('Guardado exitosamente en la nube');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar el contenido. Verifica la consola para más detalles.');
    } finally {
      setIsSaving(false);
    }
  };

  const createNewArticle = () => {
    const newArticle: NewsArticle = {
      id: crypto.randomUUID(),
      title: '',
      subtitle: '',
      headerImage: null,
      content: [{ id: crypto.randomUUID(), type: 'text', value: '' }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'draft',
      author: author
    };
    setArticles([newArticle, ...articles]);
    setSelectedId(newArticle.id);
  };

  const updateArticle = (id: string, updates: Partial<NewsArticle>) => {
    setArticles(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a
    ));
  };

  const deleteArticle = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este contenido de forma permanente?')) {
      try {
        const { error } = await supabase
          .from(contentType)
          .delete()
          .eq('id', id);

        if (error) throw error;

        setArticles(prev => prev.filter(a => a.id !== id));
        if (selectedId === id) setSelectedId(null);
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Error al eliminar el contenido.');
      }
    }
  };

  const addBlock = (type: 'text' | 'image') => {
    if (!selectedId) return;
    const newBlock: ContentBlock = type === 'text' 
      ? { id: crypto.randomUUID(), type: 'text', value: '' }
      : { id: crypto.randomUUID(), type: 'image', value: '' };
    
    updateArticle(selectedId, {
      content: [...(selectedArticle?.content || []), newBlock]
    });
  };

  const updateBlock = (blockId: string, value: string) => {
    if (!selectedId || !selectedArticle) return;
    updateArticle(selectedId, {
      content: selectedArticle.content.map(b => 
        b.id === blockId ? { ...b, value } : b
      )
    });
  };

  const removeBlock = (blockId: string) => {
    if (!selectedId || !selectedArticle) return;
    updateArticle(selectedId, {
      content: selectedArticle.content.filter(b => b.id !== blockId)
    });
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!selectedId || !selectedArticle) return;
    const index = selectedArticle.content.findIndex(b => b.id === blockId);
    if (index === -1) return;
    
    const newContent = [...selectedArticle.content];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newContent.length) {
      [newContent[index], newContent[newIndex]] = [newContent[newIndex], newContent[index]];
      updateArticle(selectedId, { content: newContent });
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-purple-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 320 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-zinc-900 border-r border-zinc-800 flex flex-col relative z-20"
      >
        <div className="p-6 border-bottom border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center text-zinc-900">
              <Layout size={18} />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-pink-400">{title}</h1>
          </div>
          <button 
            onClick={createNewArticle}
            className="p-2 bg-pink-500 text-zinc-900 rounded-full hover:bg-pink-400 transition-colors"
            title="Create New"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 transition-all outline-none text-purple-100 placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 gap-3">
              <Loader2 className="animate-spin" size={24} />
              <p className="text-xs">Cargando contenido...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <p className="text-sm italic">No hay contenido</p>
            </div>
          ) : (
            filteredArticles.map(article => (
              <button
                key={article.id}
                onClick={() => setSelectedId(article.id)}
                className={`w-full text-left p-4 rounded-xl transition-all group relative ${
                  selectedId === article.id 
                    ? 'bg-pink-500 text-zinc-900 shadow-lg shadow-pink-500/10' 
                    : 'hover:bg-zinc-800 text-purple-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] uppercase font-bold tracking-widest opacity-60`}>
                    {article.status}
                  </span>
                  <span className="text-[10px] opacity-40">
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                  {article.title || 'Sin Título'}
                </h3>
                <p className="text-xs opacity-60 line-clamp-2">
                  {article.subtitle || 'Sin subtítulo'}
                </p>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteArticle(article.id);
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                    selectedId === article.id ? 'text-zinc-900 hover:bg-black/10' : 'text-pink-400 hover:bg-pink-400/10'
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </button>
            ))
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-zinc-950">
        {/* Header Bar */}
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 transition-colors"
            >
              {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            {selectedArticle && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Clock size={14} />
                <span>Última edición {new Date(selectedArticle.updatedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              disabled={!selectedArticle || isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-zinc-900 text-sm font-medium rounded-lg hover:bg-pink-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Publicar en Nube</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto">
          {selectedArticle ? (
            <div className="max-w-4xl mx-auto py-12 px-8">
              {/* Header Image Section */}
              <div className="mb-12">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-4">
                  Imagen de Cabecera
                </label>
                <ImageUploader 
                  currentImage={selectedArticle.headerImage}
                  onUpload={(img) => updateArticle(selectedArticle.id, { headerImage: img })}
                  label="Añadir Imagen de Cabecera"
                  className="w-full"
                />
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-6 mb-12">
                  <input 
                    type="text"
                    placeholder="Título..."
                    value={selectedArticle.title}
                    onChange={(e) => updateArticle(selectedArticle.id, { title: e.target.value })}
                    className="w-full text-5xl font-bold tracking-tight border-none focus:ring-0 placeholder:text-zinc-500 outline-none text-purple-50"
                  />
                  <textarea 
                    placeholder="Subtítulo o Resumen..."
                    value={selectedArticle.subtitle}
                    onChange={(e) => updateArticle(selectedArticle.id, { subtitle: e.target.value })}
                    className="w-full text-xl text-zinc-500 border-none focus:ring-0 placeholder:text-zinc-500 outline-none resize-none h-24"
                  />
                </div>

                <div className="h-px bg-zinc-900 mb-12" />

                {/* Dynamic Content Blocks */}
                <div className="space-y-8 mb-20">
                  <AnimatePresence mode="popLayout">
                    {selectedArticle.content.map((block, index) => (
                      <motion.div 
                        key={block.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative"
                      >
                        <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                          <button 
                            onClick={() => moveBlock(block.id, 'up')}
                            disabled={index === 0}
                            className="p-1.5 text-zinc-600 hover:text-pink-400 disabled:opacity-20 transition-colors"
                          >
                            <ChevronRight className="-rotate-90" size={16} />
                          </button>
                          <button 
                            onClick={() => moveBlock(block.id, 'down')}
                            disabled={index === selectedArticle.content.length - 1}
                            className="p-1.5 text-zinc-600 hover:text-pink-400 disabled:opacity-20 transition-colors"
                          >
                            <ChevronRight className="rotate-90" size={16} />
                          </button>
                          <button 
                            onClick={() => removeBlock(block.id)}
                            className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {block.type === 'text' ? (
                          <textarea 
                            placeholder="Escribe aquí..."
                            value={block.value}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            className="w-full text-lg leading-relaxed text-purple-200 border-none focus:ring-0 placeholder:text-zinc-500 outline-none resize-none min-h-[100px]"
                            style={{ height: 'auto' }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = `${target.scrollHeight}px`;
                            }}
                          />
                      ) : (
                        <div className="space-y-2">
                          <ImageUploader 
                            currentImage={block.value}
                            onUpload={(img) => updateBlock(block.id, img)}
                            label="Añadir Imagen"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Add Block Toolbar */}
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 z-30">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mr-2">
                  Añadir Bloque
                </span>
                <button 
                  onClick={() => addBlock('text')}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 rounded-full text-sm font-medium transition-colors text-purple-300"
                >
                  <Type size={16} />
                  <span>Texto</span>
                </button>
                <div className="w-px h-4 bg-zinc-800" />
                <button 
                  onClick={() => addBlock('image')}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 rounded-full text-sm font-medium transition-colors text-purple-300"
                >
                  <ImageIcon size={16} />
                  <span>Imagen</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
                <Layout size={32} />
              </div>
              <div className="text-center">
                <h2 className="text-purple-100 font-semibold">Selecciona un elemento para editar</h2>
                <p className="text-sm">O crea uno nuevo para empezar</p>
              </div>
              <button 
                onClick={createNewArticle}
                className="mt-4 px-6 py-2 bg-pink-500 text-zinc-900 rounded-full hover:bg-pink-400 transition-all shadow-md"
              >
                Crear Nuevo
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
