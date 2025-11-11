import { GRID_SIZE } from '../utils/constants';

export class IoTCamera {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.detectedVehicles = 0;
    this.range = 3; // Grid hücresi cinsinden menzil
    this.scanAngle = 0;
    this.detectionHistory = [];
  }

  detectVehicles(vehicles) {
    this.detectedVehicles = 0;
    const currentDetections = [];
    
    for (const vehicle of vehicles) {
      const dx = Math.abs(vehicle.x / GRID_SIZE - this.x);
      const dy = Math.abs(vehicle.y / GRID_SIZE - this.y);
      
      if (dx <= this.range && dy <= this.range) {
        this.detectedVehicles++;
        currentDetections.push({
          id: vehicle,
          distance: Math.sqrt(dx * dx + dy * dy),
          speed: vehicle.speed
        });
      }
    }
    
    // Geçmiş kayıt (son 60 frame)
    this.detectionHistory.push(this.detectedVehicles);
    if (this.detectionHistory.length > 60) {
      this.detectionHistory.shift();
    }
    
    // Tarama açısı animasyonu
    this.scanAngle = (this.scanAngle + 0.05) % (Math.PI * 2);
  }

  draw(ctx) {
    const x = this.x * GRID_SIZE + GRID_SIZE / 2;
    const y = this.y * GRID_SIZE + GRID_SIZE / 2;

    // Tespit alanı (pulse efekti)
    const pulse = Math.sin(this.scanAngle * 4) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(33, 150, 243, ${0.1 * pulse})`;
    ctx.beginPath();
    ctx.arc(x, y, this.range * GRID_SIZE * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Kamera gövdesi
    ctx.fillStyle = '#1a237e';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Kamera lensi
    ctx.fillStyle = '#2196f3';
    ctx.shadowColor = '#2196f3';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Çerçeve
    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Tarama ışını
    ctx.strokeStyle = `rgba(33, 150, 243, 0.6)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(this.scanAngle) * this.range * GRID_SIZE,
      y + Math.sin(this.scanAngle) * this.range * GRID_SIZE
    );
    ctx.stroke();

    // Tespit edilen araç sayısı
    if (this.detectedVehicles > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.detectedVehicles, x, y - 20);
    }
  }

  // AI için veri dışa aktar
  exportData() {
    const avgDetection = this.detectionHistory.length > 0
      ? this.detectionHistory.reduce((a, b) => a + b, 0) / this.detectionHistory.length
      : 0;

    return {
      position: { x: this.x, y: this.y },
      currentDetections: this.detectedVehicles,
      averageDetections: avgDetection,
      range: this.range,
      historyLength: this.detectionHistory.length
    };
  }

  // Menzili ayarla (AI optimizasyonu için)
  setRange(newRange) {
    this.range = Math.max(1, Math.min(5, newRange));
  }
}