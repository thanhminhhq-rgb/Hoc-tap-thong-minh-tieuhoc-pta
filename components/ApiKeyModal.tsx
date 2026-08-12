import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff, Loader2, Trash2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { getStoredApiKey, hasCustomApiKey, saveUserApiKey, removeUserApiKey, testAndAutoConfigureApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; model?: string } | null>(null);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const activeCustom = hasCustomApiKey();
      setIsCustom(activeCustom);
      if (activeCustom) {
        setApiKeyInput(localStorage.getItem('brainboost_user_gemini_api_key') || '');
      } else {
        setApiKeyInput('');
      }
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (autoSave = true) => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setTestResult({
        success: false,
        message: 'Vui lòng dán mã API Key của bạn trước khi kiểm tra.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testAndAutoConfigureApiKey(trimmed);
    setIsTesting(false);
    setTestResult(res);

    if (res.success && autoSave) {
      saveUserApiKey(trimmed);
      setIsCustom(true);
      if (onKeyUpdated) onKeyUpdated();
    }
  };

  const handleManualSave = async () => {
    await handleTestAndSave(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleRemoveKey = () => {
    removeUserApiKey();
    setApiKeyInput('');
    setIsCustom(false);
    setTestResult({
      success: true,
      message: 'Đã xóa API Key cá nhân. Ứng dụng quay lại sử dụng cấu hình mặc định.'
    });
    if (onKeyUpdated) onKeyUpdated();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setApiKeyInput(text.trim());
      }
    } catch (e) {
      // Ignore clipboard read error if not allowed
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-indigo-100 w-full max-w-xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <Key className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Cấu hình API Key Gemini</h2>
              <p className="text-xs text-indigo-100 font-medium">Chạy ứng dụng độc lập, nhanh mượt và không giới hạn</p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Current Key Status Badge */}
          <div className={`p-4 rounded-2xl border ${isCustom ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'} flex items-start gap-3`}>
            {isCustom ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-extrabold text-sm">
                {isCustom ? '🟢 Đang kích hoạt API Key cá nhân' : '⚡ Đang sử dụng API Mặc định hệ thống'}
              </p>
              <p className="leading-relaxed">
                {isCustom 
                  ? 'Ứng dụng đang chạy hoàn toàn bằng mã API độc lập của bạn. Tốc độ xử lý tối ưu và không bị chia sẻ giới hạn.'
                  : 'Nhập API Key riêng của bạn để ứng dụng chạy độc lập 100%, phản hồi tức thì và không bị nghẽn lệnh.'}
              </p>
            </div>
          </div>

          {/* Guide Steps & Direct Link */}
          <div className="bg-indigo-50/70 p-4.5 rounded-2xl border border-indigo-100 text-xs text-slate-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
              <span className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                <span>🔗</span> Đường dẫn lấy API Key Google chính thức:
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl shadow-sm transition-all"
              >
                <span>Mở Google AI Studio lấy Key</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>📖</span> 3 Bước đơn giản nhập 1 lần duy nhất:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 font-medium pl-1">
                <li>Bấm nút <strong className="text-indigo-700">"Mở Google AI Studio lấy Key"</strong> ở trên và đăng nhập tài khoản Google.</li>
                <li>Nhấn <strong className="text-indigo-700">"Create API Key"</strong> để tạo mã miễn phí (Dạng: <code className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-mono">AIzaSy...</code>).</li>
                <li>Sao chép và dán vào ô bên dưới &gt; Bấm <strong className="text-indigo-700">Kiểm tra & Tự cấu hình</strong>.</li>
              </ol>
            </div>

            {/* Note about using ANY Google account if personal account fails */}
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed font-medium flex items-start gap-2">
              <span className="text-sm">💡</span>
              <div>
                <strong className="font-bold text-amber-950">Mẹo trường hợp không tạo được Key tài khoản cá nhân:</strong> Bạn có thể lấy API Key được tạo từ <strong>bất kỳ tài khoản Google (Gmail) nào khác</strong> (ví dụ Gmail phụ, Gmail của bạn bè, người thân). App đều chấp nhận và chạy mượt mà 100%!
              </div>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 leading-relaxed font-medium flex items-start gap-2">
              <span className="text-sm">🤖</span>
              <div>
                <strong className="font-bold text-emerald-950">Tự động cấu hình tương thích:</strong> App tự kiểm tra và chọn mô hình Gemini tối ưu nhất (2.5-flash, 1.5-flash, 3.1-flash...) phù hợp chính xác với Key của bạn để tránh hoàn toàn mọi lỗi kết nối.
              </div>
            </div>
          </div>

          {/* Input field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Nhập mã Google Gemini API Key:
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                placeholder="Dán mã API Key (AIzaSy...)"
                className="w-full pl-4 pr-24 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-xs font-mono font-bold text-slate-800 transition-all shadow-sm"
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setTestResult(null);
                }}
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-xl transition-all"
                  title="Dán từ Clipboard"
                >
                  Dán
                </button>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                  title={showKey ? "Ẩn Key" : "Hiện Key"}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test Result Alert Box */}
          {testResult && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 animate-slide-in ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{testResult.message}</p>
                {testResult.model && (
                  <p className="text-[11px] opacity-90">
                    Mô hình đã kiểm tra: <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono text-emerald-900 font-bold">{testResult.model}</code>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Safety Notice */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Mã Key chỉ lưu bảo mật trên trình duyệt của bạn (localStorage), không gửi đi đâu khác ngoài Google Gemini.</span>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {isCustom ? (
            <button
              type="button"
              onClick={handleRemoveKey}
              className="px-4 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-2xl border border-rose-200 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa Key cá nhân</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={() => handleTestAndSave(true)}
              disabled={isTesting || !apiKeyInput.trim()}
              className="px-5 py-3 text-xs font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-2xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Đang tự động cấu hình...</span>
                </>
              ) : (
                <>
                  <span>🧪 Kiểm tra & Tự cấu hình</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleManualSave}
              disabled={!apiKeyInput.trim()}
              className="px-6 py-3 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Lưu API Key</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
