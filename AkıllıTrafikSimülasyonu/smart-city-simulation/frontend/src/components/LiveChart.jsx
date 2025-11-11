import React, { useEffect, useRef } from 'react';

export default function LiveChart({ data, title, color, unit = '' }) {
  const canvasRef = useRef(null);
  const maxDataPoints = 60; // Son 60 ölçüm

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Arka plan
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);
    
    // Grid çizgileri
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    if (!data || data.length < 2) return;
    
    // Veri normalizasyonu
    const maxValue = Math.max(...data, 1);
    const minValue = Math.min(...data, 0);
    const range = maxValue - minValue || 1;
    
    // Grafik çizimi
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    const step = width / (maxDataPoints - 1);
    const startIndex = Math.max(0, data.length - maxDataPoints);
    
    data.slice(startIndex).forEach((value, index) => {
      const x = index * step;
      const normalizedValue = (value - minValue) / range;
      const y = height - (normalizedValue * height * 0.9) - (height * 0.05);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Alan dolgusu (gradient)
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Son değer göstergesi
    if (data.length > 0) {
      const lastValue = data[data.length - 1];
      const lastIndex = Math.min(data.length - startIndex - 1, maxDataPoints - 1);
      const lastX = lastIndex * step;
      const normalizedLastValue = (lastValue - minValue) / range;
      const lastY = height - (normalizedLastValue * height * 0.9) - (height * 0.05);
      
      // Nokta
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Değer etiketi
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${lastValue.toFixed(1)}${unit}`, width - 5, 15);
    }
    
    // Max/Min değerler
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${maxValue.toFixed(0)}`, 5, 12);
    ctx.fillText(`${minValue.toFixed(0)}`, 5, height - 3);
    
  }, [data, color, unit]);

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-3 border border-slate-700">
      <div className="text-white text-xs font-semibold mb-2 flex items-center justify-between">
        <span>{title}</span>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
      </div>
      <canvas
        ref={canvasRef}
        width={280}
        height={80}
        className="w-full rounded"
      />
    </div>
  );
}