
import React from 'react';
import { 
  Play, 
  Plus, 
  Search, 
  Tag, 
  MessageSquare, 
  ChevronRight, 
  Snowflake, 
  ExternalLink,
  Trash2,
  Info,
  Clock,
  Zap
} from 'lucide-react';

export const ICONS = {
  Play: <Play size={18} />,
  Plus: <Plus size={20} />,
  Search: <Search size={18} />,
  Tag: <Tag size={16} />,
  Chat: <MessageSquare size={18} />,
  Arrow: <ChevronRight size={18} />,
  Logo: <Snowflake size={24} />,
  External: <ExternalLink size={14} />,
  Delete: <Trash2 size={18} />,
  Info: <Info size={16} />,
  Time: <Clock size={14} />,
  Zap: <Zap size={12} />
};

export const DEFAULT_TAGS = [
  'Carving', 
  'Short Turns', 
  'Powder', 
  'Park', 
  'Ground Tricks', 
  'Safety', 
  'Equipment Review', 
  'Backcountry'
];

export const TECH_TEMPLATES = [
  '外侧板加压',
  '重心前移',
  '入弯点',
  '立刃角度',
  '反弓姿势',
  '引申动作',
  '点杖时机',
  '屈膝减震',
  '双板平行',
  '下半身分离',
  '雪板切入感'
];

export const SOURCE_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  xiaohongshu: '小红书',
  wechat: '微信视频',
  bilibili: 'Bilibili',
  other: '其他'
};
