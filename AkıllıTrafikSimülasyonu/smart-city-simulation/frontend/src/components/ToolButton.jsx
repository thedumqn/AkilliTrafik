import React from 'react';

export default function ToolButton({ item, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
        selected
          ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-400 shadow-xl scale-105'
          : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{item.icon}</div>
        <div className="flex-1">
          <div className="text-white font-semibold text-sm">{item.label}</div>
          <div className="text-xs text-slate-400 mt-1">Tıkla ve yerleştir</div>
        </div>
      </div>
    </div>
  );
}