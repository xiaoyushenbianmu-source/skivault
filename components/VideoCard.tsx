
import React from 'react';
import { SkiVideo } from '../types';
import { ICONS, SOURCE_LABELS } from '../constants';
import { Edit2, StickyNote } from 'lucide-react';

interface VideoCardProps {
  video: SkiVideo;
  onClick: (video: SkiVideo) => void;
  onDelete: (id: string) => void;
  onEdit: (video: SkiVideo) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, onDelete, onEdit }) => {
  return (
    <div 
      className="group relative bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 cursor-pointer flex flex-col h-full shadow-lg"
      onClick={() => onClick(video)}
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={video.thumbnailUrl || `https://picsum.photos/seed/${video.id}/400/225`} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-blue-600 p-3 rounded-full text-white shadow-lg shadow-blue-600/40">
            {ICONS.Play}
          </div>
        </div>
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider text-slate-200 border border-white/10">
          {SOURCE_LABELS[video.source]}
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-semibold text-slate-100 line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors leading-tight">
          {video.title}
        </h3>
        
        <div className="flex flex-wrap gap-1.5 mb-3">
          {video.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-bold rounded-md border border-blue-500/20">
              {tag}
            </span>
          ))}
          {video.tags.length > 3 && (
            <span className="text-[10px] text-slate-500 font-medium">+{video.tags.length - 3}</span>
          )}
        </div>

        {/* 详细心得摘要 - 一眼可见 */}
        {video.notes && (
          <div className="mb-4 p-2.5 bg-slate-900/50 rounded-lg border border-slate-700/30">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
              <StickyNote size={10} className="text-blue-500" />
              心得体会
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed italic">
              "{video.notes}"
            </p>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 font-medium">
            {ICONS.Time}
            {new Date(video.addedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(video);
              }}
              className="p-1.5 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-all"
              title="编辑视频信息"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(video.id);
              }}
              className="p-1.5 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
              title="删除视频"
            >
              {ICONS.Delete}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
