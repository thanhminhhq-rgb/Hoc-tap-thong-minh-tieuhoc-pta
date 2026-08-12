import React, { useState } from 'react';
import { StudentRecord } from '../types';

interface Props {
  records: StudentRecord[];
  onClearRecords: () => void;
  onDeleteRecord: (id: string) => void;
  onClose?: () => void;
}

// Danh sách Môn học và Hoạt động giáo dục Cấp Tiểu học theo CT GDPT 2018
export const PRIMARY_SUBJECTS_AND_ACTIVITIES = [
  { id: 'tv', name: 'Tiếng Việt', icon: '✏️', category: 'Môn học bắt buộc' },
  { id: 'math', name: 'Toán', icon: '📐', category: 'Môn học bắt buộc' },
  { id: 'eng', name: 'Tiếng Anh (Ngoại ngữ 1)', icon: '🇬🇧', category: 'Môn học bắt buộc' },
  { id: 'dd', name: 'Đạo đức', icon: '🕊️', category: 'Môn học bắt buộc' },
  { id: 'tnxh', name: 'Tự nhiên và Xã hội', icon: '🍃', category: 'Môn học bắt buộc (Lớp 1,2,3)' },
  { id: 'lsdl', name: 'Lịch sử và Địa lý', icon: '🏛️', category: 'Môn học bắt buộc (Lớp 4,5)' },
  { id: 'kh', name: 'Khoa học', icon: '🔬', category: 'Môn học bắt buộc (Lớp 4,5)' },
  { id: 'thcn', name: 'Tin học và Công nghệ', icon: '💻', category: 'Môn học bắt buộc (Lớp 3,4,5)' },
  { id: 'gdtc', name: 'Giáo dục thể chất', icon: '⚽', category: 'Môn học bắt buộc' },
  { id: 'am', name: 'Âm nhạc', icon: '🎵', category: 'Môn học bắt buộc' },
  { id: 'mt', name: 'Mỹ thuật', icon: '🎨', category: 'Môn học bắt buộc' },
  { id: 'hdtng', name: 'Hoạt động trải nghiệm', icon: '🌟', category: 'Hoạt động GD bắt buộc' },
  { id: 'ndgddp', name: 'Nội dung giáo dục địa phương', icon: '🏡', category: 'Hoạt động GD bắt buộc' },
  { id: 'tdtts', name: 'Tiếng dân tộc thiểu số', icon: '🗣️', category: 'Môn học tự chọn' },
  { id: 'kns', name: 'Kỹ năng sống & Tự chọn', icon: '💡', category: 'Hoạt động mở rộng' },
];

export const PRIMARY_GRADES = [
  { value: 'all', label: 'Tất cả các Khối (1 - 5)' },
  { value: '1', label: 'Khối 1' },
  { value: '2', label: 'Khối 2' },
  { value: '3', label: 'Khối 3' },
  { value: '4', label: 'Khối 4' },
  { value: '5', label: 'Khối 5' },
];

export const PREDEFINED_PRIMARY_CLASSES = [
  '1A', '1B', '1C', '1D', '1E',
  '2A', '2B', '2C', '2D', '2E',
  '3A', '3B', '3C', '3D', '3E',
  '4A', '4B', '4C', '4D', '4E',
  '5A', '5B', '5C', '5D', '5E',
];

