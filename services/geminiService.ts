
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SkiVideo, AIAnalysisResponse } from "../types";

/* Fixed: Use process.env.API_KEY directly as per guidelines. */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeVideoPoints = async (video: SkiVideo): Promise<AIAnalysisResponse> => {
  const prompt = `
    作为一名专业的滑雪教练，请分析以下视频收藏条目：
    标题: ${video.title}
    来源: ${video.source}
    我的笔记: ${video.notes}
    我记录的关键点: ${video.keyPoints.map(kp => kp.description).join(', ')}
    标签: ${video.tags.join(', ')}

    请根据以上内容，提供中文回复：
    1. 简洁总结为什么这个视频对训练有价值。
    2. 提供3个基于视频内容的实战练习建议（Drills）。
    3. 判定该视频内容适合的技术等级。
    
    必须严格按照要求的JSON格式返回，所有文本内容必须使用中文。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestedDrills: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            technicalLevel: { 
              type: Type.STRING,
              enum: ['beginner', 'intermediate', 'advanced', 'pro']
            }
          },
          required: ["summary", "suggestedDrills", "technicalLevel"]
        }
      }
    });

    /* Fixed: Directly access .text property from response. */
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      summary: "暂时无法进行深度分析，请检查网络或笔记内容后重试。",
      suggestedDrills: [],
      technicalLevel: 'intermediate'
    };
  }
};

export const chatWithCoach = async (history: { role: string, text: string }[], query: string, videos: SkiVideo[]) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `你是一位世界顶级的滑雪教练，正在通过中文与学员交流。
      你可以查看学员的视频库，并结合其中的技术要点进行指导。
      视频库现状：${videos.map(v => v.title).join(', ')}。
      回复要专业、具体、鼓励性强，并始终强调安全。`,
    },
  });

  const response = await chat.sendMessage({ message: query });
  /* Fixed: Directly access .text property from response. */
  return response.text;
};

export const generateCoachVoice = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `用专业且亲切的口气读出：${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore has a balanced, professional tone
          },
        },
      },
    });
    /* Fixed: Correctly extract audio data from candidates. */
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return undefined;
  }
};
