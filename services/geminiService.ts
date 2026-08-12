import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuizSetup, EssayQuestion, FileData } from "../types";

export const USER_API_KEY_STORAGE_KEY = 'brainboost_user_gemini_api_key';
export const USER_MODEL_STORAGE_KEY = 'brainboost_user_gemini_model';

// Utility: Lấy API Key đang hiệu lực (Ưu tiên API Key cá nhân của người dùng, nếu không có sẽ dùng API Key mặc định)
export const getStoredApiKey = (): string => {
  const userKey = localStorage.getItem(USER_API_KEY_STORAGE_KEY);
  if (userKey && userKey.trim() !== '') {
    return userKey.trim();
  }
  return (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
};

// Utility: Kiểm tra xem người dùng đã thiết lập API Key cá nhân chưa
export const hasCustomApiKey = (): boolean => {
  const userKey = localStorage.getItem(USER_API_KEY_STORAGE_KEY);
  return !!(userKey && userKey.trim().length > 0);
};

// Utility: Lưu API Key cá nhân
export const saveUserApiKey = (key: string): void => {
  localStorage.setItem(USER_API_KEY_STORAGE_KEY, key.trim());
};

// Utility: Xóa API Key cá nhân (quay lại dùng mặc định)
export const removeUserApiKey = (): void => {
  localStorage.removeItem(USER_API_KEY_STORAGE_KEY);
  localStorage.removeItem(USER_MODEL_STORAGE_KEY);
};

// Danh sách mô hình ứng tuyển tự động chọn mô hình chạy tốt nhất cho API Key
const getCandidateModels = (preferredPrimary?: string): string[] => {
  const savedModel = localStorage.getItem(USER_MODEL_STORAGE_KEY);
  const candidates = [
    savedModel,
    preferredPrimary,
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.0-flash'
  ].filter((m): m is string => Boolean(m && m.trim().length > 0));

  return Array.from(new Set(candidates));
};

// Clean và parse JSON hỗ trợ trường hợp model trả về text bọc trong ```json
const cleanAndParseJson = (text: string): any => {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned);
};

// Kiểm tra & Tự động cấu hình mô hình tương thích phù hợp cho API Key của người dùng
export const testAndAutoConfigureApiKey = async (keyToTest?: string): Promise<{ success: boolean; model: string; message: string }> => {
  const key = (keyToTest || getStoredApiKey()).trim();
  if (!key) {
    return { success: false, model: '', message: 'Chưa nhập API Key. Vui lòng dán mã API Key của bạn.' };
  }

  const testModels = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.0-flash'
  ];

  const ai = new GoogleGenAI({ apiKey: key });

  for (const modelCandidate of testModels) {
    try {
      const res = await ai.models.generateContent({
        model: modelCandidate,
        contents: 'Hãy trả lời ngắn gọn đúng 1 từ "OK" để kiểm tra kết nối API.',
      });
      
      if (res.text) {
        localStorage.setItem(USER_MODEL_STORAGE_KEY, modelCandidate);
        return {
          success: true,
          model: modelCandidate,
          message: `Kết nối thành công! Tự động cấu hình mô hình [${modelCandidate}] tương thích 100% với API Key của bạn.`
        };
      }
    } catch (err: any) {
      console.warn(`Thử mô hình ${modelCandidate} thất bại:`, err?.message || err);
      const errMsg = (err?.message || '').toLowerCase();
      if (errMsg.includes('api_key_invalid') || errMsg.includes('api key not valid') || errMsg.includes('unauthorized') || errMsg.includes('401') || errMsg.includes('permission_denied')) {
        return {
          success: false,
          model: '',
          message: 'Mã API Key không hợp lệ hoặc đã bị vô hiệu hóa. Vui lòng kiểm tra lại mã Key bạn vừa nhập trên Google AI Studio.'
        };
      }
    }
  }

  return {
    success: false,
    model: '',
    message: 'Không thể kết nối với mô hình Gemini nào thông qua API Key này. Vui lòng kiểm tra lại kết nối mạng hoặc thử tạo mới API Key.'
  };
};

