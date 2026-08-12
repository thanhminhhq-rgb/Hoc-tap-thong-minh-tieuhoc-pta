
import React, { useState, useEffect } from 'react';
import { QuizSetup, Difficulty, LeaderboardEntry, GradeLevel, BookSeries, ContentType, StudentRecord } from '../types';
import Leaderboard from './Leaderboard';
import { StudentActivityManagement } from './StudentActivityManagement';

interface SetupViewProps {
  onStart: (setup: QuizSetup) => void;
  onSummary: (setup: QuizSetup) => void;
  onEssay: (setup: QuizSetup) => void;
  onChat: (setup: QuizSetup) => void;
  error: string | null;
  leaderboard: LeaderboardEntry[];
  initialSetup?: QuizSetup | null;
  onLock?: () => void;
  studentRecords: StudentRecord[];
  onClearStudentRecords: () => void;
  onDeleteStudentRecord: (id: string) => void;
  onOpenApiKeyModal?: () => void;
}

const PREDEFINED_TOPICS = [
  { label: 'Lịch sử Việt Nam', icon: '🇻🇳' },
  { label: 'Địa lý thế giới', icon: '🌍' },
  { label: 'Khoa học & Vũ trụ', icon: '🚀' },
  { label: 'Lập trình React', icon: '💻' },
  { label: 'Tiếng Anh giao tiếp', icon: '🇬🇧' },
  { label: 'Văn học Việt Nam', icon: '✍️' },
  { label: 'Toán học vui', icon: '🔢' },
  { label: 'Kỹ năng sống', icon: '💡' },
];

const PREDEFINED_SUBJECTS = [
  'Tiếng Việt',
  'Toán học',
  'Tiếng Anh (Ngoại ngữ 1)',
  'Đạo đức',
  'Tự nhiên và Xã hội (Lớp 1, 2, 3)',
  'Lịch sử và Địa lý (Lớp 4, 5)',
  'Khoa học (Lớp 4, 5)',
  'Tin học và Công nghệ (Lớp 3, 4, 5)',
  'Giáo dục thể chất',
  'Âm nhạc',
  'Mỹ thuật',
  'Hoạt động trải nghiệm (GDPT 2018)',
  'Nội dung giáo dục địa phương',
  'Tiếng dân tộc thiểu số',
  'Kỹ năng sống & Hoạt động tập thể'
];

const GRADE_STRUCTURE: Record<GradeLevel, string[]> = {
  primary: ['1', '2', '3', '4', '5'],
  secondary: ['6', '7', '8', '9'],
  highschool: ['10', '11', '12'],
  advanced: ['Đại học', 'Sau đại học', 'Đi làm'],
};

