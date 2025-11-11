import { LightState, GRID_SIZE } from '../utils/constants';

export class TrafficLight {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.state = LightState.GREEN;
    this.timer = 0;
    this.durations = {
      [LightState.GREEN]: 120,
      [LightState.YELLOW]: 30,
      [LightState.RED]: 120
    };
  }

  update() {
    this.timer++;
    
    if (this.timer >= this.durations[this.state]) {
      this.timer = 0;
      
      if (this.state === LightState.GREEN) {
        this.state = LightState.YELLOW;
      } else if (this.state === LightState.YELLOW) {
        this.state = LightState.RED;
      } else {
        this.state = LightState.GREEN;
      }
    }
  }

  draw(ctx) {
    const x = this.x * GRID_SIZE;
    const y = this.y * GRID_SIZE;

    // Direk
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x + 15, y, 10, GRID_SIZE);

    // Işık kutusu
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 5, 30, 30, 5);
    ctx.fill();

    // Aktif ışık
    const colors = {
      [LightState.RED]: '#f44336',
      [LightState.YELLOW]: '#ffeb3b',
      [LightState.GREEN]: '#4caf50'
    };

    ctx.fillStyle = colors[this.state];
    ctx.shadowColor = colors[this.state];
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Çerçeve
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  // AI için optimizasyon (opsiyonel)
  setDuration(state, duration) {
    if (this.durations.hasOwnProperty(state)) {
      this.durations[state] = Math.max(20, Math.min(200, duration));
    }
  }

  // Tüm süreleri ayarla
  setAllDurations(green, yellow, red) {
    this.durations[LightState.GREEN] = Math.max(20, Math.min(200, green));
    this.durations[LightState.YELLOW] = Math.max(20, Math.min(60, yellow));
    this.durations[LightState.RED] = Math.max(20, Math.min(200, red));
  }

  // Mevcut durumu JSON olarak dışa aktar
  exportData() {
    return {
      position: { x: this.x, y: this.y },
      state: this.state,
      timer: this.timer,
      durations: this.durations
    };
  }
}