export const generateSummary = async (setup: QuizSetup): Promise<string> => {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error("Chưa có API Key. Vui lòng cấu hình API Key cá nhân ở thanh công cụ phía trên.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const gradeNames: Record<string, string> = {
    primary: 'Tiểu học',
    secondary: 'Trung học cơ sở',
    highschool: 'Trung học thông phổ',
    advanced: 'Đại học / Người đi làm'
  };

  const bookSeriesNames: Record<string, string> = {
    canh_dieu: 'Cánh diều',
    ket_noi_tri_thuc: 'Kết nối tri thức với cuộc sống',
    chan_troi_sang_tao: 'Chân trời sáng tạo',
    none: 'Chương trình chuẩn'
  };

  const studentContext = `Học sinh lớp ${setup.className}, khối ${setup.gradeNumber} (${gradeNames[setup.gradeLevel]}), trường ${setup.schoolName}, tỉnh ${setup.province}.`;

  let prompt = `Bạn là một chuyên gia giáo dục AI. Hãy viết một bản TỔNG HỢP KIẾN THỨC chi tiết, dễ hiểu và khoa học cho nội dung sau:
  - Chủ đề/Bài học: ${setup.topic}
  - Đối tượng: ${studentContext}
  - Bộ sách: ${bookSeriesNames[setup.bookSeries]}`;

  if (setup.advancedInstructions) {
    prompt += `\n- Yêu cầu bổ sung: ${setup.advancedInstructions}`;
  }

  prompt += `\n\nYêu cầu bản tóm tắt bao gồm:
  1. Khái niệm/Định nghĩa chính.
  2. Các nội dung trọng tâm (chia theo các mục rõ ràng).
  3. Các công thức hoặc quy tắc cần nhớ (nếu có).
  4. Ví dụ minh họa ngắn gọn.
  5. Lời khuyên để học tốt phần này.
  
  Định dạng: Sử dụng Markdown để trình bày đẹp mắt, rõ ràng. Ngôn ngữ: Tiếng Việt.`;

  const parts: any[] = [{ text: prompt }];

  if (setup.fileData) {
    parts.push({
      inlineData: {
        data: setup.fileData.data,
        mimeType: setup.fileData.mimeType
      }
    });
  }

  const candidateModels = getCandidateModels('gemini-3.1-flash-lite-preview');
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
      });
      if (response.text) {
        return response.text;
      }
    } catch (error: any) {
      console.warn(`Lỗi khi tạo tóm tắt với mô hình ${model}:`, error);
      lastError = error;
      const errMsg = (error?.message || '').toLowerCase();
      if (errMsg.includes('api_key_invalid') || errMsg.includes('api key not valid') || errMsg.includes('401')) {
        throw new Error("⚠️ API Key của bạn không hợp lệ. Vui lòng bấm 'Cấu hình API' ở góc trên để cập nhật key mới.");
      }
    }
  }

  console.error("Error generating summary:", lastError);
  throw new Error("Lỗi khi kết nối với AI. Vui lòng kiểm tra lại API Key hoặc mạng internet.");
};

export const generateEssayQuestions = async (setup: QuizSetup): Promise<EssayQuestion[]> => {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error("Chưa có API Key. Vui lòng cấu hình API Key cá nhân ở thanh công cụ phía trên.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const gradeNames: Record<string, string> = {
    primary: 'Tiểu học',
    secondary: 'Trung học cơ sở',
    highschool: 'Trung học thông phổ',
    advanced: 'Đại học / Người đi làm'
  };

  const bookSeriesNames: Record<string, string> = {
    canh_dieu: 'Cánh diều',
    ket_noi_tri_thuc: 'Kết nối tri thức với cuộc sống',
    chan_troi_sang_tao: 'Chân trời sáng tạo',
    none: 'Chương trình chuẩn'
  };

  const studentContext = `Học sinh lớp ${setup.className}, khối ${setup.gradeNumber} (${gradeNames[setup.gradeLevel]}), trường ${setup.schoolName}, tỉnh ${setup.province}.`;

  let prompt = `Bạn là một chuyên gia giáo dục AI. Hãy tạo 3-5 câu hỏi TỰ LUẬN (essay questions) chuyên sâu cho nội dung sau:
  - Chủ đề/Bài học: ${setup.topic}
  - Đối tượng: ${studentContext}
  - Bộ sách: ${bookSeriesNames[setup.bookSeries]}`;

  if (setup.advancedInstructions) {
    prompt += `\n- Yêu cầu bổ sung: ${setup.advancedInstructions}`;
  }

  prompt += `\n\nYêu cầu mỗi câu hỏi bao gồm:
  1. Nội dung câu hỏi (mang tính tư duy, phân tích hoặc vận dụng).
  2. Gợi ý đáp án chi tiết (viết dưới dạng bài mẫu hoặc các bước giải).
  3. Các ý chính cần đạt (key points) để học sinh tự đánh giá.
  
  YÊU CẦU ĐỊNH DẠNG: Trả về một mảng JSON các đối tượng có cấu trúc:
  [
    {
      "question": "nội dung câu hỏi",
      "suggestedAnswer": "đáp án gợi ý chi tiết (Markdown)",
      "keyPoints": ["ý 1", "ý 2"]
    }
  ]`;

  const parts: any[] = [{ text: prompt }];

  if (setup.fileData) {
    parts.push({
      inlineData: {
        data: setup.fileData.data,
        mimeType: setup.fileData.mimeType
      }
    });
  }

  const candidateModels = getCandidateModels('gemini-3.1-flash-lite-preview');
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      // Thử dùng responseSchema trước
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                suggestedAnswer: { type: Type.STRING },
                keyPoints: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["question", "suggestedAnswer", "keyPoints"],
            },
          },
        },
      });

      const text = response.text || '[]';
      return cleanAndParseJson(text);
    } catch (error: any) {
      console.warn(`Lỗi khi tạo đề tự luận với mô hình ${model} dạng schema:`, error);
      const errMsg = (error?.message || '').toLowerCase();
      if (errMsg.includes('api_key_invalid') || errMsg.includes('api key not valid') || errMsg.includes('401')) {
        throw new Error("⚠️ API Key của bạn không hợp lệ. Vui lòng bấm 'Cấu hình API' ở góc trên để cập nhật key mới.");
      }

      // Thử lại không dùng responseSchema nếu model không hỗ trợ schema
      try {
        const responseNoSchema = await ai.models.generateContent({
          model,
          contents: { parts },
        });
        if (responseNoSchema.text) {
          return cleanAndParseJson(responseNoSchema.text);
        }
      } catch (err2) {
        lastError = err2;
      }
    }
  }

  console.error("Error generating essay questions:", lastError);
  throw new Error("Lỗi khi tạo đề tự luận. Vui lòng kiểm tra lại API Key hoặc thử lại.");
};

