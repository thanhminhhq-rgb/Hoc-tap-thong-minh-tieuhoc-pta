
import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, GraduationCap, Sparkles, Camera, Upload } from 'lucide-react';

const APP_IMAGE_KEY = 'companion_app_interface_image';
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80";

interface AuthViewProps {
  onUnlock: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [appImage, setAppImage] = useState<string>(DEFAULT_IMAGE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedImage = localStorage.getItem(APP_IMAGE_KEY);
    if (savedImage) {
      setAppImage(savedImage);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAppImage(base64String);
        localStorage.setItem(APP_IMAGE_KEY, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === 'T@2026') {
      onUnlock();
    } else {
      setError('Mật khẩu không chính xác. Vui lòng thử lại.');
      setPassword('');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 p-10 border border-indigo-50 animate-slide-in mt-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full opacity-50 blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-50 rounded-full opacity-50 blur-2xl"></div>

      <div className="text-center mb-10 relative z-10">
        <div className="flex justify-center gap-4 mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm animate-bounce delay-100">
            🧑‍🎓
          </div>
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm animate-bounce delay-300">
            👩‍🎓
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 leading-tight">
          Xin chào, rất vui được đồng hành cùng bạn!
        </h2>
        <p className="text-indigo-600 mt-3 font-semibold text-sm bg-indigo-50 py-2 px-4 rounded-full inline-block">
          Hãy nhập mã truy cập của bạn ✨
        </p>
      </div>

      <div className="mb-8 relative group">
        <div className="relative overflow-hidden rounded-2xl shadow-md border-4 border-white aspect-video">
          <img 
            src={appImage} 
            alt="Learning" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 hover:bg-white text-indigo-600 p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
              title="Đổi ảnh giao diện"
            >
              <Camera className="w-6 h-6" />
            </button>
            <span className="text-white text-xs font-bold tracking-wider uppercase">Đổi ảnh giao diện</span>
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
          accept="image/*"
        />
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold text-center animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Mã truy cập</label>
          <input
            type="password"
            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none text-slate-800 text-center text-2xl tracking-[0.2em] font-bold transition-all placeholder:tracking-normal placeholder:text-base placeholder:font-medium placeholder:text-slate-300 animate-pulse focus:animate-none"
            placeholder="Nhập mã truy cập"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95 text-lg flex items-center justify-center gap-2"
        >
          <span>Mở ứng dụng</span>
          <Sparkles className="w-5 h-5" />
        </button>
      </form>

      <div className="mt-10 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
        <GraduationCap className="w-4 h-4" />
        <span>Hệ thống học tập thông minh AI</span>
      </div>
    </div>
  );
};

export default AuthView;
