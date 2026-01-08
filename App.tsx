
import React, { useState, useEffect, useRef } from 'react';
import { SkiVideo, VideoSource } from './types';
import { ICONS, DEFAULT_TAGS } from './constants';
import VideoCard from './components/VideoCard';
import VideoModal from './components/VideoModal';
import VideoDetail from './components/VideoDetail';
import AIChat from './components/AIChat';
import { Download, Upload, ShieldCheck, Settings2, X as CloseIcon } from 'lucide-react';

const App: React.FC = () => {
  const [videos, setVideos] = useState<SkiVideo[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_TAGS);
  const [isTagEditMode, setIsTagEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<SkiVideo | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<SkiVideo | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load videos and tags
  useEffect(() => {
    const savedVideos = localStorage.getItem('ski_vault_videos');
    const savedTags = localStorage.getItem('ski_vault_tags');
    
    if (savedVideos) {
      try {
        const parsed = JSON.parse(savedVideos);
        if (Array.isArray(parsed)) setVideos(parsed);
      } catch (e) { console.error(e); }
    }
    
    if (savedTags) {
      try {
        const parsed = JSON.parse(savedTags);
        if (Array.isArray(parsed)) setAvailableTags(parsed);
      } catch (e) { console.error(e); }
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ski_vault_videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('ski_vault_tags', JSON.stringify(availableTags));
  }, [availableTags]);

  const handleSaveVideo = (video: SkiVideo) => {
    if (videos.some(v => v.id === video.id)) {
      setVideos(prev => prev.map(v => v.id === video.id ? video : v));
      if (selectedVideo?.id === video.id) setSelectedVideo(video);
    } else {
      setVideos(prev => [video, ...prev]);
    }
    setEditingVideo(null);
  };

  const handleUpdateTags = (newTags: string[]) => {
    setAvailableTags(newTags);
  };

  const deleteTag = (tagToDelete: string) => {
    if (confirm(`确定要删除标签 "${tagToDelete}" 吗？这不会删除视频，但视频将失去该标签。`)) {
      setAvailableTags(prev => prev.filter(t => t !== tagToDelete));
      if (activeFilter === tagToDelete) setActiveFilter('All');
    }
  };

  const deleteVideo = (id: string) => {
    if (confirm('确定要从库中删除这个视频吗？')) {
      setVideos(prev => prev.filter(v => v.id !== id));
      if (selectedVideo?.id === id) setSelectedVideo(null);
    }
  };

  const startEdit = (video: SkiVideo) => {
    setEditingVideo(video);
    setIsModalOpen(true);
  };

  const exportData = () => {
    const data = { videos, tags: availableTags };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `SkiVault_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content);
        if (confirm(`准备导入数据，是否覆盖当前内容？`)) {
          if (Array.isArray(imported)) { // Legacy format
            setVideos(imported);
          } else if (imported.videos && imported.tags) { // New format
            setVideos(imported.videos);
            setAvailableTags(imported.tags);
          }
          alert('导入成功！');
        }
      } catch (err) { alert('无效的备份文件格式'); }
    };
    fileReader.readAsText(files[0]);
  };

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         v.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = activeFilter === 'All' || v.tags.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isChatOpen ? 'lg:mr-96' : 'mr-0'}`}>
        <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
              {ICONS.Logo}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">SkiVault</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Personal Progression Lab</p>
            </div>
          </div>

          <div className="flex flex-1 max-w-xl mx-0 md:mx-8">
            <div className="relative w-full group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                {ICONS.Search}
              </span>
              <input 
                type="text"
                placeholder="搜索你的滑雪库..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-full pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
              <button onClick={exportData} title="导出备份" className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all">
                <Download size={18} />
              </button>
              <button onClick={() => fileInputRef.current?.click()} title="导入备份" className="p-2 text-slate-500 hover:text-green-400 hover:bg-slate-800 rounded-lg transition-all">
                <Upload size={18} />
              </button>
              <input type="file" ref={fileInputRef} onChange={importData} accept=".json" className="hidden" />
            </div>

            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                isChatOpen 
                ? 'bg-blue-600/10 border-blue-600 text-blue-400' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {ICONS.Chat} <span className="hidden sm:inline">AI 教练</span>
            </button>
            <button 
              onClick={() => {
                setEditingVideo(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20 text-white"
            >
              {ICONS.Plus} <span className="hidden sm:inline">收藏视频</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-end mb-6">
               <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/20">
                 <ShieldCheck size={12} />
                 数据自动保存至本地
               </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-6 no-scrollbar">
              <button 
                onClick={() => setActiveFilter('All')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  activeFilter === 'All' 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                全部视频
              </button>
              {availableTags.map(tag => (
                <div key={tag} className="relative group">
                  <button 
                    onClick={() => !isTagEditMode && setActiveFilter(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${
                      activeFilter === tag 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {tag}
                    {isTagEditMode && (
                      <div 
                        onClick={(e) => { e.stopPropagation(); deleteTag(tag); }}
                        className="p-0.5 hover:bg-red-500 rounded-full text-white/70 hover:text-white transition-colors"
                      >
                        <CloseIcon size={12} />
                      </div>
                    )}
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setIsTagEditMode(!isTagEditMode)}
                className={`p-2 rounded-full transition-all border ${
                  isTagEditMode ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="管理标签"
              >
                <Settings2 size={18} />
              </button>
            </div>

            {filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map(video => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    onClick={setSelectedVideo}
                    onDelete={deleteVideo}
                    onEdit={startEdit}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                <div className="bg-slate-900 p-8 rounded-full mb-6 border border-slate-800 opacity-50">
                  {ICONS.Logo}
                </div>
                <h2 className="text-xl font-bold text-slate-300 mb-2">你的滑雪库空空如也</h2>
                <p className="max-w-xs text-center text-sm">
                  点击右上角的“收藏视频”按钮，开始记录你的私人技术文档。
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} videos={videos} />

      {isModalOpen && (
        <VideoModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveVideo} 
          initialData={editingVideo}
          availableTags={availableTags}
          onUpdateTags={handleUpdateTags}
        />
      )}

      {selectedVideo && !isModalOpen && (
        <VideoDetail 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
          onEdit={startEdit}
        />
      )}
    </div>
  );
};

export default App;