export const askAnything = async (
  setup: QuizSetup, 
  question: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[], 
  fileData?: FileData
): Promise<string> => {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error("Chưa có API Key. Vui lòng cấu hình API Key cá nhân ở thanh công cụ phía trên.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const gradeNames: Record<string, string> = {
    primary: 'Tiểu học',
    secondary: 'Trung học cơ sở',
    highschool: 'Trung học thông phổ',
    advanced: 'Đại học / Người đi làm'
  };

  const studentContext = `Học sinh lớp ${setup.className}, khối ${setup.gradeNumber} (${gradeNames[setup.gradeLevel]}), trường ${setup.schoolName}, tỉnh ${setup.province}.`;

  const systemInstruction = `Bạn là "BẠN ĐỒNG HÀNH" - một trợ lý học tập AI thông minh, thân thiện và tận tâm.
  Nhiệm vụ của bạn là giải đáp mọi thắc mắc của học sinh liên quan đến bài học.
  
  BỐI CẢNH BÀI HỌC:
  - Chủ đề/Bài học: ${setup.topic}
  - Đối tượng: ${studentContext}
  
  HƯỚNG DẪN TRẢ LỜI:
  1. Trả lời chính xác, ngắn gọn, dễ hiểu và phù hợp với trình độ của học sinh.
  2. Khuyến khích học sinh tư duy, không chỉ đưa ra đáp án trực tiếp nếu đó là bài tập.
  3. Sử dụng Markdown để trình bày rõ ràng (in đậm, danh sách, công thức...).
  4. Nếu câu hỏi không liên quan đến bài học, hãy nhắc nhở nhẹ nhàng và hướng học sinh quay lại chủ đề chính.
  5. Luôn giữ thái độ tích cực, động viên học sinh.`;

  const candidateModels = getCandidateModels('gemini-3-flash-preview');
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction,
        },
        history: history,
      });

      const parts: any[] = [{ text: question }];

      const effectiveFileData = fileData || (history.length === 0 ? setup.fileData : undefined);

      if (effectiveFileData) {
        parts.push({
          inlineData: {
            data: effectiveFileData.data,
            mimeType: effectiveFileData.mimeType
          }
        });
      }

      const response = await chat.sendMessage({ message: parts });
      if (response.text) {
        return response.text;
      }
    } catch (error: any) {
      console.warn(`Lỗi khi chat với mô hình ${model}:`, error);
      lastError = error;
      const errMsg = (error?.message || '').toLowerCase();
      if (errMsg.includes('api_key_invalid') || errMsg.includes('api key not valid') || errMsg.includes('401')) {
        throw new Error("⚠️ API Key của bạn không hợp lệ. Vui lòng bấm 'Cấu hình API' ở góc trên để cập nhật key mới.");
      }
    }
  }

  console.error("Error in askAnything:", lastError);
  throw new Error("Lỗi khi kết nối với AI. Vui lòng kiểm tra lại API Key hoặc mạng internet.");
};

