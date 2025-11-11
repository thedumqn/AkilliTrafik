import React from 'react';

export default function StatCard({ label, value, color }) {
  const colors = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    orange: 'from-orange-600 to-orange-700',
    purple: 'from-purple-600 to-purple-700',
    red: 'from-red-600 to-red-700',
    cyan: 'from-cyan-600 to-cyan-700'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} p-3 rounded-xl shadow-lg border border-white/10 hover:scale-105 transition-transform`}>
      <div className="text-white/80 text-xs mb-1 font-medium">{label}</div>
      <div className="text-white text-2xl font-bold">{value}</div>
    </div>
  );
}