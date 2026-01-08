
import React, { useState, useEffect, useRef } from 'react';
import { SkiVideo, VideoSource, KeyPoint } from '../types';
import { ICONS, TECH_TEMPLATES } from '../constants';
import { 
  X, Clock, Target, Check, 
  Loader2, Plus, Tag as TagIcon, Keyboard, Edit3, ArrowDown, ExternalLink, MessageCircle
} from 'lucide-react';

interface VideoModalProps {
  onClose: () => void;
  onSave: (video: SkiVideo) => void;
  initialData?: SkiVideo | null;
  availableTags: string[];
  onUpdateTags: (tags: string[]) => void;
}

interface InternalPoint {
  id: string;
  description: string;
  timestamp: string;
  tags: string[];
  isCapturing?: boolean;
  isSuccess?: boolean;
}

const VideoModal: React.FC<VideoModalProps> = ({ onClose, onSave, initialData, availableTags, onUpdateTags }) => {
  const [url, setUrl] = useState(initialData?.url || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [source, setSource] = useState<VideoSource>(initialData?.source || 'other');
  const [globalTags, setGlobalTags] = useState<string[]>(initialData?.tags || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [newTagInput, setNewTagInput] = useState('');
  
  const [points, setPoints] = useState<InternalPoint[]>(() => {
    if (initialData?.keyPoints && initialData.keyPoints.length > 0) {
      return initialData.keyPoints.map(p => ({
        id: p.id || Math.random().toString(36).substr(2, 9),
        description: p.description || '',
        timestamp: p.timestamp || '',
        tags: Array.isArray(p.tags) ? [...p.tags] : []
      }));
    }
    return [{ id: Math.random().toString(36).substr(2, 9), description: '', timestamp: '', tags: [] }];
  });

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number>(0);
  const isEdit = !!initialData;

  useEffect(() => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be')) setSource('youtube');
    else if (lowerUrl.includes('bilibili')) setSource('bilibili');
    else if (lowerUrl.includes('xiaohongshu') || lowerUrl.includes('xhslink')) setSource('xiaohongshu');
    else if (lowerUrl.includes('weixin') || lowerUrl.includes('wechat') || lowerUrl.includes('channels.weixin')) setSource('wechat');
    else if (url.trim() !== '') setSource('other');
  }, [url]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('youtube.com')) return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info && typeof data.info.currentTime === 'number') {
          lastTimeRef.current = data.info.currentTime;
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleCaptureClick = (pId: string) => {
    if (source === 'youtube') {
      setPoints(prev => prev.map(p => p.id === pId ? { ...p, isCapturing: true } : p));
      setTimeout(() => {
        const timeStr = new Date(lastTimeRef.current * 1000).toISOString().substr(14, 5);
        setPoints(prev => prev.map(p => 
          p.id === pId ? { ...p, timestamp: timeStr, isCapturing: false, isSuccess: true } : p
        ));
        setTimeout(() => {
          setPoints(prev => prev.map(p => p.id === pId ? { ...p, isSuccess: false } : p));
        }, 800);
      }, 50);
    } else {
      const input = document.getElementById(`time-input-${pId}`);
      if (input) input.focus();
    }
  };

  const toggleGlobalTag = (tag: string) => {
    setGlobalTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAddNewCustomTag = () => {
    const tag = newTagInput.trim();
    if (!tag) return;
    if (!availableTags.includes(tag)) {
      onUpdateTags([...availableTags, tag]);
    }
    if (!globalTags.includes(tag)) {
      setGlobalTags([...globalTags, tag]);
    }
    setNewTagInput('');
  };

  const togglePointTag = (pointId: string, tag: string) => {
    setPoints(prev => prev.map(p => {
      if (p.id === pointId) {
        const hasTag = p.tags.includes(tag);
        return { ...p, tags: hasTag ? p.tags.filter(t => t !== tag) : [...p.tags, tag] };
      }
      return p;
    }));
  };

  const handleAddPoint = () => {
    const newPoint = { id: Math.random().toString(36).substr(2, 9), description: '', timestamp: '', tags: [] };
    setPoints(prev => [...prev, newPoint]);
    setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      const lastInput = document.querySelector(`.point-desc-input:last-of-type`) as HTMLInputElement;
      if (lastInput) lastInput.focus();
    }, 100);
  };

  const useTemplate = (pointId: string, template: string) => {
    setPoints(prev => prev.map(p => {
      if (p.id === pointId) {
        const currentDesc = p.description.trim();
        const newDesc = currentDesc ? `${currentDesc} ${template}` : template;
        return { ...p, description: newDesc };
      }
      return p;
    }));
  };
  
  const updatePointField = (pointId: string, field: keyof InternalPoint, val: any) => {
    setPoints(prev => prev.map(p => p.id === pointId ? { ...p, [field]: val } : p));
  };

  const removePoint = (pointId: string) => {
    if (points.length <= 1) {
      setPoints([{ id: Math.random().toString(36).substr(2, 9), description: '', timestamp: '', tags: [] }]);
    } else {
      setPoints(prev => prev.filter(p => p.id !== pointId));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, pointId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPoint();
    }
  };

  const handleFinalSave = () => {
    if (!url.trim() || !title.trim()) {
      alert("请填写视频标题和链接");
      return;
    }

    const finalKeyPoints: KeyPoint[] = points
      .filter(p => p.description.trim() || p.timestamp.trim() || p.tags.length > 0)
      .map(p => ({
        id: p.id,
        description: p.description.trim() || "未命名技术点",
        timestamp: p.timestamp.trim(),
        tags: [...p.tags],
        category: 'technique'
      }));

    const videoData: SkiVideo = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      url: url.trim(),
      thumbnailUrl: initialData?.thumbnailUrl || (getYouTubeId(url) ? `https://img.youtube.com/vi/${getYouTubeId(url)}/maxresdefault.jpg` : ''),
      source,
      tags: [...globalTags],
      notes: notes.trim(),
      keyPoints: finalKeyPoints,
      addedAt: initialData?.addedAt || Date.now()
    };

    onSave(videoData);
    onClose();
  };

  const ytId = getYouTubeId(url);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-0 md:p-6 overflow-hidden">
      <div className="bg-slate-900 w-full max-w-6xl h-full md:h-[90vh] md:rounded-3xl border border-slate-700/50 flex flex-col md:flex-row shadow-2xl overflow-hidden">
        
        {/* 左侧预览区 */}
        <div className="w-full md:w-3/5 bg-black flex flex-col border-r border-slate-800">
          <div className="flex-grow relative bg-slate-950">
            {ytId ? (
              <iframe 
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&origin=${window.location.origin}&rel=0&autoplay=1`}
                frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen
              ></iframe>
            ) : source === 'bilibili' ? (
              <iframe 
                className="w-full h-full border-0"
                src={`//player.bilibili.com/player.html?bvid=${url.match(/BV[a-zA-Z0-9]+/)?.[0] || ''}&page=1&high_quality=1&danmaku=0`} 
                scrolling="no" frameBorder="0" allowFullScreen={true}
              ></iframe>
            ) : (source === 'wechat' || source === 'xiaohongshu') ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/60">
                <div className="relative mb-8">
                  <div className={`p-6 rounded-3xl border shadow-2xl ${source === 'wechat' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                    {source === 'wechat' ? <MessageCircle size={48} /> : ICONS.Logo}
                  </div>
                  <div className="absolute -bottom-2 -right-2 p-2 bg-slate-800 rounded-full border border-slate-700 text-blue-400">
                    <Keyboard size={16} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">已开启：{source === 'wechat' ? '微信视频' : '小红书'}手动分析模式</h3>
                <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
                  由于{source === 'wechat' ? '微信' : '小红书'}平台限制，无法直接在此预览。
                </p>
                <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 text-sm font-bold transition-all">
                  在原平台打开视频 <ExternalLink size={14} />
                </a>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center text-slate-600 bg-slate-900/40">
                <div className="mb-4 p-5 rounded-full bg-slate-800 border border-slate-700 text-blue-500 shadow-xl">{ICONS.Play}</div>
                <p className="text-sm max-w-xs text-slate-400">正在等待视频链接...</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-900/80 flex items-center justify-between border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${source === 'youtube' ? 'bg-red-500' : source === 'wechat' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
              {source.toUpperCase()} 模式
            </span>
            <div className="text-[10px] text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono bg-slate-800 px-1.5 py-0.5 rounded">ENTER</span> 快速换行
            </div>
          </div>
        </div>

        {/* 右侧表单区 */}
        <div className="w-full md:w-2/5 flex flex-col bg-slate-900 h-full">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Plus size={18} className="text-blue-500" />
              {isEdit ? '编辑笔记' : '收藏精彩视频'}
            </h2>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X size={20} /></button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="space-y-4">
              <div className="space-y-3">
                <input 
                  type="url" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50"
                  placeholder="粘贴 微信视频/B站/YouTube 链接" value={url} onChange={e => setUrl(e.target.value)}
                />
                <input 
                  type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-bold focus:outline-none focus:border-blue-500/50"
                  placeholder="视频标题" value={title} onChange={e => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">视频标签</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag} type="button" onClick={() => toggleGlobalTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        globalTags.includes(tag) ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1">
                    <input 
                      type="text" 
                      className="bg-transparent border-none text-[10px] text-slate-300 focus:outline-none w-16"
                      placeholder="新标签..."
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddNewCustomTag())}
                    />
                    <button 
                      type="button" onClick={handleAddNewCustomTag}
                      className="text-blue-500 hover:text-blue-400 p-0.5"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">技术拆解</label>
                <button type="button" onClick={handleAddPoint} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                  <Plus size={12} /> 手动新增
                </button>
              </div>
              
              <div className="space-y-6">
                {points.map((p) => (
                  <div key={p.id} className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                    p.isSuccess ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800/40 border-slate-700/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input 
                          id={`time-input-${p.id}`}
                          type="text"
                          className="w-24 bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-1 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500/50 text-[10px] font-mono text-center"
                          placeholder="00:00" value={p.timestamp}
                          onChange={e => updatePointField(p.id, 'timestamp', e.target.value)}
                        />
                        <Clock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        
                        <button 
                          type="button" onClick={() => handleCaptureClick(p.id)}
                          className={`absolute -right-8 top-1/2 -translate-y-1/2 transition-all ${
                            source === 'youtube' ? 'text-emerald-500' : 'text-blue-500'
                          }`}
                        >
                          {p.isCapturing ? <Loader2 size={12} className="animate-spin" /> : p.isSuccess ? <Check size={12} /> : source === 'youtube' ? <Target size={14} /> : <Edit3 size={14} />}
                        </button>
                      </div>
                      <div className="flex-grow"></div>
                      <button type="button" onClick={() => removePoint(p.id)} className="p-1 text-slate-600 hover:text-red-400"><X size={16} /></button>
                    </div>

                    <div className="space-y-2">
                      <input 
                        type="text" 
                        className="point-desc-input w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500/50 text-xs shadow-inner"
                        placeholder="记录此时的技术动作..."
                        value={p.description}
                        onChange={e => updatePointField(p.id, 'description', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, p.id)}
                      />
                      
                      {/* 快捷术语模版 */}
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] text-slate-600 flex items-center gap-0.5 mr-1 pt-1">
                          {ICONS.Zap}
                        </span>
                        {TECH_TEMPLATES.map(temp => (
                          <button
                            key={temp}
                            type="button"
                            onClick={() => useTemplate(p.id, temp)}
                            className="px-1.5 py-0.5 bg-slate-900/40 hover:bg-slate-700/60 border border-slate-800 hover:border-slate-600 rounded text-[9px] text-slate-500 hover:text-slate-300 transition-all"
                          >
                            {temp}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/30">
                       {availableTags.map(tag => (
                         <button
                           key={tag} type="button" onClick={() => togglePointTag(p.id, tag)}
                           className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                             p.tags.includes(tag) ? 'bg-blue-600/30 border-blue-500/50 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-600'
                           }`}
                         >
                           {tag}
                         </button>
                       ))}
                    </div>
                  </div>
                ))}
                
                <button type="button" onClick={handleAddPoint} className="w-full py-3 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 hover:text-blue-500/50 hover:border-blue-500/20 transition-all flex items-center justify-center gap-2 text-[10px] font-bold tracking-wider">
                  <Plus size={14} /> 添加新看点
                </button>
                <div ref={scrollEndRef} />
              </div>
            </div>

            <div className="pb-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">详细心得</label>
              <textarea 
                rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50 resize-none shadow-inner"
                placeholder="记录一些练习时的微小感受..."
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6 border-t border-slate-800 bg-slate-900 flex flex-col gap-3 relative z-10">
            <div className="flex gap-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 text-sm">
                取消
              </button>
              <button type="button" onClick={handleFinalSave} className="flex-[1.5] px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2">
                <Check size={18} /> 确认并加入库
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