export const generateQuiz = async (setup: QuizSetup): Promise<Question[]> => {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error("Chưa có API Key. Vui lòng cấu hình API Key cá nhân ở thanh công cụ phía trên.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const gradeNames: Record<string, string> = {
    primary: 'Tiểu học',
    secondary: 'Trung học cơ sở',
    highschool: 'Trung học thông phổ',
    advanced: 'Đại học / Người đi làm'
  };

  const bookSeriesNames: Record<string, string> = {
    canh_dieu: 'Cánh diều',
    ket_noi_tri_thuc: 'Kết nối tri thức với cuộc sống',
    chan_troi_sang_tao: 'Chân trời sáng tạo',
    none: 'Chương trình chuẩn'
  };

  const typeDesc = setup.contentType === 'topic' ? 'theo chủ đề rộng' : 'theo một bài học cụ thể';
  const studentContext = `Học sinh lớp ${setup.className}, khối ${setup.gradeNumber} (${gradeNames[setup.gradeLevel]}), trường ${setup.schoolName}, tỉnh ${setup.province}.`;

  let prompt = `Bạn là một chuyên gia giáo dục AI. Hãy tạo một bộ câu hỏi trắc nghiệm ${typeDesc}. 
  Tất cả nội dung (câu hỏi, các lựa chọn, giải thích) PHẢI bằng tiếng Việt.
  
  ĐỐI TƯỢNG: ${studentContext}
  BỘ SÁCH GIÁO KHOA: ${bookSeriesNames[setup.bookSeries]}.
  MỨC ĐỘ KHÓ: ${setup.difficulty === 'easy' ? 'Dễ' : setup.difficulty === 'medium' ? 'Trung bình' : 'Khó'}. 
  SỐ CÂU HỎI: ${setup.count}.`;

  if (setup.fileData) {
    prompt += `\n\nQUAN TRỌNG: Hãy trích xuất kiến thức từ hình ảnh/tài liệu đính kèm để đặt câu hỏi. Đảm bảo câu hỏi bám sát nội dung trong tài liệu này.`;
  }

  prompt += `\nCHỦ ĐỀ/YÊU CẦU: "${setup.topic}".`;

  if (setup.advancedInstructions && setup.advancedInstructions.trim() !== "") {
    prompt += `\nLƯU Ý NÂNG CAO: "${setup.advancedInstructions}".`;
  }

  prompt += `\n\nYÊU CẦU ĐỊNH DẠNG:
  - Mỗi câu hỏi có đúng 4 lựa chọn.
  - Phải có giải thích ngắn gọn tại sao đáp án đó đúng.
  - Phải trả về mảng JSON đúng cấu trúc:
  [
    {
      "question": "Nội dung câu hỏi",
      "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
      "correctIndex": 0,
      "explanation": "Giải thích tại sao chọn A"
    }
  ]`;

  const parts: any[] = [{ text: prompt }];
  
  if (setup.fileData) {
    parts.push({
      inlineData: {
        data: setup.fileData.data,
        mimeType: setup.fileData.mimeType
      }
    });
  }

  const candidateModels = getCandidateModels('gemini-3-flash-preview');
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      // 1. Thử với responseSchema
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }
                },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctIndex", "explanation"],
            },
          },
        },
      });

      const text = response.text || '[]';
      return cleanAndParseJson(text);
    } catch (error: any) {
      console.warn(`Lỗi khi tạo trắc nghiệm với mô hình ${model} dạng schema:`, error);
      const errMsg = (error?.message || '').toLowerCase();
      if (errMsg.includes('api_key_invalid') || errMsg.includes('api key not valid') || errMsg.includes('401')) {
        throw new Error("⚠️ API Key của bạn không hợp lệ. Vui lòng bấm 'Cấu hình API' ở góc trên để cập nhật key mới.");
      }

      // 2. Thử lại không dùng responseSchema
      try {
        const responseNoSchema = await ai.models.generateContent({
          model,
          contents: { parts },
        });
        if (responseNoSchema.text) {
          return cleanAndParseJson(responseNoSchema.text);
        }
      } catch (err2) {
        lastError = err2;
      }
    }
  }

  console.error("Lỗi phân tích JSON hoặc gọi API:", lastError);
  throw new Error("Không thể tạo câu hỏi từ bài học này. Hãy thử chọn bài học khác hoặc kiểm tra lại API Key.");
};
