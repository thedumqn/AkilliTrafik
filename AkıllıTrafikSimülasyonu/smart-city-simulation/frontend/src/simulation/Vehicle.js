import { Direction, LightState, GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_WIDTH, GRID_HEIGHT } from '../utils/constants';

export class Vehicle {
  constructor(x, y, direction, lane, color, isEmergency = false) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.lane = lane;
    this.color = color;
    this.isEmergency = isEmergency; // Ambulans, itfaiye vb.
    
    // Fizik parametreleri
    this.speed = 0;
    this.maxSpeed = isEmergency ? 4 : (2 + Math.random() * 1.5);
    this.acceleration = 0.15;
    this.deceleration = 0.3;
    this.width = 16;
    this.height = 28;
    this.laneOffset = lane === 0 ? -8 : 8;
    
    // Davranış parametreleri
    this.waitTime = 0;
    this.totalWaitTime = 0;
    this.safeDistance = 35; // Güvenli takip mesafesi
    this.turnSignal = null; // 'left', 'right', null
    this.isTurning = false;
    this.turnProgress = 0;
    this.patience = Math.random() * 100 + 50; // Sabır seviyesi
    
    // Karar verme
    this.targetSpeed = this.maxSpeed;
    this.nextDecision = Math.random() * 180 + 120; // Sonraki karar zamanı
    this.decisionTimer = 0;
  }

  /**
   * Ana güncelleme
   */
  update(grid, vehicles, trafficLights = []) {
    this.decisionTimer++;
    
    // Trafik ışığı kontrolü
    const shouldStopForLight = this.checkTrafficLight(trafficLights,);
    
    // Önündeki araç kontrolü
    const frontVehicle = this.detectFrontVehicle(vehicles);
    
    // Hız ayarlama (gerçekçi ivmelenme/frenleme)
    if (shouldStopForLight || frontVehicle) {
      this.targetSpeed = 0;
      this.waitTime++;
      this.totalWaitTime++;
      
      // Acil durum aracıysa daha az bekle
      if (this.isEmergency && this.waitTime > 60) {
        this.targetSpeed = this.maxSpeed * 0.3; // Yavaşça geç
      }
    } else {
      this.targetSpeed = this.maxSpeed;
      this.waitTime = 0;
      
      // Yaklaşan kavşak için yavaşla
      if (this.isNearIntersection(grid)) {
        this.targetSpeed = this.maxSpeed * 0.7;
      }
    }
    
    // Yumuşak ivmelenme/frenleme
    this.adjustSpeed();
    
    // Hareket
    if (this.speed > 0.1) {
      if (this.isTurning) {
        this.performTurn();
      } else {
        this.move();
      }
    }
    
    // Karar verme (dönüş, şerit değiştirme)
    if (this.decisionTimer >= this.nextDecision && !this.isTurning) {
      this.makeDecision(grid, vehicles);
      this.decisionTimer = 0;
      this.nextDecision = Math.random() * 180 + 120;
    }
  }

  /**
   * Yumuşak hız ayarlama (gerçekçi ivmelenme)
   */
  adjustSpeed() {
    if (this.speed < this.targetSpeed) {
      // İvmelenme
      this.speed = Math.min(this.targetSpeed, this.speed + this.acceleration);
    } else if (this.speed > this.targetSpeed) {
      // Frenleme
      this.speed = Math.max(this.targetSpeed, this.speed - this.deceleration);
    }
  }

  /**
   * Önündeki aracı algıla
   */
  detectFrontVehicle(vehicles) {
    for (const other of vehicles) {
      if (other === this) continue;
      if (other.direction !== this.direction) continue;
      if (other.lane !== this.lane) continue;
      
      // Önde mi?
      const isAhead = this.isVehicleAhead(other);
      if (!isAhead) continue;
      
      // Mesafe kontrolü
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.safeDistance) {
        return other;
      }
    }
    return null;
  }

  /**
   * Araç önde mi kontrolü
   */
  isVehicleAhead(other) {
    switch (this.direction) {
      case Direction.NORTH:
        return other.y < this.y;
      case Direction.SOUTH:
        return other.y > this.y;
      case Direction.EAST:
        return other.x > this.x;
      case Direction.WEST:
        return other.x < this.x;
      default:
        return false;
    }
  }

  /**
   * Kavşağa yakın mı?
   */
  isNearIntersection(grid) {
    const gx = Math.floor(this.x / GRID_SIZE);
    const gy = Math.floor(this.y / GRID_SIZE);
    
    // 2 hücre ileriyi kontrol et
    const checkPositions = [];
    switch (this.direction) {
      case Direction.NORTH:
        checkPositions.push({ x: gx, y: gy - 1 }, { x: gx, y: gy - 2 });
        break;
      case Direction.SOUTH:
        checkPositions.push({ x: gx, y: gy + 1 }, { x: gx, y: gy + 2 });
        break;
      case Direction.EAST:
        checkPositions.push({ x: gx + 1, y: gy }, { x: gx + 2, y: gy });
        break;
      case Direction.WEST:
        checkPositions.push({ x: gx - 1, y: gy }, { x: gx - 2, y: gy });
        break;
    }
    
    for (const pos of checkPositions) {
      if (pos.x >= 0 && pos.x < GRID_WIDTH && pos.y >= 0 && pos.y < GRID_HEIGHT) {
        const cell = grid[pos.x][pos.y];
        if (cell.type === 'intersection') {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Trafik ışığı kontrolü (akıllı kavşak destekli)
   */
 checkTrafficLight(trafficLights) {
  for (const light of trafficLights) {
    if (light.state !== LightState.GREEN) {
      const dx = this.x - (light.x * GRID_SIZE + GRID_SIZE / 2);
      const dy = this.y - (light.y * GRID_SIZE + GRID_SIZE / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 60 && distance > 10 && this.isApproachingPoint(light.x * GRID_SIZE, light.y * GRID_SIZE)) {
        return true;
      }
    }
  }
  
  return false;
}

  /**
   * Belirli bir noktaya yaklaşıyor mu?
   */
  isApproachingPoint(px, py) {
    switch (this.direction) {
      case Direction.NORTH: return this.y > py;
      case Direction.SOUTH: return this.y < py;
      case Direction.EAST: return this.x < px;
      case Direction.WEST: return this.x > px;
      default: return false;
    }
  }

  /**
   * Hareket
   */
  move() {
    switch (this.direction) {
      case Direction.NORTH:
        this.y -= this.speed;
        this.x = Math.floor(this.x / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2 + this.laneOffset;
        break;
      case Direction.SOUTH:
        this.y += this.speed;
        this.x = Math.floor(this.x / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2 + this.laneOffset;
        break;
      case Direction.EAST:
        this.x += this.speed;
        this.y = Math.floor(this.y / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2 + this.laneOffset;
        break;
      case Direction.WEST:
        this.x -= this.speed;
        this.y = Math.floor(this.y / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2 + this.laneOffset;
        break;
    }
  }

  /**
   * Karar verme (dönüş, şerit değiştirme)
   */
  makeDecision(grid, vehicles) {
    const gx = Math.floor(this.x / GRID_SIZE);
    const gy = Math.floor(this.y / GRID_SIZE);
    
    if (gx >= 0 && gx < GRID_WIDTH && gy >= 0 && gy < GRID_HEIGHT) {
      const cell = grid[gx][gy];
      
      // Kavşaktaysa dön
      if (cell.type === 'intersection' && Math.random() < 0.35) {
        this.startTurn();
        return;
      }
    }
    
    // Şerit değiştirme
    if (Math.random() < 0.05 && this.speed > 1) {
      this.changeLane(vehicles);
    }
  }

  /**
   * Dönüş başlat
   */
  startTurn() {
    const possibleDirections = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST];
    const options = possibleDirections.filter(d => d !== this.direction);
    
    const newDirection = options[Math.floor(Math.random() * options.length)];
    
    // Sinyal ver
    if (this.isTurnLeft(this.direction, newDirection)) {
      this.turnSignal = 'left';
    } else if (this.isTurnRight(this.direction, newDirection)) {
      this.turnSignal = 'right';
    }
    
    this.isTurning = true;
    this.turnProgress = 0;
    this.nextDirection = newDirection;
  }

  /**
   * Sola dönüş mü?
   */
  isTurnLeft(from, to) {
    const leftTurns = {
      [Direction.NORTH]: Direction.WEST,
      [Direction.EAST]: Direction.NORTH,
      [Direction.SOUTH]: Direction.EAST,
      [Direction.WEST]: Direction.SOUTH
    };
    return leftTurns[from] === to;
  }

  /**
   * Sağa dönüş mü?
   */
  isTurnRight(from, to) {
    const rightTurns = {
      [Direction.NORTH]: Direction.EAST,
      [Direction.EAST]: Direction.SOUTH,
      [Direction.SOUTH]: Direction.WEST,
      [Direction.WEST]: Direction.NORTH
    };
    return rightTurns[from] === to;
  }

  /**
   * Dönüş gerçekleştir
   */
  performTurn() {
    this.turnProgress++;
    
    // Yavaş dön
    this.speed = Math.max(0.5, this.speed - 0.1);
    
    // İleri hareket
    this.move();
    
    // Dönüş tamamlandı
    if (this.turnProgress >= 30) {
      this.direction = this.nextDirection;
      this.isTurning = false;
      this.turnProgress = 0;
      this.turnSignal = null;
      this.speed = this.maxSpeed * 0.5; // Yavaş başla
    }
  }

  /**
   * Şerit değiştirme
   */
  changeLane(vehicles) {
    const newLane = 1 - this.lane;
    
    // Güvenli mi?
    const isSafe = !vehicles.some(v => {
      if (v === this) return false;
      if (v.direction !== this.direction) return false;
      if (v.lane !== newLane) return false;
      
      const dx = Math.abs(v.x - this.x);
      const dy = Math.abs(v.y - this.y);
      return dx < 30 && dy < 30;
    });

    if (isSafe) {
      this.lane = newLane;
      this.laneOffset = newLane === 0 ? -8 : 8;
      
      // Sinyal ver
      this.turnSignal = newLane === 0 ? 'left' : 'right';
      setTimeout(() => { this.turnSignal = null; }, 1000);
    }
  }

  /**
   * Sınırların dışında mı?
   */
  isOutOfBounds() {
    return this.x < -50 || this.x > CANVAS_WIDTH + 50 || 
           this.y < -50 || this.y > CANVAS_HEIGHT + 50;
  }

  /**
   * Çizim
   */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const rotations = { 
      0: -Math.PI / 2, 
      1: 0, 
      2: Math.PI / 2, 
      3: Math.PI 
    };
    ctx.rotate(rotations[this.direction]);

    // Gölge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-this.width / 2 + 2, -this.height / 2 + 2, this.width, this.height);

    // Araç gövdesi
    const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, this.adjustColor(this.color, -30));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 4);
    ctx.fill();

    // Cam
    ctx.fillStyle = 'rgba(100, 180, 220, 0.6)';
    ctx.fillRect(-this.width / 3, -this.height / 4, this.width * 2 / 3, this.height / 3);

    // Acil durum işareti
    if (this.isEmergency) {
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🚨', 0, -this.height / 2 - 8);
      ctx.shadowBlur = 0;
    }

    // Farlar (hareket halindeyken)
    if (this.speed > 0.5) {
      ctx.fillStyle = '#ffffcc';
      ctx.shadowColor = '#ffffcc';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-4, this.height / 2 - 4, 2, 0, Math.PI * 2);
      ctx.arc(4, this.height / 2 - 4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Fren lambaları (duruyorsa)
    if (this.speed < 0.5) {
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(-4, -this.height / 2 + 4, 2, 0, Math.PI * 2);
      ctx.arc(4, -this.height / 2 + 4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Sinyal lambaları
    if (this.turnSignal === 'left') {
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-this.width / 2 - 2, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.turnSignal === 'right') {
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.width / 2 + 2, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  adjustColor(color, amount) {
    const num = parseInt(color.slice(1), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  exportData() {
    return {
      position: { x: this.x, y: this.y },
      speed: this.speed,
      direction: this.direction,
      waitTime: this.waitTime,
      totalWaitTime: this.totalWaitTime,
      lane: this.lane,
      isEmergency: this.isEmergency,
      isTurning: this.isTurning
    };
  }
}