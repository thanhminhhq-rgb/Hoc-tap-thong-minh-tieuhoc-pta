
import React from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-center">Hạng</th>
            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Học sinh / Trường</th>
            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-right">Kết quả</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {entries.map((entry, idx) => {
            let rankIcon = null;
            if (idx === 0) rankIcon = '🥇';
            else if (idx === 1) rankIcon = '🥈';
            else if (idx === 2) rankIcon = '🥉';

            return (
              <tr key={entry.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-4 py-5 font-bold text-slate-400 w-16 text-center text-lg">
                    {rankIcon || idx + 1}
                </td>
                <td className="px-4 py-5">
                  <div className="font-bold text-slate-800 flex items-center">
                    {entry.playerName}
                    {entry.className && <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-normal">{entry.className}</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    {entry.schoolName || 'Tự do'} - <span className="font-medium text-slate-500">{entry.commune ? `${entry.commune}, ` : ''}{entry.province || 'VN'}</span>
                  </div>
                  <div className="text-[10px] text-indigo-400 font-medium italic mt-1">
                    {entry.topic}
                  </div>
                </td>
                <td className="px-4 py-5 text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-indigo-100 text-indigo-800">
                    {entry.score}/{entry.total}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
