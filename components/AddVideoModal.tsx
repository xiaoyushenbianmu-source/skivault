
import React, { useState } from 'react';
import { SkiVideo, VideoSource, KeyPoint } from '../types';
import { ICONS, DEFAULT_TAGS } from '../constants';

interface AddVideoModalProps {
  onClose: () => void;
  onAdd: (video: SkiVideo) => void;
}

const AddVideoModal: React.FC<AddVideoModalProps> = ({ onClose, onAdd }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<VideoSource>('youtube');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [points, setPoints] = useState<string[]>(['']);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[7].length === 11) return match[7];
    const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return shortsMatch ? shortsMatch[1] : null;
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAddPoint = () => setPoints([...points, '']);
  const updatePoint = (idx: number, val: string) => {
    const newPoints = [...points];
    newPoints[idx] = val;
    setPoints(newPoints);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) return;

    let thumbUrl = '';
    const ytId = getYouTubeId(url);
    if (ytId) {
      thumbUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }

    const newVideo: SkiVideo = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      url,
      thumbnailUrl: thumbUrl,
      source,
      tags,
      notes,
      keyPoints: points.filter(p => p.trim()).map(p => ({
        id: Math.random().toString(36).substr(2, 5),
        description: p,
        category: 'technique'
      })),
      addedAt: Date.now()
    };
    onAdd(newVideo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-500">{ICONS.Plus}</span>
            收藏新滑雪视频
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">视频链接 (URL)</label>
              <input 
                autoFocus
                type="url"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="YouTube, Bilibili, 小红书, 视频号链接..."
                value={url}
                onChange={e => {
                  const val = e.target.value;
                  setUrl(val);
                  // Auto-detect source
                  if (val.includes('youtube') || val.includes('youtu.be')) setSource('youtube');
                  else if (val.includes('bilibili')) setSource('bilibili');
                  else if (val.includes('xhslink') || val.includes('xiaohongshu')) setSource('xiaohongshu');
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">标题</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="例如: 完美卡宾教学"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">来源</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={source}
                  onChange={e => setSource(e.target.value as VideoSource)}
                >
                  <option value="youtube">YouTube</option>
                  <option value="bilibili">Bilibili</option>
                  <option value="xiaohongshu">小红书</option>
                  <option value="wechat">微信视频</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">标签 (分类)</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      tags.includes(tag) 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">我的看点 (每一行一个点)</label>
              <div className="space-y-2">
                {points.map((p, idx) => (
                  <input 
                    key={idx}
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    placeholder={`看点 ${idx + 1}...`}
                    value={p}
                    onChange={e => updatePoint(idx, e.target.value)}
                  />
                ))}
                <button 
                  type="button"
                  onClick={handleAddPoint}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  + 添加更多看点
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">详细笔记 (心得体会)</label>
              <textarea 
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="描述一下这个视频对你的帮助..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-slate-900 py-4 border-t border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-colors"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
            >
              保存视频
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVideoModal;
