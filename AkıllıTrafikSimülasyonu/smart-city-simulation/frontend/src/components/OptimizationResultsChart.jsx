import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function OptimizationResultsChart({ history, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!history || history.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Temizle
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Veri hazırlığı
    const maxFitness = Math.max(...history.map(h => h.best), 100);
    const minFitness = Math.min(...history.map(h => h.best), 0);
    const range = maxFitness - minFitness || 1;

    const paddingX = 50;
    const paddingY = 40;
    const graphWidth = width - paddingX * 2;
    const graphHeight = height - paddingY * 2;

    // Grid çizgileri
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = paddingY + (graphHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(paddingX, y);
      ctx.lineTo(width - paddingX, y);
      ctx.stroke();

      // Y ekseni değerleri
      const value = maxFitness - (range / 5) * i;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(0), paddingX - 10, y + 4);
    }

    // X ekseni çizgileri
    const step = graphWidth / (history.length - 1);
    for (let i = 0; i < history.length; i += Math.ceil(history.length / 10)) {
      const x = paddingX + i * step;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(x, paddingY);
      ctx.lineTo(x, height - paddingY);
      ctx.stroke();

      // X ekseni değerleri (nesil)
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`N${i}`, x, height - paddingY + 20);
    }

    // En iyi skor çizgisi (mavi)
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;

    history.forEach((point, index) => {
      const x = paddingX + index * step;
      const normalizedValue = (point.best - minFitness) / range;
      const y = height - paddingY - (normalizedValue * graphHeight);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ortalama skor çizgisi (yeşil)
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;

    history.forEach((point, index) => {
      const x = paddingX + index * step;
      const normalizedValue = (point.average - minFitness) / range;
      const y = height - paddingY - (normalizedValue * graphHeight);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Noktalar (en iyi skor)
    history.forEach((point, index) => {
      const x = paddingX + index * step;
      const normalizedValue = (point.best - minFitness) / range;
      const y = height - paddingY - (normalizedValue * graphHeight);

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // İlk ve son değer etiketleri
    const firstBest = history[0].best;
    const lastBest = history[history.length - 1].best;
    const improvement = ((lastBest - firstBest) / firstBest * 100).toFixed(1);

    // İlk değer
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    const firstX = paddingX;
    const firstNormalized = (firstBest - minFitness) / range;
    const firstY = height - paddingY - (firstNormalized * graphHeight);
    ctx.fillText(`Başlangıç: ${firstBest.toFixed(1)}`, firstX + 10, firstY - 10);

    // Son değer
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';
    const lastX = width - paddingX;
    const lastNormalized = (lastBest - minFitness) / range;
    const lastY = height - paddingY - (lastNormalized * graphHeight);
    ctx.fillText(`Son: ${lastBest.toFixed(1)}`, lastX - 10, lastY - 10);

    // İyileşme yüzdesi (ortada büyük)
    ctx.fillStyle = improvement > 0 ? '#10b981' : '#ef4444';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${improvement > 0 ? '+' : ''}${improvement}%`, width / 2, 50);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('İyileşme', width / 2, 70);

    // Legend (açıklama)
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(paddingX, height - 25, 15, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('En İyi Skor', paddingX + 20, height - 20);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(paddingX + 120, height - 25, 15, 3);
    ctx.fillText('Ortalama Skor', paddingX + 140, height - 20);

  }, [history]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border-2 border-purple-500 max-w-4xl w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              📊 Optimizasyon Sonuçları
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Genetik Algoritma İyileşme Grafiği
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full rounded-xl bg-slate-950 border border-slate-700"
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-400 text-xs mb-1">Toplam Nesil</div>
            <div className="text-white text-2xl font-bold">{history?.length || 0}</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-400 text-xs mb-1">Başlangıç Skoru</div>
            <div className="text-red-400 text-2xl font-bold">
              {history?.[0]?.best.toFixed(1) || 0}
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-400 text-xs mb-1">Son Skor</div>
            <div className="text-green-400 text-2xl font-bold">
              {history?.[history.length - 1]?.best.toFixed(1) || 0}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}