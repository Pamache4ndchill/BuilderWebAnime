import React, { useRef } from 'react';
import { 
  Image as ImageIcon, 
  Trash2, 
} from 'lucide-react';

export const ImageUploader = ({ 
  onUpload, 
  currentImage, 
  label = "Upload Image",
  className = "",
  aspect = "aspect-video" 
}: { 
  onUpload: (base64: string) => void; 
  currentImage: string | null;
  label?: string;
  className?: string;
  aspect?: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
      {currentImage ? (
        <div className={`relative ${aspect} rounded-lg overflow-hidden border border-zinc-800`}>
          <img 
            src={currentImage} 
            alt="Uploaded" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-pink-500/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-zinc-900 rounded-full text-pink-400 hover:bg-zinc-800 transition-colors"
            >
              <ImageIcon size={18} />
            </button>
            <button 
              onClick={() => onUpload('')}
              className="p-2 bg-zinc-900 rounded-full text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => fileInputRef.current?.click()}
          className={`w-full ${aspect} border-2 border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-zinc-700 hover:text-pink-400 transition-all bg-zinc-900`}
        >
          <ImageIcon size={24} />
          <span className="text-sm font-medium">{label}</span>
        </button>
      )}
    </div>
  );
};
