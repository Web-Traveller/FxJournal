import React, { useState } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import { Badge } from '../ui/Badge';
import { X, ZoomIn, ZoomOut, RotateCcw, Tag } from 'lucide-react';

export const LightboxModal: React.FC = () => {
  const { lightboxImage, closeLightbox } = useJournalStore();
  const [zoom, setZoom] = useState(1);

  if (!lightboxImage) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 font-sans select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between z-20 bg-[#131417] px-3.5 py-2 rounded-[6px] border border-[#26282f] shadow-xl max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-[#a1a1aa]" />
          <span className="text-xs font-semibold text-[#fafafa] font-mono">{lightboxImage.label}</span>
          <Badge variant="neutral" size="xs">CHART MARKUP</Badge>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded-[3px] bg-[#181a1e] hover:bg-[#222429] text-[#a1a1aa] hover:text-[#ededed] border border-[#26282f] transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-[#ededed] w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded-[3px] bg-[#181a1e] hover:bg-[#222429] text-[#a1a1aa] hover:text-[#ededed] border border-[#26282f] transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1 rounded-[3px] bg-[#181a1e] hover:bg-[#222429] text-[#a1a1aa] hover:text-[#ededed] border border-[#26282f] transition ml-1"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-[#26282f] mx-2" />

          <button
            onClick={closeLightbox}
            className="p-1 rounded-[3px] bg-[#181a1e] hover:bg-[#f43f5e]/10 hover:text-[#f43f5e] text-[#a1a1aa] border border-[#26282f] transition"
            title="Close Viewer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4 select-none">
        <img
          src={lightboxImage.url}
          alt={lightboxImage.label}
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
          className="max-h-[82vh] max-w-[90vw] object-contain rounded-[4px] shadow-2xl border border-[#26282f]"
        />
      </div>

      {/* Clean Footer */}
      <div className="text-center text-[11px] text-[#71717a] font-mono py-1">
        Press Esc to exit
      </div>
    </div>
  );
};
