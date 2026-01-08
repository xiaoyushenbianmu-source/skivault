
import React, { useState, useEffect, useRef } from 'react';
import { SkiVideo, AIAnalysisResponse } from '../types';
import { ICONS, SOURCE_LABELS } from '../constants';
import { analyzeVideoPoints } from '../services/geminiService';
import { Edit2, Play, Clock } from 'lucide-react';

interface VideoDetailProps {
  video: SkiVideo;
  onClose: () => void;
  onEdit: (video: SkiVideo) => void;
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: '初级入门',
  intermediate: '中级进阶',
  advanced: '高级专家',
  pro: '职业选手'
};

const VideoDetail: React.FC<VideoDetailProps> = ({ video, onClose, onEdit }) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTimestamp, setActiveTimestamp] = useState<number>(0);

  const triggerAI = async () => {
    setAnalyzing(true);
    const result = await analyzeVideoPoints(video);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [video]);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[7].length === 11) return match[7];
    const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return shortsMatch ? shortsMatch[1] : null;
  };

  const parseTimestamp = (timestamp: string): number => {
    if (!timestamp) return 0;
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const handleSeek = (timestamp: string) => {
    const seconds = parseTimestamp(timestamp);
    setActiveTimestamp(seconds);
  };

  const renderPlayer = () => {
    const url = video.url;
    const ytId = getYouTubeId(url);

    if (ytId) {
      // Adding start parameter for seeking
      const playerUrl = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&enablejsapi=1&start=${activeTimestamp}&autoplay=1`;
      return (
        <iframe 
          key={activeTimestamp} // Force refresh to seek
          className="w-full h-full"
          src={playerUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      );
    }

    if (url.includes('bilibili.com')) {
      const bvidMatch = url.match(/BV[a-zA-Z0-9]+/);
      if (bvidMatch) {
        // Bilibili uses t parameter (seconds)
        return (
          <iframe 
            key={activeTimestamp}
            className="w-full h-full border-0"
            src={`//player.bilibili.com/player.html?bvid=${bvidMatch[0]}&page=1&high_quality=1&danmaku=0&t=${activeTimestamp}`} 
            scrolling="no" 
            frameBorder="0" 
            allowFullScreen={true}
          ></iframe>
        );
      }
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-900/80">
        {video.thumbnailUrl && (
          <img src={video.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-10 blur-md" alt="" />
        )}
        <div className="relative z-10 space-y-6">
          <div className="w-24 h-24 bg-slate-800/80 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-xl">
            <div className="text-blue-500 scale-150">{ICONS.External}</div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">无法直接播放</h3>
            <p className="text-slate-400 max-w-sm mx-auto text-sm">
              部分视频出于创作者隐私设置，无法在三方应用内直接嵌入。
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <a 
              href={video.url} 
              target="_blank" 
              rel="noreferrer"
              className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 px-8 py-3.5 rounded-full text-white font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30"
            >
              在原平台打开播放
              <span className="group-hover:translate-x-1 transition-transform">{ICONS.Arrow}</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col md:flex-row overflow-hidden">
      <div className="md:w-16 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col items-center justify-between p-4 bg-slate-900/50">
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <div className="rotate-180">{ICONS.Arrow}</div>
        </button>
        <div className="hidden md:flex flex-col gap-4">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
            {ICONS.Play}
          </div>
          <div className="p-2 text-slate-600">
            {ICONS.Tag}
          </div>
        </div>
        <div className="md:mt-auto opacity-50">
          {ICONS.Logo}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto bg-slate-950">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
                {renderPlayer()}
              </div>

              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider">
                      {SOURCE_LABELS[video.source]}
                    </span>
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      {ICONS.Time} {new Date(video.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button 
                    onClick={() => onEdit(video)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all border border-slate-700"
                  >
                    <Edit2 size={12} /> 编辑视频
                  </button>
                </div>
                <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight">{video.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-800/80 text-slate-300 rounded-full text-xs border border-slate-700 hover:border-slate-500 transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-slate-100">
                    <span className="text-blue-500">{ICONS.Info}</span> 详细笔记
                  </h3>
                  <a 
                    href={video.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {ICONS.External} 打开原视频
                  </a>
                </div>
                <p className="text-slate-400 leading-relaxed whitespace-pre-wrap text-sm">
                  {video.notes || "暂无详细笔记内容。记录下你从这个视频中学到的关键动作或感受吧！"}
                </p>
              </div>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-blue-400 flex items-center gap-2">
                  {ICONS.Play} 核心看点
                </h3>
                <div className="space-y-3">
                  {video.keyPoints.length > 0 ? video.keyPoints.map((kp, idx) => (
                    <div key={kp.id} className="group flex flex-col p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-7 h-7 bg-slate-700 group-hover:bg-blue-600/30 group-hover:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors">
                          {idx + 1}
                        </div>
                        {kp.timestamp && (
                          <button 
                            onClick={() => handleSeek(kp.timestamp!)}
                            className="flex items-center gap-1.5 px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <Play size={10} fill="currentColor" /> {kp.timestamp}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{kp.description}</p>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                      暂未添加重点分析。
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/30 via-slate-900 to-indigo-900/30 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  {ICONS.Logo}
                </div>
                <h3 className="font-bold text-lg mb-2 text-white flex items-center gap-2 relative z-10">
                  {ICONS.Chat} AI 专家诊断
                </h3>
                
                {!aiAnalysis && !analyzing && (
                  <div className="py-4 relative z-10">
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">基于你的笔记 and 视频内容，AI 将为你提炼出关键的训练方案。</p>
                    <button 
                      onClick={triggerAI}
                      className="w-full py-3 bg-white text-slate-950 hover:bg-blue-50 rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-xl"
                    >
                      生成专家诊断
                    </button>
                  </div>
                )}

                {analyzing && (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-blue-400">正在分析技术细节</p>
                      <p className="text-[10px] text-slate-500 animate-pulse">正在调取雪场教练经验数据...</p>
                    </div>
                  </div>
                )}

                {aiAnalysis && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-700 relative z-10">
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md shadow-sm ${
                         aiAnalysis.technicalLevel === 'pro' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                         aiAnalysis.technicalLevel === 'advanced' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                         'bg-green-500/20 text-green-400 border border-green-500/30'
                       }`}>
                         推荐等级: {LEVEL_LABELS[aiAnalysis.technicalLevel] || aiAnalysis.technicalLevel}
                       </span>
                    </div>
                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        "{aiAnalysis.summary}"
                      </p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
                        教练实战建议
                      </p>
                      <div className="space-y-2">
                        {aiAnalysis.suggestedDrills.map((drill, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-xs text-slate-400 bg-slate-800/20 p-2 rounded-lg border border-slate-700/50">
                            <span className="text-blue-500 font-bold">0{idx + 1}</span>
                            <span className="leading-normal">{drill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
