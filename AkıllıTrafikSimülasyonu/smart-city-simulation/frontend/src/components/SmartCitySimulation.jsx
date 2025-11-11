import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Download, TrendingUp, Activity, Sparkles } from 'lucide-react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, FPS, TOOL_CATEGORIES } from '../utils/constants';
import { Simulation } from '../simulation/Simulation';
import { TrafficLightOptimizer } from '../ai/TrafficLightOptimizer';
import StatCard from './StatCard';
import ToolButton from './ToolButton';
import LiveChart from './LiveChart';
import OptimizationResultsChart from './OptimizationResultsChart';

export default function SmartCitySimulation() {
  const canvasRef = useRef(null);
  const simulationRef = useRef(null);
  const isInitializedRef = useRef(false);
  const optimizerRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('roads');
  const [stats, setStats] = useState({
    vehicles: 0,
    avgSpeed: 0,
    density: 0,
    iotCameras: 0,
    trafficLights: 0,
    avgWaitTime: 0
  });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState({
    generation: 0,
    total: 0,
    bestFitness: 0,
    improvement: 0
  });
  
  // Grafik geçmişi
  const [chartHistory, setChartHistory] = useState({
    vehicles: [],
    avgSpeed: [],
    density: [],
    avgWaitTime: []
  });

  // Optimizasyon sonuçları
  const [showOptimizationResults, setShowOptimizationResults] = useState(false);
  const [optimizationHistory, setOptimizationHistory] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // İlk kurulum (sadece bir kez)
    if (!isInitializedRef.current) {
      simulationRef.current = new Simulation(ctx);
      simulationRef.current.setupDefaultCity();
      optimizerRef.current = new TrafficLightOptimizer(simulationRef.current);
      isInitializedRef.current = true;
    }
    
    let animationId;
    let lastTime = 0;
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= 1000 / FPS) {
        if (isRunning) {
          simulationRef.current.update();
        }
        simulationRef.current.draw();
        
        const newStats = simulationRef.current.getStats();
        setStats(newStats);
        
        // Grafik verileri için geçmiş kaydet
        setChartHistory(prev => ({
          vehicles: [...prev.vehicles, newStats.vehicles].slice(-60),
          avgSpeed: [...prev.avgSpeed, newStats.avgSpeed].slice(-60),
          density: [...prev.density, newStats.density].slice(-60),
          avgWaitTime: [...prev.avgWaitTime, newStats.avgWaitTime].slice(-60)
        }));
        
        // AI önerileri (her 5 saniyede bir)
        if (Math.floor(currentTime / 5000) !== Math.floor(lastTime / 5000)) {
          updateAISuggestions(newStats);
        }
        
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationId);
  }, [isRunning]);

  const updateAISuggestions = (currentStats) => {
    const suggestions = [];
    
    if (currentStats.density > 75) {
      suggestions.push({
        type: 'warning',
        message: '⚠️ Yüksek yoğunluk: Trafik ışığı süreleri artırılmalı',
        action: 'optimize_lights'
      });
    }
    
    if (currentStats.avgWaitTime > 40) {
      suggestions.push({
        type: 'danger',
        message: '🚨 Uzun bekleme: Alternatif rotalar açılmalı',
        action: 'add_route'
      });
    }
    
    if (currentStats.vehicles > 30) {
      suggestions.push({
        type: 'info',
        message: '📊 Normal yoğunluk: Sistem optimal çalışıyor',
        action: 'none'
      });
    }
    
    setAiSuggestions(suggestions.slice(0, 2));
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GRID_SIZE);
    
    if (selectedTool) {
      simulationRef.current.placeTool(x, y, selectedTool);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    simulationRef.current.reset();
    simulationRef.current.setupDefaultCity();
    setAiSuggestions([]);
    setChartHistory({
      vehicles: [],
      avgSpeed: [],
      density: [],
      avgWaitTime: []
    });
  };

  const handleClear = () => {
    setIsRunning(false);
    simulationRef.current.clearVehiclesOnly();
  };

  const handleOptimize = async () => {
    if (stats.trafficLights === 0) {
      alert('❌ Optimize edilecek trafik ışığı yok! Önce trafik ışıkları ekleyin.');
      return;
    }

    setIsRunning(false);
    setIsOptimizing(true);
    setOptimizationProgress({ generation: 0, total: 12, bestFitness: 0, improvement: 0 });

    try {
      const result = await optimizerRef.current.optimize((progress) => {
        setOptimizationProgress({
          generation: progress.generation || 0,
          total: progress.total || 12,
          bestFitness: progress.bestFitness || 0,
          improvement: progress.improvement || 0
        });
      });

      if (result) {
        setIsOptimizing(false);
        
        // Optimizasyon geçmişini kaydet
        setOptimizationHistory(result.history);
        
        // Grafik modalını göster
        setTimeout(() => {
          setShowOptimizationResults(true);
        }, 500);
        
      } else {
        setIsOptimizing(false);
        alert('❌ Optimizasyon başarısız oldu.');
      }
    } catch (error) {
      console.error('Optimizasyon hatası:', error);
      setIsOptimizing(false);
      alert('❌ Optimizasyon sırasında hata oluştu.');
    }
  };

  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      stats: stats,
      chartHistory: chartHistory,
      vehicles: simulationRef.current.vehicles.map(v => v.exportData()),
      trafficLights: simulationRef.current.trafficLights.map(tl => tl.exportData()),
      iotCameras: simulationRef.current.iotCameras.map(cam => cam.exportData())
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Optimization Progress Modal */}
      {isOptimizing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-2xl border-2 border-purple-500 max-w-md w-full mx-4">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-white mb-2">🧬 AI Optimizasyon</h2>
              <p className="text-slate-300 mb-6">Genetik Algoritma Çalışıyor...</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Nesil</span>
                    <span>{optimizationProgress.generation} / {optimizationProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                      style={{ width: `${(optimizationProgress.generation / optimizationProgress.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">En İyi Skor</div>
                    <div className="text-xl font-bold text-green-400">{optimizationProgress.bestFitness.toFixed(1)}</div>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">İyileşme</div>
                    <div className="text-xl font-bold text-blue-400">%{optimizationProgress.improvement.toFixed(1)}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  Lütfen bekleyin, bu işlem 30-60 saniye sürebilir...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            className="rounded-2xl shadow-2xl border-4 border-slate-700 cursor-crosshair"
          />
          
          {/* Header Info */}
          <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl text-white px-6 py-3 rounded-xl shadow-2xl">
            <div className="text-xs font-bold text-yellow-300">TÜBİTAK 2209-A</div>
            <div className="text-lg font-bold">Akıllı Şehir Simülasyonu v3.0</div>
          </div>

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 space-y-2">
              {aiSuggestions.map((suggestion, idx) => (
                <div 
                  key={idx} 
                  className={`bg-gradient-to-r ${
                    suggestion.type === 'warning' ? 'from-yellow-600/90 to-orange-600/90' :
                    suggestion.type === 'danger' ? 'from-red-600/90 to-pink-600/90' :
                    'from-blue-600/90 to-cyan-600/90'
                  } backdrop-blur-xl text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium`}
                >
                  {suggestion.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Activity className="animate-pulse" />
            Kontrol Merkezi
          </h1>
          <p className="text-sm opacity-90">Sadettin Duman - Bartın Üniversitesi</p>
        </div>

        {/* Control Buttons */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-700">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              disabled={isOptimizing}
              className={`flex-1 flex items-center justify-center gap-2 ${
                isOptimizing ? 'bg-gray-500 cursor-not-allowed' :
                isRunning ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
              } text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Duraklat' : 'Başlat'}
            </button>
            <button
              onClick={handleExport}
              disabled={isOptimizing}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Verileri İndir"
            >
              <Download size={20} />
            </button>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={handleClear}
              disabled={isOptimizing}
              className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Araçları Temizle
            </button>
            <button
              onClick={handleReset}
              disabled={isOptimizing}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={18} />
              Sıfırla
            </button>
          </div>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || isRunning}
            className={`w-full flex items-center justify-center gap-2 ${
              isOptimizing ? 'bg-purple-500 animate-pulse' :
              'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
            } text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Sparkles size={20} className={isOptimizing ? 'animate-spin' : ''} />
            {isOptimizing ? 'AI Optimize Ediyor...' : '🧬 AI Optimize Et'}
          </button>
        </div>

        {/* Statistics */}
        <div className="p-4 bg-slate-900/30 border-b border-slate-700">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <TrendingUp size={18} />
            Canlı İstatistikler
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Araçlar" value={stats.vehicles} color="blue" />
            <StatCard label="Ort. Hız" value={`${stats.avgSpeed.toFixed(1)} km/h`} color="green" />
            <StatCard label="Yoğunluk" value={`${stats.density.toFixed(0)}%`} color="orange" />
            <StatCard label="Ort. Bekleme" value={`${stats.avgWaitTime.toFixed(0)}s`} color="purple" />
          </div>
        </div>

        {/* Live Charts */}
        <div className="p-4 bg-slate-900/30 border-b border-slate-700 overflow-y-auto max-h-80">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            📊 Canlı Grafikler
          </h3>
          <div className="space-y-3">
            <LiveChart 
              data={chartHistory.vehicles} 
              title="Araç Sayısı" 
              color="#2196f3" 
              unit=""
            />
            <LiveChart 
              data={chartHistory.avgSpeed} 
              title="Ortalama Hız" 
              color="#4caf50" 
              unit=" km/h"
            />
            <LiveChart 
              data={chartHistory.density} 
              title="Yoğunluk" 
              color="#ff9800" 
              unit="%"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-950/50">
          {TOOL_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex-1 py-3 px-2 text-sm font-semibold transition-all ${
                selectedCategory === cat.name
                  ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Tools */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {TOOL_CATEGORIES
            .find((c) => c.name === selectedCategory)
            ?.items.map((item, idx) => (
              <ToolButton
                key={idx}
                item={item}
                selected={selectedTool?.type === item.type}
                onSelect={() => setSelectedTool(item)}
              />
            ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-700 text-center text-xs text-slate-500">
          <p className="mb-1">© 2025 - Danışman: Onur Çakırgöz</p>
          <p className="text-yellow-500 font-semibold">AI Destekli Dijital İkiz Platformu</p>
        </div>
      </div>

      {/* Optimization Results Chart Modal */}
      {showOptimizationResults && optimizationHistory && (
        <OptimizationResultsChart
          history={optimizationHistory}
          onClose={() => setShowOptimizationResults(false)}
        />
      )}
    </div>
  );
}