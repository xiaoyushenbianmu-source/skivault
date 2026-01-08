
export type VideoSource = 'youtube' | 'xiaohongshu' | 'wechat' | 'bilibili' | 'other';

export interface KeyPoint {
  id: string;
  timestamp?: string;
  description: string;
  category: 'technique' | 'equipment' | 'terrain' | 'safety';
  // Added tags property to KeyPoint to match usage in VideoModal
  tags?: string[];
}

export interface SkiVideo {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: VideoSource;
  tags: string[];
  notes: string;
  keyPoints: KeyPoint[];
  addedAt: number;
}

export interface AIAnalysisResponse {
  summary: string;
  suggestedDrills: string[];
  technicalLevel: 'beginner' | 'intermediate' | 'advanced' | 'pro';
}