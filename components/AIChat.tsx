
import React, { useState, useRef, useEffect } from 'react';
import { SkiVideo } from '../types';
import { ICONS } from '../constants';
import { chatWithCoach, generateCoachVoice } from '../services/geminiService';
import { Volume2, Loader2, Square, Play, Pause, RotateCcw, Copy, Check, X, FastForward } from 'lucide-react';

interface AIChatProps {
  videos: SkiVideo[];
  isOpen: boolean;
  onClose: () => void;
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const AIChat: React.FC<AIChatProps> = ({ videos, isOpen, onClose }) => {
  const [messages, setMessages] = useState<{ 
    role: 'user' | 'ai', 
    text: string, 
    isPlaying?: boolean, 
    isPaused?: boolean,
    isBuffering?: boolean,
    playbackRate?: number,
    copied?: boolean
  }[]>([
    { role: 'ai', text: '你好！我是你的滑雪 AI 教练。我已经阅读了你收藏的所有视频笔记，有什么我可以帮你的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Audio State Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const currentAudioBufferRef = useRef<AudioBuffer | null>(null);
  const activeMessageIndexRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const initAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await chatWithCoach(
        messages.map(m => ({ role: m.role, text: m.text })),
        userMsg,
        videos
      );
      setMessages(prev => [...prev, { role: 'ai', text: response, playbackRate: 1.0 }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: '抱歉，我现在无法回答，请稍后再试。' }]);
    } finally {
      setLoading(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current = null;
    }
    if (activeMessageIndexRef.current !== null) {
      const idx = activeMessageIndexRef.current;
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, isPlaying: false, isPaused: false } : m));
      activeMessageIndexRef.current = null;
    }
    pausedAtRef.current = 0;
  };

  const rewindAudio = async () => {
    const idx = activeMessageIndexRef.current;
    if (idx === null || !currentAudioBufferRef.current) return;

    const ctx = await initAudioContext();
    const playbackRate = messages[idx].playbackRate || 1.0;

    // Calculate current position
    let currentPos = 0;
    if (messages[idx].isPaused) {
      currentPos = pausedAtRef.current;
    } else {
      currentPos = (ctx.currentTime - startTimeRef.current) * playbackRate;
    }

    // Rewind 5 seconds (more aggressive for immediate feel)
    const newPos = Math.max(0, currentPos - 5);
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = currentAudioBufferRef.current;
    source.playbackRate.value = playbackRate;
    source.connect(ctx.destination);
    
    startTimeRef.current = ctx.currentTime - (newPos / playbackRate);
    pausedAtRef.current = 0;
    
    source.onended = () => {
      if (!pausedAtRef.current) stopAudio();
    };

    sourceNodeRef.current = source;
    source.start(0, newPos);
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, isPaused: false, isPlaying: true } : m));
  };

  const togglePauseResume = async () => {
    const idx = activeMessageIndexRef.current;
    if (idx === null || !currentAudioBufferRef.current) return;

    const ctx = await initAudioContext();
    const playbackRate = messages[idx].playbackRate || 1.0;
    const isPaused = messages[idx].isPaused;

    if (!isPaused) {
      // Pause
      pausedAtRef.current = (ctx.currentTime - startTimeRef.current) * playbackRate;
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, isPaused: true } : m));
    } else {
      // Resume - use buffer immediately
      const source = ctx.createBufferSource();
      source.buffer = currentAudioBufferRef.current;
      source.playbackRate.value = playbackRate;
      source.connect(ctx.destination);
      
      const offset = pausedAtRef.current;
      startTimeRef.current = ctx.currentTime - (offset / playbackRate);
      
      source.onended = () => {
        if (!pausedAtRef.current || offset + 0.1 >= currentAudioBufferRef.current!.duration) {
          stopAudio();
        }
      };

      sourceNodeRef.current = source;
      source.start(0, offset);
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, isPaused: false } : m));
      pausedAtRef.current = 0;
    }
  };

  const changeSpeed = (index: number) => {
    setMessages(prev => prev.map((m, i) => {
      if (i === index) {
        const nextRate = m.playbackRate === 2.0 ? 1.0 : (m.playbackRate || 1.0) + 0.5;
        // If playing, update actual node playback rate immediately
        if (sourceNodeRef.current && activeMessageIndexRef.current === index) {
          sourceNodeRef.current.playbackRate.value = nextRate;
          // When changing rate during play, we must adjust startTime to keep current pos accurate
          const ctx = audioContextRef.current!;
          const currentPos = (ctx.currentTime - startTimeRef.current) * (m.playbackRate || 1.0);
          startTimeRef.current = ctx.currentTime - (currentPos / nextRate);
        }
        return { ...m, playbackRate: nextRate };
      }
      return m;
    }));
  };

  const playVoice = async (index: number, text: string) => {
    if (messages[index].isPlaying) {
      stopAudio();
      return;
    }

    stopAudio();
    setMessages(prev => prev.map((m, i) => i === index ? { ...m, isBuffering: true } : m));

    try {
      const base64Audio = await generateCoachVoice(text);
      if (!base64Audio) throw new Error("No audio data");

      const ctx = await initAudioContext();
      const audioData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
      
      currentAudioBufferRef.current = audioBuffer;
      activeMessageIndexRef.current = index;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = messages[index].playbackRate || 1.0;
      source.connect(ctx.destination);
      
      source.onended = () => {
        if (!pausedAtRef.current) stopAudio();
      };

      sourceNodeRef.current = source;
      startTimeRef.current = ctx.currentTime;
      
      setMessages(prev => prev.map((m, i) => i === index ? { ...m, isPlaying: true, isBuffering: false, isPaused: false } : m));
      source.start();
    } catch (err) {
      console.error("Playback error:", err);
      setMessages(prev => prev.map((m, i) => i === index ? { ...m, isBuffering: false, isPlaying: false } : m));
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessages(prev => prev.map((m, i) => i === index ? { ...m, copied: true } : m));
      setTimeout(() => {
        setMessages(prev => prev.map((m, i) => i === index ? { ...m, copied: false } : m));
      }, 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-[60] flex flex-col">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            {ICONS.Chat}
          </div>
          <span className="font-bold">AI 滑雪教练</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-md">
          <X size={20} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-6">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`relative group max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
              m.role === 'user' 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              {m.text}
              {m.role === 'ai' && (
                <button 
                  onClick={() => copyToClipboard(m.text, idx)}
                  className="absolute -right-8 top-0 p-1.5 text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="复制文本"
                >
                  {m.copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              )}
            </div>
            
            {m.role === 'ai' && (
              <div className="flex items-center gap-2 mt-2 px-1">
                <button 
                  onClick={() => playVoice(idx, m.text)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                    m.isPlaying 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-400'
                  }`}
                >
                  {m.isBuffering ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : m.isPlaying ? (
                    <><Square size={10} fill="currentColor" /> 停止</>
                  ) : (
                    <><Volume2 size={12} /> 播放建议</>
                  )}
                </button>

                {m.isPlaying && (
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                    <button 
                      onClick={rewindAudio}
                      className="p-1.5 bg-slate-800/80 border border-slate-700 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 active:scale-90 transition-all"
                      title="后退 5 秒"
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button 
                      onClick={togglePauseResume}
                      className="p-1.5 bg-slate-800/80 border border-slate-700 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 active:scale-90 transition-all"
                    >
                      {m.isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                    </button>
                    <button 
                      onClick={() => changeSpeed(idx)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 text-[10px] font-mono transition-all"
                    >
                      <FastForward size={10} /> {m.playbackRate?.toFixed(1)}x
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 rounded-2xl px-4 py-2 text-sm flex gap-1 items-center border border-slate-700 animate-pulse">
              思考中...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="relative">
          <input 
            type="text"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            placeholder="问问你的私人教练..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:opacity-50"
          >
            {ICONS.Arrow}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;