const SetupView: React.FC<SetupViewProps> = ({
  onStart,
  onSummary,
  onEssay,
  onChat,
  error,
  leaderboard,
  initialSetup,
  onLock,
  studentRecords,
  onClearStudentRecords,
  onDeleteStudentRecord,
  onOpenApiKeyModal
}) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'teacher'>('setup');

  // Xử lý tách môn học từ chủ đề cũ nếu có định dạng "Môn: Bài"
  const getInitialTopicParts = () => {
    if (initialSetup?.topic && initialSetup.topic.includes(': ')) {
      const [s, ...t] = initialSetup.topic.split(': ');
      return { subject: s, topic: t.join(': ') };
    }
    return { subject: '', topic: initialSetup?.topic || '' };
  };

  const initialParts = getInitialTopicParts();
  const [subject, setSubject] = useState(initialParts.subject || PREDEFINED_SUBJECTS[0]);
  const [topic, setTopic] = useState(initialParts.topic);
  const [contentType, setContentType] = useState<ContentType>(initialSetup?.contentType || 'lesson');
  const [count, setCount] = useState(initialSetup?.count || 15);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialSetup?.difficulty || 'medium');
  
  // Thông tin cá nhân
  const [playerName, setPlayerName] = useState(initialSetup?.playerName || '');
  const [schoolName, setSchoolName] = useState(initialSetup?.schoolName || '');
  const [className, setClassName] = useState(initialSetup?.className || '');
  const [commune, setCommune] = useState(initialSetup?.commune || '');
  const [province, setProvince] = useState(initialSetup?.province || '');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(initialSetup?.gradeLevel || 'primary');
  const [gradeNumber, setGradeNumber] = useState(initialSetup?.gradeNumber || '1');
  
  const [bookSeries, setBookSeries] = useState<BookSeries>(initialSetup?.bookSeries || 'none');
  const [advancedInstructions, setAdvancedInstructions] = useState(initialSetup?.advancedInstructions || '');
  const [showAdvanced, setShowAdvanced] = useState(!!initialSetup?.advancedInstructions);
  
  useEffect(() => {
    // Cập nhật gradeNumber khi gradeLevel thay đổi nếu giá trị hiện tại không hợp lệ
    if (!GRADE_STRUCTURE[gradeLevel].includes(gradeNumber)) {
      setGradeNumber(GRADE_STRUCTURE[gradeLevel][0]);
    }
  }, [gradeLevel]);

  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
    if (type === 'topic' && count < 15) {
      setCount(15);
    } else if (type === 'lesson' && count < 10) {
      setCount(10);
    }
  };

  const isTopicValid = contentType === 'topic' ? !!topic.trim() : !!subject;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isTopicValid) return;
    if (!playerName.trim()) return;

    let finalCount = count;
    if (contentType === 'topic' && count < 15) finalCount = 15;
    if (contentType === 'lesson' && count < 10) finalCount = 10;
    if (count > 50) finalCount = 50;

    const folderTopic = topic.trim();
    const finalTopic = contentType === 'lesson'
      ? (folderTopic ? `${subject}: ${folderTopic}` : subject)
      : folderTopic;

    onStart({ 
      playerName, 
      topic: finalTopic, 
      contentType,
      count: finalCount, 
      difficulty, 
      gradeLevel, 
      gradeNumber,
      className,
      schoolName,
      commune,
      province,
      bookSeries,
      advancedInstructions
    });
  };

  const selectTopic = (selectedTopic: string) => {
    setTopic(selectedTopic);
    setSubject('');
  };

  const handleSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTopicValid) return;
    if (!playerName.trim()) return;

    const folderTopic = topic.trim();
    const finalTopic = contentType === 'lesson'
      ? (folderTopic ? `${subject}: ${folderTopic}` : subject)
      : folderTopic;

    onSummary({ 
      playerName, 
      topic: finalTopic, 
      contentType,
      count, 
      difficulty, 
      gradeLevel, 
      gradeNumber,
      className,
      schoolName,
      commune,
      province,
      bookSeries,
      advancedInstructions
    });
  };

  const handleEssay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTopicValid) return;
    if (!playerName.trim()) return;

    const folderTopic = topic.trim();
    const finalTopic = contentType === 'lesson'
      ? (folderTopic ? `${subject}: ${folderTopic}` : subject)
      : folderTopic;

    onEssay({ 
      playerName, 
      topic: finalTopic, 
      contentType,
      count, 
      difficulty, 
      gradeLevel, 
      gradeNumber,
      className,
      schoolName,
      commune,
      province,
      bookSeries,
      advancedInstructions
    });
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTopicValid) return;
    if (!playerName.trim()) return;

    const folderTopic = topic.trim();
    const finalTopic = contentType === 'lesson'
      ? (folderTopic ? `${subject}: ${folderTopic}` : subject)
      : folderTopic;

    onChat({ 
      playerName, 
      topic: finalTopic, 
      contentType,
      count, 
      difficulty, 
      gradeLevel, 
      gradeNumber,
      className,
      schoolName,
      commune,
      province,
      bookSeries,
      advancedInstructions
    });
  };

  return (
    <div className="space-y-8 pb-12 animate-slide-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
            💎
          </div>
          <span className="font-bold text-slate-800 text-lg">BẠN ĐỒNG HÀNH</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'setup'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎯</span> Bài học & Luyện tập
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'teacher'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            <span>📊</span> Quản lý HS làm bài
            <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === 'teacher' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {studentRecords.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenApiKeyModal && (
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1.5 shadow-sm"
              title="Cấu hình Google Gemini API Key riêng"
            >
              <span>🔑</span>
              <span className="hidden sm:inline">Cấu hình API Key</span>
            </button>
          )}

          {onLock && (
            <button 
              onClick={onLock}
              className="text-slate-400 hover:text-red-500 transition-colors p-2"
              title="Khóa ứng dụng"
            >
              🔒
            </button>
          )}
        </div>
      </div>

      {activeTab === 'teacher' ? (
        <StudentActivityManagement
          records={studentRecords}
          onClearRecords={onClearStudentRecords}
          onDeleteRecord={onDeleteStudentRecord}
          onClose={() => setActiveTab('setup')}
        />
      ) : (
        <div className="space-y-8">
          {/* Thông tin người học trên cùng 1 hàng ngang với 5 ô thông tin bao gồm Xã / Phường */}
          <div className="bg-white rounded-3xl shadow-lg shadow-indigo-100/60 p-6 border border-indigo-100">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xl">👤</span>
              <span>Thông tin người học</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Họ và tên *</label>
                <input
                  type="text"
                  placeholder="Nhập họ và tên..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-sm font-semibold text-slate-800 transition-all shadow-sm"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Trường học</label>
                <input
                  type="text"
                  placeholder="Tên trường..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-sm font-semibold text-slate-800 transition-all shadow-sm"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Lớp</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 1A..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-sm font-semibold text-slate-800 transition-all shadow-sm"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Xã / Phường</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hồng Quang..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-sm font-semibold text-slate-800 transition-all shadow-sm"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Tỉnh / Thành phố</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tuyên Quang..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-sm font-semibold text-slate-800 transition-all shadow-sm"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">

      <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 p-8 border border-indigo-50">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="mr-3 text-indigo-600">🎯</span>
            Thiết lập nội dung bài học
        </h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            {/* HÀNG 1: Tên (Nội dung) bài học | Khối lớp (1-5) | Bộ sách */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              {/* Ô 1: Tên (nội dung) bài học */}
              <div className="md:col-span-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Môn học & Tên bài học *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-xs font-bold text-slate-800 transition-all shadow-sm cursor-pointer"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    >
                      {PREDEFINED_SUBJECTS.map(s => (
                        <option key={s} value={s}>
                          📚 {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Tên bài học cụ thể..."
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-xs font-bold text-slate-800 transition-all shadow-sm"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Ô 2: Khối (1,2,3,4,5) */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Khối lớp (1 - 5)
                </label>
                <select
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-xs font-bold text-slate-800 transition-all shadow-sm cursor-pointer"
                  value={gradeNumber}
                  onChange={(e) => setGradeNumber(e.target.value)}
                >
                  {GRADE_STRUCTURE[gradeLevel].map(c => (
                    <option key={c} value={c}>
                      🎒 Khối {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ô 3: Bộ sách giáo khoa */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bộ sách giáo khoa
                </label>
                <select
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-xs font-bold text-slate-800 transition-all shadow-sm cursor-pointer"
                  value={bookSeries}
                  onChange={(e) => setBookSeries(e.target.value as BookSeries)}
                >
                  <option value="none">📖 Mặc định / Khác</option>
                  <option value="canh_dieu">🦅 Cánh diều</option>
                  <option value="ket_noi_tri_thuc">📘 Kết nối tri thức</option>
                  <option value="chan_troi_sang_tao">🌅 Chân trời sáng tạo</option>
                </select>
              </div>
            </div>

            {/* HÀNG 2: Lựa chọn Số câu hỏi | Mức độ (Dễ, Vừa, Khó) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              {/* Ô 1: Số câu hỏi */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Số câu hỏi
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={contentType === 'topic' ? 15 : 10}
                    max={50}
                    className="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-xs font-bold text-slate-800 transition-all shadow-sm"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-extrabold uppercase bg-slate-200/70 px-2 py-0.5 rounded-lg">
                    CÂU
                  </span>
                </div>
              </div>

              {/* Ô 2: Mức độ (dễ, vừa, khó) */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mức độ (Độ khó)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-3 px-2 rounded-2xl text-xs font-extrabold transition-all border shadow-sm ${
                        difficulty === d 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-white'
                      }`}
                    >
                      {d === 'easy' ? '🌱 DỄ' : d === 'medium' ? '⚡ VỪA' : '🔥 KHÓ'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {contentType === 'topic' && (
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Gợi ý nhanh chủ đề:</span>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TOPICS.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => selectTopic(t.label)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      topic === t.label 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <span className="mr-1">{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <button 
                type="button" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-indigo-600 text-sm font-semibold flex items-center hover:text-indigo-700 transition-colors"
            >
                {showAdvanced ? '− Thu gọn yêu cầu nâng cao' : '+ Thêm yêu cầu nâng cao (tùy chọn)'}
            </button>
            
            {showAdvanced && (
                <div className="mt-4 animate-slide-in">
                    <textarea
                        placeholder="Ví dụ: Tập trung vào các mốc thời gian, bỏ qua các câu hỏi lý thuyết suông..."
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none text-slate-800 min-h-[100px]"
                        value={advancedInstructions}
                        onChange={(e) => setAdvancedInstructions(e.target.value)}
                    />
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button
              type="button"
              onClick={handleSummary}
              disabled={!isTopicValid}
              className="w-full bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 disabled:border-indigo-200 disabled:text-indigo-200 font-bold py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>📚</span> Tổng hợp kiến thức
            </button>
            <button
              type="button"
              onClick={handleEssay}
              disabled={!isTopicValid}
              className="w-full bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 disabled:border-emerald-200 disabled:text-emerald-200 font-bold py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>📝</span> Dạng đề tự luận
            </button>
            <button
              type="button"
              onClick={handleChat}
              disabled={!isTopicValid}
              className="w-full bg-white border-2 border-amber-500 text-amber-500 hover:bg-amber-50 disabled:border-amber-200 disabled:text-amber-200 font-bold py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 sm:col-span-2"
            >
              <span>✨</span> Hỏi bất kỳ điều gì (Giải đáp thắc mắc)
            </button>
            <button
              type="submit"
              disabled={!isTopicValid}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2 sm:col-span-2"
            >
              <span>🚀</span> {initialSetup ? 'Cập nhật & Bắt đầu' : 'Bắt đầu bài trắc nghiệm'}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div className="lg:col-span-1 space-y-8">
      {/* Teacher Quick Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-3 border border-indigo-800/50">
        <div className="flex items-center justify-between">
          <span className="text-2xl">📊</span>
          <span className="text-[11px] bg-indigo-700/80 text-indigo-100 font-bold px-2.5 py-1 rounded-lg">
            Dành cho Giáo viên
          </span>
        </div>
        <h3 className="font-extrabold text-lg text-white">Quản Lý HS Làm Bài</h3>
        <p className="text-indigo-200 text-xs leading-relaxed">
          Theo dõi thời gian truy cập, bài tập đã hoàn thành và điểm số của từng học sinh trong lớp.
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('teacher')}
          className="w-full mt-2 py-3 bg-white hover:bg-indigo-50 text-indigo-900 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
        >
          <span>📋</span> Xem Báo Cáo Chi Tiết ({studentRecords.length})
        </button>
      </div>

      {leaderboard.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-8 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="mr-3 text-yellow-500">🏆</span>
            Bảng xếp hạng vinh danh
          </h2>
          <Leaderboard entries={leaderboard} />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-50 p-6 border border-indigo-100">
          <h3 className="font-bold text-indigo-600 mb-3 flex items-center gap-2">
            <span>💡</span> Gợi ý học tập
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Vui lòng nhập đầy đủ thông tin người học và thiết lập môn học hoặc chủ đề trước khi bắt đầu để AI có thể cá nhân hóa bài học tốt nhất cho bạn nhé!
          </p>
        </div>
      )}
    </div>
  </div>
</div>
)}
</div>
  );
};

export default SetupView;
