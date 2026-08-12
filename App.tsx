
import React, { useState, useEffect } from 'react';
import { AppState, Question, QuizSetup, UserAnswer, LeaderboardEntry, UserProfile, EssayQuestion, StudentRecord } from './types';
import { generateQuiz, generateSummary, generateEssayQuestions, hasCustomApiKey } from './services/geminiService';
import SetupView from './components/SetupView';
import QuizEngine from './components/QuizEngine';
import ResultsView from './components/ResultsView';
import LoadingView from './components/LoadingView';
import AuthView from './components/AuthView';
import SummaryView from './components/SummaryView';
import EssayView from './components/EssayView';
import ChatView from './components/ChatView';
import ApiKeyModal from './components/ApiKeyModal';

const LEADERBOARD_KEY = 'brainboost_leaderboard_v2';
const STUDENT_RECORDS_KEY = 'hoc_thong_minh_student_records_v1';
const USERS_KEY = 'brainboost_users_v1';
const CURRENT_USER_KEY = 'brainboost_current_user';
const LAST_SETUP_KEY = 'brainboost_last_setup';
const TRIAL_DAYS = 7;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.SETUP);
  const [isInitializing, setIsInitializing] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentSetup, setCurrentSetup] = useState<QuizSetup | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [essayQuestions, setEssayQuestions] = useState<EssayQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isCustomKeyActive, setIsCustomKeyActive] = useState(false);

  useEffect(() => {
    setIsCustomKeyActive(hasCustomApiKey());
  }, []);

  useEffect(() => {
    // Protection check: Đảm bảo chỉ ứng dụng chính chủ mới chạy, bảo vệ quyền sở hữu của thanhminhhq@gmail.com & phungthanhhq@gmail.com
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname === '';
    const isAuthorizedWorkspace = hostname.includes('vltxujjhizwkzsbis46chz-237226508957');
    
    if (!isLocal && !isAuthorizedWorkspace) {
      setIsBlocked(true);
    } else {
      setIsBlocked(false);
    }

    // 1. Tải bảng xếp hạng
    let loadedLeaderboard: LeaderboardEntry[] = [];
    const savedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
    if (savedLeaderboard) {
      try { 
        loadedLeaderboard = JSON.parse(savedLeaderboard);
        setLeaderboard(loadedLeaderboard); 
      } catch (e) {}
    }

    // 2. Tải danh sách lịch sử truy cập & làm bài của học sinh
    const savedRecords = localStorage.getItem(STUDENT_RECORDS_KEY);
    if (savedRecords) {
      try {
        setStudentRecords(JSON.parse(savedRecords));
      } catch (e) {}
    } else if (loadedLeaderboard.length > 0) {
      // Tự động chuyển đổi bảng xếp hạng cũ thành danh sách báo cáo học sinh
      const convertedRecords: StudentRecord[] = loadedLeaderboard.map((lb) => ({
        id: lb.id,
        playerName: lb.playerName,
        schoolName: lb.schoolName || 'Tiểu học',
        className: lb.className || '1A',
        province: lb.province || 'Hà Nội',
        topic: lb.topic,
        activityType: 'quiz',
        score: lb.score,
        total: lb.total,
        timestamp: lb.date || Date.now()
      }));
      setStudentRecords(convertedRecords);
      localStorage.setItem(STUDENT_RECORDS_KEY, JSON.stringify(convertedRecords));
    }

    // 3. Tải thiết lập học tập gần nhất
    const savedSetup = localStorage.getItem(LAST_SETUP_KEY);
    if (savedSetup) {
      try { setCurrentSetup(JSON.parse(savedSetup)); } catch (e) {}
    }
    setState(AppState.SETUP);
    
    setIsInitializing(false);
  }, []);

  const addStudentRecord = (
    setup: QuizSetup,
    activityType: 'quiz' | 'summary' | 'essay' | 'chat',
    score?: number,
    total?: number
  ) => {
    const newRecord: StudentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      playerName: setup.playerName || 'Học sinh',
      schoolName: setup.schoolName || 'Tiểu học',
      className: setup.className || '1A',
      commune: setup.commune || '',
      province: setup.province || 'Hà Nội',
      gradeNumber: setup.gradeNumber || '1',
      topic: setup.topic || 'Bài học',
      activityType,
      score,
      total,
      timestamp: Date.now()
    };
    setStudentRecords(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem(STUDENT_RECORDS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearStudentRecords = () => {
    setStudentRecords([]);
    localStorage.removeItem(STUDENT_RECORDS_KEY);
  };

  const handleDeleteStudentRecord = (id: string) => {
    setStudentRecords(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem(STUDENT_RECORDS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleUnlock = () => {
    setState(AppState.SETUP);
  };

  const handleLock = () => {
    // Trực tiếp mở màn hình setup
    setState(AppState.SETUP);
  };

  const saveScore = (setup: QuizSetup, score: number, total: number) => {
    const newEntry: LeaderboardEntry = {
      id: Math.random().toString(36).substr(2, 9),
      playerName: setup.playerName,
      schoolName: setup.schoolName,
      className: setup.className,
      commune: setup.commune,
      province: setup.province,
      score,
      total,
      topic: setup.topic,
      date: Date.now()
    };
    const updated = [newEntry, ...leaderboard]
      .sort((a, b) => (b.score / b.total) - (a.score / a.total) || b.date - a.date)
      .slice(0, 15);
    
    setLeaderboard(updated);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));

    // Lưu vào báo cáo chi tiết học sinh làm bài
    addStudentRecord(setup, 'quiz', score, total);
  };

  const startQuiz = async (setup: QuizSetup) => {
    setState(AppState.LOADING);
    setError(null);
    setCurrentSetup(setup);
    
    localStorage.setItem(LAST_SETUP_KEY, JSON.stringify(setup));
    
    try {
      const generatedQuestions = await generateQuiz(setup);
      if (generatedQuestions.length === 0) {
        throw new Error("Không có câu hỏi nào được tạo ra.");
      }
      setQuestions(generatedQuestions);
      setUserAnswers([]);
      setState(AppState.PLAYING);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không mong muốn");
      setState(AppState.SETUP);
    }
  };

  const startSummary = async (setup: QuizSetup) => {
    setState(AppState.LOADING);
    setError(null);
    setCurrentSetup(setup);
    
    localStorage.setItem(LAST_SETUP_KEY, JSON.stringify(setup));
    addStudentRecord(setup, 'summary');
    
    try {
      const knowledgeSummary = await generateSummary(setup);
      setSummary(knowledgeSummary);
      setState(AppState.SUMMARY);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo tóm tắt kiến thức.");
      setState(AppState.SETUP);
    }
  };

  const startEssay = async (setup: QuizSetup) => {
    setState(AppState.LOADING);
    setError(null);
    setCurrentSetup(setup);
    
    localStorage.setItem(LAST_SETUP_KEY, JSON.stringify(setup));
    addStudentRecord(setup, 'essay');
    
    try {
      const questions = await generateEssayQuestions(setup);
      setEssayQuestions(questions);
      setState(AppState.ESSAY);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo đề tự luận.");
      setState(AppState.SETUP);
    }
  };

  const startChat = (setup: QuizSetup) => {
    setCurrentSetup(setup);
    localStorage.setItem(LAST_SETUP_KEY, JSON.stringify(setup));
    addStudentRecord(setup, 'chat');
    setState(AppState.CHAT);
  };

  const handleComplete = (answers: UserAnswer[]) => {
    setUserAnswers(answers);
    const score = answers.filter(a => a.isCorrect).length;
    if (currentSetup) {
      saveScore(currentSetup, score, questions.length);
    }
    setState(AppState.RESULTS);
  };

  const reset = () => {
    setState(AppState.SETUP);
    setQuestions([]);
    setUserAnswers([]);
    setError(null);
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-rose-100 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mb-4 animate-bounce">
              🔒
            </div>
            <h2 className="text-2xl font-extrabold text-rose-650 tracking-tight text-slate-800 uppercase">Cảnh báo Bản quyền</h2>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">
              Ứng dụng <strong className="text-indigo-600">BẠN ĐỒNG HÀNH</strong> thuộc quyền sở hữu trí tuệ và bảo hộ thương hiệu độc quyền của <strong className="text-slate-800">phungthanhhq@gmail.com</strong>.
            </p>
            
            <div className="w-full bg-rose-50/50 border border-rose-100 p-4 rounded-2xl mt-5 text-left">
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                ⚠️ <strong>Phát hiện sao chép trái phép:</strong> Dự án này vừa được Remix hoặc nhân bản sang không gian làm việc khác. Hệ thống đã tiến hành vô hiệu hóa toàn bộ tính năng cốt lõi cùng các tích hợp AI để bảo vệ bản quyền công nghệ.
              </p>
            </div>
            
            <p className="text-slate-400 text-xs mt-6 italic">
              Vui lòng liên hệ với chủ sở hữu chính thức để nhận liên kết trải nghiệm được ủy quyền.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl mb-4"></div>
          <p className="text-slate-400 font-medium">Đang khởi động...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (state) {
      case AppState.AUTH:
        return <AuthView onUnlock={handleUnlock} />;
      case AppState.SETUP:
        return (
          <SetupView 
            onStart={startQuiz} 
            onSummary={startSummary}
            onEssay={startEssay}
            onChat={startChat}
            error={error} 
            leaderboard={leaderboard} 
            initialSetup={currentSetup}
            studentRecords={studentRecords}
            onClearStudentRecords={handleClearStudentRecords}
            onDeleteStudentRecord={handleDeleteStudentRecord}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          />
        );
      case AppState.SUMMARY:
        return (
          <SummaryView 
            summary={summary || ''} 
            topic={currentSetup?.topic || ''} 
            onBack={() => setState(AppState.SETUP)}
            onStartQuiz={() => currentSetup && startQuiz(currentSetup)}
          />
        );
      case AppState.ESSAY:
        return (
          <EssayView 
            questions={essayQuestions} 
            topic={currentSetup?.topic || ''} 
            onBack={() => setState(AppState.SETUP)}
          />
        );
      case AppState.CHAT:
        return (
          <ChatView 
            setup={currentSetup!} 
            onBack={() => setState(AppState.SETUP)}
          />
        );
      case AppState.LOADING:
        return <LoadingView onCancel={reset} />;
      case AppState.PLAYING:
        return (
          <QuizEngine 
            questions={questions} 
            onComplete={handleComplete} 
            onQuit={reset}
          />
        );
      case AppState.RESULTS:
        return (
          <ResultsView 
            questions={questions} 
            answers={userAnswers} 
            onRestart={reset}
            setup={currentSetup}
            leaderboard={leaderboard}
          />
        );
      default:
        return null;
    }
  };

  const getMaxWidthClass = () => {
    switch (state) {
      case AppState.SETUP:
        return 'max-w-6xl';
      case AppState.SUMMARY:
      case AppState.ESSAY:
      case AppState.CHAT:
        return 'max-w-4xl';
      case AppState.PLAYING:
      case AppState.RESULTS:
      case AppState.AUTH:
      default:
        return 'max-w-2xl';
    }
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-indigo-100 animate-scale-up">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border border-rose-100">
            🔒
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">CẢNH BÁO BẢN QUYỀN</h2>
          <p className="text-slate-600 text-xs mb-4 leading-relaxed font-medium">
            Ứng dụng <strong className="text-indigo-600 font-extrabold">BẠN ĐỒNG HÀNH</strong> thuộc quyền sở hữu trí tuệ và bảo hộ thương hiệu độc quyền của đồng chủ sở hữu:
          </p>

          <div className="bg-indigo-50/80 border border-indigo-100 p-3.5 rounded-2xl mb-5 text-xs font-bold text-indigo-950 space-y-1.5 shadow-sm">
            <p className="flex items-center justify-center gap-1.5">
              <span>✉️</span>
              <span className="font-mono text-indigo-700">thanhminhhq@gmail.com</span>
            </p>
            <p className="flex items-center justify-center gap-1.5">
              <span>✉️</span>
              <span className="font-mono text-indigo-700">phungthanhhq@gmail.com</span>
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs text-left leading-relaxed font-medium mb-6">
            ⚠️ <strong>Phát hiện sao chép trái phép:</strong> Dự án này vừa được Remix hoặc nhân bản sang không gian làm việc chưa được ủy quyền. Hệ thống đã tiến hành vô hiệu hóa toàn bộ tính năng cốt lõi cùng các tích hợp AI để bảo vệ bản quyền công nghệ.
          </div>

          <p className="text-[11px] text-slate-400 font-medium leading-normal">
            Vui lòng liên hệ trực tiếp với chủ sở hữu chính thức qua Gmail trên để nhận liên kết trải nghiệm ứng dụng bản quyền gốc.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className={`w-full transition-all duration-300 ${getMaxWidthClass()}`}>
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            BẠN <span className="text-indigo-600">ĐỒNG HÀNH</span>
          </h1>
          <p className="text-slate-500 font-medium italic">Học tập thông minh - Khẳng định tài năng</p>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Ứng dụng được tạo và phát triển bởi Phùng Thanh AI (thanhminhhq@gmail.com & phungthanhhq@gmail.com)
          </p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all shadow-sm ${
                isCustomKeyActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-emerald-100'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 shadow-indigo-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isCustomKeyActive ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
              <span>{isCustomKeyActive ? '🔑 API riêng: Đã kích hoạt (Chạy độc lập)' : '⚡ Cấu hình API Key riêng (Nhập 1 lần chạy mượt)'}</span>
              <span className="bg-white/80 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-slate-600 border border-slate-200">
                Cài đặt
              </span>
            </button>
          </div>
        </header>
        
        <main className="animate-slide-in">
          {renderContent()}
        </main>
      </div>
      
      <footer className="mt-12 text-slate-400 text-sm text-center">
        &copy; {new Date().getFullYear()} BẠN ĐỒNG HÀNH - Nền tảng học tập AI.
      </footer>

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
        onKeyUpdated={() => setIsCustomKeyActive(hasCustomApiKey())}
      />
    </div>
  );
};

export default App;
