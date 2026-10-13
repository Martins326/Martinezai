import React, { useState } from 'react';
import {
  X,
  ImageIcon,
  Sparkles,
  Download,
  Plus,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { Attachment } from '../types';

interface ImageGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachImageToChat?: (attachment: Attachment) => void;
}

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square' },
  { id: '16:9', label: '16:9 Landscape' },
  { id: '4:3', label: '4:3 Standard' },
  { id: '9:16', label: '9:16 Portrait' },
];

export const ImageGenModal: React.FC<ImageGenModalProps> = ({
  isOpen,
  onClose,
  onAttachImageToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [attachedSuccess, setAttachedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAttachedSuccess(false);

    try {
      const data = await ApiService.generateImage(prompt.trim(), aspectRatio);
      setGeneratedImageUrl(data.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Image generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `martins_ai_${Date.now()}.png`;
    a.click();
  };

  const handleAttachToChat = () => {
    if (!generatedImageUrl || !onAttachImageToChat) return;

    const base64Data = generatedImageUrl.split(',')[1] || '';
    const newAtt: Attachment = {
      id: 'att_img_' + Date.now(),
      name: `generated_image_${Date.now().toString().slice(-4)}.png`,
      mimeType: 'image/png',
      size: Math.round(base64Data.length * 0.75),
      data: base64Data,
    };

    onAttachImageToChat(newAtt);
    setAttachedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Gemini Image Generation</h2>
              <p className="text-[11px] text-neutral-400">Create visuals directly with Martins AI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-neutral-300 flex-1">
          <form onSubmit={handleGenerate} className="space-y-3.5">
            <div>
              <label className="font-semibold text-neutral-200 block mb-1.5">
                Image Description Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A minimalist architectural render of a futuristic library with glass domes, warm sunlight, clean lines..."
                rows={3}
                className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="font-semibold text-neutral-200 block mb-1.5">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`py-2 px-2.5 rounded-lg border text-center transition-colors text-[11.5px] ${
                      aspectRatio === ar.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-white font-semibold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Generating image...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Generate Image</span>
                </>
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedImageUrl && (
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <div className="font-semibold text-neutral-200">Generated Result</div>
              <div className="rounded-xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center max-h-72">
                <img
                  src={generatedImageUrl}
                  alt={prompt}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain max-h-72"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>

                {onAttachImageToChat && (
                  <button
                    type="button"
                    onClick={handleAttachToChat}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                  >
                    {attachedSuccess ? (
                      <>
                        <Check size={14} className="text-emerald-300" />
                        <span>Attached!</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Attach to Chat</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