export const StudentActivityManagement: React.FC<Props> = ({
  records,
  onClearRecords,
  onDeleteRecord,
  onClose,
}) => {
  const [searchName, setSearchName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'quiz' | 'summary' | 'essay' | 'chat'>('all');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Extract recorded unique classes & custom subjects
  const customClassesFromRecords = Array.from(new Set(records.map(r => r.className).filter(Boolean))) as string[];
  const allAvailableClasses = Array.from(new Set([...PREDEFINED_PRIMARY_CLASSES, ...customClassesFromRecords])).sort();

  const customSubjectsFromRecords = Array.from(new Set(records.map(r => r.topic).filter(Boolean))) as string[];

  // Helper counts for dropdown options
  const getGradeCount = (gradeValue: string) => {
    if (gradeValue === 'all') return records.length;
    return records.filter(r => (r.gradeNumber === gradeValue || (r.className && r.className.startsWith(gradeValue)))).length;
  };

  const getClassCount = (className: string) => {
    if (className === 'all') return records.length;
    return records.filter(r => r.className === className).length;
  };

  const getSubjectCount = (subjName: string) => {
    if (subjName === 'all') return records.length;
    const lower = subjName.toLowerCase();
    return records.filter(r => r.topic.toLowerCase().includes(lower) || lower.includes(r.topic.toLowerCase())).length;
  };

  const getTypeCount = (type: string) => {
    if (type === 'all') return records.length;
    return records.filter(r => r.activityType === type).length;
  };

  // Danh sách các học sinh thuộc Khối / Lớp / Môn học đang được chọn (đã từng tham gia)
  const studentsInScope = Array.from(
    new Set(
      records
        .filter(r => {
          let matchGrade = true;
          if (selectedGrade !== 'all') {
            const recGrade = r.gradeNumber || (r.className ? r.className.charAt(0) : '');
            matchGrade = recGrade === selectedGrade || (r.className ? r.className.startsWith(selectedGrade) : false);
          }
          let matchClass = true;
          if (selectedClass !== 'all') {
            matchClass = r.className === selectedClass || (r.className ? r.className.toLowerCase().includes(selectedClass.toLowerCase()) : false);
          }
          let matchSubject = true;
          if (selectedSubject !== 'all') {
            const recTopicLower = r.topic.toLowerCase();
            const selSubjLower = selectedSubject.toLowerCase();
            matchSubject = recTopicLower.includes(selSubjLower) || selSubjLower.includes(recTopicLower);
          }
          let matchType = selectedType === 'all' || r.activityType === selectedType;

          return matchGrade && matchClass && matchSubject && matchType;
        })
        .map(r => r.playerName.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'vi'));

  const getStudentSubmissionCountInScope = (studentName: string) => {
    return records.filter(r => {
      let matchGrade = true;
      if (selectedGrade !== 'all') {
        const recGrade = r.gradeNumber || (r.className ? r.className.charAt(0) : '');
        matchGrade = recGrade === selectedGrade || (r.className ? r.className.startsWith(selectedGrade) : false);
      }
      let matchClass = true;
      if (selectedClass !== 'all') {
        matchClass = r.className === selectedClass || (r.className ? r.className.toLowerCase().includes(selectedClass.toLowerCase()) : false);
      }
      return r.playerName.trim().toLowerCase() === studentName.toLowerCase() && matchGrade && matchClass;
    }).length;
  };

  // Filter logic
  const filteredRecords = records.filter(record => {
    // 1. Match student name
    const matchName = record.playerName.toLowerCase().includes(searchName.trim().toLowerCase());

    // 2. Match Grade / Khối
    let matchGrade = true;
    if (selectedGrade !== 'all') {
      const recGrade = record.gradeNumber || (record.className ? record.className.charAt(0) : '');
      matchGrade = recGrade === selectedGrade || (record.className ? record.className.startsWith(selectedGrade) : false);
    }

    // 3. Match Class / Lớp
    let matchClass = true;
    if (selectedClass !== 'all') {
      matchClass = record.className === selectedClass || (record.className ? record.className.toLowerCase().includes(selectedClass.toLowerCase()) : false);
    }

    // 4. Match Subject / Môn học & Hoạt động
    let matchSubject = true;
    if (selectedSubject !== 'all') {
      const recTopicLower = record.topic.toLowerCase();
      const selSubjLower = selectedSubject.toLowerCase();
      matchSubject = recTopicLower.includes(selSubjLower) || selSubjLower.includes(recTopicLower);
    }

    // 5. Match Activity Type
    const matchType = selectedType === 'all' || record.activityType === selectedType;

    return matchName && matchGrade && matchClass && matchSubject && matchType;
  });

  // Calculate stats for current filter selection
  const uniqueStudents = new Set(filteredRecords.map(r => r.playerName.trim().toLowerCase())).size;
  const quizRecords = filteredRecords.filter(r => r.activityType === 'quiz' && r.score !== undefined && r.total !== undefined);
  const totalQuizzes = quizRecords.length;
  
  const avgScore = totalQuizzes > 0
    ? Math.round((quizRecords.reduce((acc, r) => acc + (r.score! / r.total!), 0) / totalQuizzes) * 100)
    : 0;

  // Active filter label summary
  const activeScopeText = (() => {
    const parts = [];
    if (selectedClass !== 'all') parts.push(`Lớp ${selectedClass}`);
    else if (selectedGrade !== 'all') parts.push(`Khối ${selectedGrade}`);
    
    if (selectedSubject !== 'all') parts.push(`Môn ${selectedSubject}`);
    if (selectedType !== 'all') {
      const typeNames: Record<string, string> = {
        quiz: 'Trắc nghiệm',
        summary: 'Tóm tắt',
        essay: 'Tự luận',
        chat: 'Hỏi đáp AI',
      };
      parts.push(typeNames[selectedType] || selectedType);
    }
    if (searchName) parts.push(`Học sinh "${searchName}"`);

    return parts.length > 0 ? parts.join(' • ') : 'Tất cả học sinh';
  })();

  const isFilterActive = searchName !== '' || selectedGrade !== 'all' || selectedClass !== 'all' || selectedSubject !== 'all' || selectedType !== 'all';

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins} - ${day}/${month}/${year}`;
  };

  const getActivityBadge = (type: StudentRecord['activityType']) => {
    switch (type) {
      case 'quiz':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 flex items-center gap-1 w-fit">📝 Bài trắc nghiệm</span>;
      case 'summary':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">📚 Tóm tắt bài học</span>;
      case 'essay':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 flex items-center gap-1 w-fit">📝 Đề tự luận</span>;
      case 'chat':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 flex items-center gap-1 w-fit">✨ Hỏi đáp AI</span>;
      default:
        return null;
    }
  };

  const getScoreRating = (score: number, total: number) => {
    const pct = (score / total) * 100;
    if (pct >= 90) return { label: 'Xuất sắc', color: 'bg-emerald-500 text-white' };
    if (pct >= 80) return { label: 'Giỏi', color: 'bg-indigo-500 text-white' };
    if (pct >= 65) return { label: 'Khá', color: 'bg-blue-500 text-white' };
    if (pct >= 50) return { label: 'Đạt', color: 'bg-amber-500 text-white' };
    return { label: 'Cần cố gắng', color: 'bg-rose-500 text-white' };
  };

  const handlePrint = () => {
    window.print();
  };

  const resetFilters = () => {
    setSearchName('');
    setSelectedGrade('all');
    setSelectedClass('all');
    setSelectedSubject('all');
    setSelectedType('all');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 p-6 sm:p-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-2xl">📊</span>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">Quản Lý Thông Tin Học Sinh Làm Bài</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Báo cáo thời gian truy cập, điểm số và kết quả học tập theo Chương trình GDPT 2018 cấp Tiểu học
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5"
          >
            <span>🖨️</span> In báo cáo
          </button>
          {records.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5"
            >
              <span>🗑️</span> Xóa dữ liệu
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all text-xl"
              title="Đóng"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Scope Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 rounded-2xl border border-indigo-100 text-xs">
        <div className="flex flex-wrap items-center gap-2 font-bold text-indigo-900">
          <span className="text-base">📍</span>
          <span>Phạm vi báo cáo:</span>
          <span className="px-2.5 py-1 bg-white rounded-lg border border-indigo-200 shadow-sm text-indigo-700 font-extrabold">
            {activeScopeText}
          </span>
          {isFilterActive && (
            <span className="text-slate-500 font-medium">
              (Hiển thị {filteredRecords.length} / {records.length} lượt)
            </span>
          )}
        </div>
        {isFilterActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
          >
            ✕ Bỏ lọc
          </button>
        )}
      </div>

      {/* Dynamic KPI Stats Cards (Connected directly to filters below) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center gap-4 transition-all">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-md shadow-indigo-200 shrink-0">
            👥
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black text-slate-800">{uniqueStudents}</div>
            <div className="text-xs font-semibold text-slate-500 truncate" title={`Học sinh (${activeScopeText})`}>
              Học sinh ({activeScopeText})
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center gap-4 transition-all">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-md shadow-emerald-200 shrink-0">
            📝
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black text-slate-800">{filteredRecords.length}</div>
            <div className="text-xs font-semibold text-slate-500 truncate" title={`Lượt truy cập (${activeScopeText})`}>
              Lượt truy cập ({activeScopeText})
            </div>
          </div>
        </div>

        <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl flex items-center gap-4 transition-all">
          <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-md shadow-amber-200 shrink-0">
            🎯
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black text-slate-800">{totalQuizzes}</div>
            <div className="text-xs font-semibold text-slate-500 truncate" title={`Bài trắc nghiệm (${activeScopeText})`}>
              Bài trắc nghiệm ({activeScopeText})
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl flex items-center gap-4 transition-all">
          <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-md shadow-purple-200 shrink-0">
            ⭐
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black text-slate-800">{avgScore}%</div>
            <div className="text-xs font-semibold text-slate-500 truncate" title={`Điểm TB (${activeScopeText})`}>
              Điểm trắc nghiệm TB ({activeScopeText})
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span>🔍</span> Lọc & Tìm kiếm danh sách học sinh
          </div>
          {isFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              🔄 Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Filter / Search by Student Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
              <span>Tên học sinh</span>
              <span className="text-[10px] text-indigo-600 font-bold">
                {studentsInScope.length} em trong lớp
              </span>
            </label>
            {studentsInScope.length > 0 ? (
              <div className="space-y-1">
                <select
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all text-slate-800 cursor-pointer shadow-sm"
                >
                  <option value="">👤 Tất cả học sinh ({studentsInScope.length} em)</option>
                  {studentsInScope.map(name => {
                    const count = getStudentSubmissionCountInScope(name);
                    return (
                      <option key={name} value={name}>
                        👨‍🎓 {name} ({count} bài)
                      </option>
                    );
                  })}
                </select>
                <div className="relative">
                  <input
                    type="text"
                    list="student-names-datalist"
                    placeholder="Hoặc gõ tìm tên..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:border-indigo-500 transition-all text-slate-700"
                  />
                  {searchName && (
                    <button
                      type="button"
                      onClick={() => setSearchName('')}
                      className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      title="Xóa tìm kiếm tên"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <datalist id="student-names-datalist">
                  {studentsInScope.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Nhập tên học sinh..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 transition-all text-slate-800"
              />
            )}
          </div>

          {/* 2. Filter by Grade / Khối */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Khối lớp Tiểu học</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                if (e.target.value !== 'all' && selectedClass !== 'all' && !selectedClass.startsWith(e.target.value)) {
                  setSelectedClass('all');
                }
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700 cursor-pointer"
            >
              {PRIMARY_GRADES.map(g => {
                const count = getGradeCount(g.value);
                return (
                  <option key={g.value} value={g.value}>
                    🎒 {g.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Filter by Class / Lớp */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Lớp học cụ thể</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">🏫 Tất cả các Lớp ({getClassCount('all')})</option>
              {allAvailableClasses
                .filter(c => selectedGrade === 'all' || c.startsWith(selectedGrade))
                .map(c => {
                  const count = getClassCount(c);
                  return (
                    <option key={c} value={c}>
                      Lớp {c} ({count} lượt)
                    </option>
                  );
                })}
            </select>
          </div>

          {/* 4. Filter by Primary Subject / Môn học GDPT 2018 */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Môn học & Hoạt động GD</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">📚 Tất cả Môn học ({getSubjectCount('all')})</option>
              <optgroup label="Môn học & Hoạt động GDPT 2018">
                {PRIMARY_SUBJECTS_AND_ACTIVITIES.map(s => {
                  const count = getSubjectCount(s.name);
                  return (
                    <option key={s.id} value={s.name}>
                      {s.icon} {s.name} ({count})
                    </option>
                  );
                })}
              </optgroup>
              {customSubjectsFromRecords.length > 0 && (
                <optgroup label="Chủ đề bài học khác">
                  {customSubjectsFromRecords.map(cs => {
                    const count = getSubjectCount(cs);
                    return (
                      <option key={cs} value={cs}>
                        📖 {cs} ({count})
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
          </div>

          {/* 5. Filter by Activity Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Loại hoạt động</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">🎯 Tất cả Hoạt động ({getTypeCount('all')})</option>
              <option value="quiz">📝 Bài trắc nghiệm ({getTypeCount('quiz')})</option>
              <option value="summary">📚 Tóm tắt bài học ({getTypeCount('summary')})</option>
              <option value="essay">📝 Đề tự luận ({getTypeCount('essay')})</option>
              <option value="chat">✨ Hỏi đáp AI ({getTypeCount('chat')})</option>
            </select>
          </div>
        </div>

        {/* Quick Student Badges / Chips for the selected Class/Grade */}
        {studentsInScope.length > 0 && (
          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="p-1 bg-indigo-100 text-indigo-700 rounded-md text-xs">👥</span>
                <span>
                  Danh sách {studentsInScope.length} học sinh {selectedClass !== 'all' ? `Lớp ${selectedClass}` : selectedGrade !== 'all' ? `Khối ${selectedGrade}` : ''} đã tham gia làm bài:
                </span>
              </div>
              {searchName && (
                <button
                  type="button"
                  onClick={() => setSearchName('')}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                >
                  <span>🔄</span> Hiển thị toàn bộ lớp
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setSearchName('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  searchName === ''
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🏫 Tất cả học sinh trong lớp ({studentsInScope.length})
              </button>
              {studentsInScope.map(name => {
                const count = getStudentSubmissionCountInScope(name);
                const isSelected = searchName.toLowerCase() === name.toLowerCase();
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSearchName(isSelected ? '' : name)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                        : 'bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100 border border-indigo-100'
                    }`}
                  >
                    <span>👨‍🎓</span>
                    <span>{name}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                      isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-200/80 text-indigo-900'
                    }`}>
                      {count} bài
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Clear Modal */}
      {showConfirmClear && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <p className="text-xs sm:text-sm font-semibold text-rose-800">
            ⚠️ Bạn có chắc chắn muốn xóa toàn bộ {records.length} lịch sử làm bài của học sinh không?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClearRecords();
                setShowConfirmClear(false);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-all shadow-sm"
            >
              Đồng ý Xóa
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmClear(false)}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs transition-all"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Table of Records */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <span className="text-4xl block">📋</span>
          <p className="font-bold text-slate-700">Chưa tìm thấy kết quả phù hợp với bộ lọc ({activeScopeText})</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Hãy điều chỉnh lại thông tin Lớp, Môn học hoặc tên học sinh để xem dữ liệu báo cáo học tập.
          </p>
          {isFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 inline-block px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              Xem tất cả học sinh
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Thời gian truy cập</th>
                <th className="py-3.5 px-4">Học sinh & Lớp</th>
                <th className="py-3.5 px-4">Môn học / Hoạt động GD</th>
                <th className="py-3.5 px-4">Hình thức học tập</th>
                <th className="py-3.5 px-4 text-right">Số điểm / Kết quả</th>
                <th className="py-3.5 px-4 text-center w-12">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRecords.map((r) => {
                const isQuiz = r.activityType === 'quiz' && r.score !== undefined && r.total !== undefined;
                const rating = isQuiz ? getScoreRating(r.score!, r.total!) : null;

                return (
                  <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">🕒</span>
                        {formatDate(r.timestamp)}
                      </div>
                    </td>

                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span>{r.playerName}</span>
                        {r.className && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-100">
                            Lớp {r.className}
                          </span>
                        )}
                        {r.gradeNumber && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded">
                            Khối {r.gradeNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {r.schoolName || 'Trường Tiểu học'} {r.commune ? `• Xã/Phường: ${r.commune}` : ''} {r.province ? `• ${r.province}` : ''}
                      </div>
                    </td>

                    {/* Subject / Topic */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <div className="max-w-xs truncate" title={r.topic}>
                        {r.topic}
                      </div>
                    </td>

                    {/* Activity Type */}
                    <td className="py-3.5 px-4">
                      {getActivityBadge(r.activityType)}
                    </td>

                    {/* Score / Result */}
                    <td className="py-3.5 px-4 text-right">
                      {isQuiz ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-indigo-700">
                              {r.score}/{r.total} điểm
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rating?.color}`}>
                              {rating?.label}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            Đạt {Math.round((r.score! / r.total!) * 100)}%
                          </span>
                        </div>
                      ) : (
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                          Đã tham gia
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(r.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        title="Xóa dòng này"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
