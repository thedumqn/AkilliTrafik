import { 
  GRID_WIDTH, 
  GRID_HEIGHT, 
  GRID_SIZE, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  CellType, 
  Direction,
  VEHICLE_COLORS,
  EMERGENCY_COLOR
} from '../utils/constants';
import { Vehicle } from './Vehicle';
import { TrafficLight } from './TrafficLight';
import { IoTCamera } from './IoTCamera';

export class Simulation {
  constructor(ctx) {
    this.ctx = ctx;
    this.grid = [];
    this.vehicles = [];
    this.trafficLights = [];
    this.iotCameras = [];
    this.frameCount = 0;
    this.spawnRate = 0.02;
    this.emergencySpawnRate = 0.001;
    this.initGrid();
  }

  initGrid() {
    this.grid = Array(GRID_WIDTH).fill(null).map((_, x) =>
      Array(GRID_HEIGHT).fill(null).map((_, y) => ({
        x,
        y,
        type: CellType.EMPTY,
        lanes: []
      }))
    );
  }

  setupDefaultCity() {
    // Yatay çift şeritli yollar
    for (let x = 2; x < 26; x++) {
      this.placeTool(x, 7, { type: CellType.ROAD_DUAL_HORIZONTAL });
      this.placeTool(x, 13, { type: CellType.ROAD_DUAL_HORIZONTAL });
    }

    // Dikey çift şeritli yollar
    for (let y = 2; y < 18; y++) {
      this.placeTool(9, y, { type: CellType.ROAD_DUAL_VERTICAL });
      this.placeTool(18, y, { type: CellType.ROAD_DUAL_VERTICAL });
    }

    // Kavşaklar ve trafik ışıkları
    const intersections = [
      [9, 7], [18, 7], [9, 13], [18, 13]
    ];
    
    intersections.forEach(([x, y]) => {
      this.placeTool(x, y, { type: CellType.ROAD_INTERSECTION });
      this.trafficLights.push(new TrafficLight(x, y));
    });

    // IoT Kameralar
    this.iotCameras.push(new IoTCamera(9, 5));
    this.iotCameras.push(new IoTCamera(18, 5));
    this.iotCameras.push(new IoTCamera(9, 15));
    this.iotCameras.push(new IoTCamera(18, 15));

    // Binalar
    const buildings = [
      [5, 4, 'residential'], [7, 4, 'residential'], [11, 4, 'commercial'], [13, 4, 'residential'],
      [15, 4, 'commercial'], [20, 4, 'residential'], [22, 4, 'commercial'], [5, 10, 'commercial'],
      [7, 10, 'residential'], [11, 10, 'residential'], [13, 10, 'commercial'], [15, 10, 'residential'],
      [20, 10, 'commercial'], [22, 10, 'residential'], [5, 16, 'residential'], [7, 16, 'commercial'],
      [11, 16, 'residential'], [13, 16, 'commercial'], [20, 16, 'residential'], [22, 16, 'commercial']
    ];

    buildings.forEach(([x, y, type]) => {
      if (this.isValidPlacement(x, y)) {
        this.grid[x][y].type = type;
      }
    });
  }

  placeTool(x, y, tool) {
    if (!this.isValidPlacement(x, y)) return;
    const cell = this.grid[x][y];
    
    if (tool.type.startsWith('vehicle_')) {
      // Araç yerleştirme
      const isEmergency = tool.type === 'vehicle_emergency';
      const colors = {
        vehicle_blue: '#2196f3',
        vehicle_red: '#f44336',
        vehicle_green: '#4caf50',
        vehicle_emergency: EMERGENCY_COLOR
      };
      
      if (this.isRoadCell(cell)) {
        const dir = this.getRoadDirection(cell);
        const lane = Math.floor(Math.random() * 2);
        this.vehicles.push(new Vehicle(
          x * GRID_SIZE + GRID_SIZE / 2,
          y * GRID_SIZE + GRID_SIZE / 2,
          dir,
          lane,
          colors[tool.type],
          isEmergency
        ));
      }
    } else if (tool.type === CellType.IOT_CAMERA) {
      if (!this.iotCameras.some(cam => cam.x === x && cam.y === y)) {
        this.iotCameras.push(new IoTCamera(x, y));
      }
    } else if (tool.type === CellType.TRAFFIC_LIGHT) {
      if (!this.trafficLights.some(tl => tl.x === x && tl.y === y)) {
        this.trafficLights.push(new TrafficLight(x, y));
      }
    } else {
      // Yol veya bina yerleştirme
      cell.type = tool.type;
      
      if (tool.type === CellType.ROAD_DUAL_HORIZONTAL) {
        cell.lanes = [
          { direction: Direction.EAST, offset: -8 },
          { direction: Direction.WEST, offset: 8 }
        ];
      } else if (tool.type === CellType.ROAD_DUAL_VERTICAL) {
        cell.lanes = [
          { direction: Direction.SOUTH, offset: -8 },
          { direction: Direction.NORTH, offset: 8 }
        ];
      }
    }
  }

  isValidPlacement(x, y) {
    return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
  }

  isRoadCell(cell) {
    return [
      'road_h',
      'road_v',
      'road_dual_h',
      'road_dual_v',
      'intersection'
    ].includes(cell.type);
  }

  getRoadDirection(cell) {
    if (cell.type === 'road_h' || cell.type === 'road_dual_h') {
      return Direction.EAST;
    } else if (cell.type === 'road_v' || cell.type === 'road_dual_v') {
      return Direction.SOUTH;
    }
    return Direction.EAST;
  }

  spawnVehicle() {
    if (Math.random() > this.spawnRate) return;

    const spawnPoints = [
      { x: 2, y: 7, dir: Direction.EAST, lane: 0 },
      { x: 25, y: 7, dir: Direction.WEST, lane: 1 },
      { x: 2, y: 13, dir: Direction.EAST, lane: 0 },
      { x: 25, y: 13, dir: Direction.WEST, lane: 1 },
      { x: 9, y: 2, dir: Direction.SOUTH, lane: 0 },
      { x: 9, y: 17, dir: Direction.NORTH, lane: 1 },
      { x: 18, y: 2, dir: Direction.SOUTH, lane: 0 },
      { x: 18, y: 17, dir: Direction.NORTH, lane: 1 }
    ];

    const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    
    const isEmergency = Math.random() < this.emergencySpawnRate;
    const color = isEmergency 
      ? EMERGENCY_COLOR 
      : VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)];

    this.vehicles.push(new Vehicle(
      spawn.x * GRID_SIZE + GRID_SIZE / 2,
      spawn.y * GRID_SIZE + GRID_SIZE / 2,
      spawn.dir,
      spawn.lane,
      color,
      isEmergency
    ));
  }

  update() {
    this.frameCount++;
    
    this.spawnVehicle();
    this.trafficLights.forEach(tl => tl.update());
    this.iotCameras.forEach(cam => cam.detectVehicles(this.vehicles));
    
    // Araçları güncelle (akıllı kavşak parametresi kaldırıldı)
    this.vehicles.forEach(v => v.update(
      this.grid, 
      this.vehicles, 
      this.trafficLights
    ));

    this.vehicles = this.vehicles.filter(v => !v.isOutOfBounds());
  }

  draw() {
    const ctx = this.ctx;
    
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f1a0f');
    gradient.addColorStop(1, '#050a05');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawGrid();
    this.iotCameras.forEach(cam => cam.draw(ctx));
    this.trafficLights.forEach(tl => tl.draw(ctx));
    this.vehicles.forEach(v => v.draw(ctx));

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GRID_SIZE, 0);
      ctx.lineTo(x * GRID_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * GRID_SIZE);
      ctx.stroke();
    }
  }

  drawGrid() {
    const ctx = this.ctx;
    
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        const cell = this.grid[x][y];
        const px = x * GRID_SIZE;
        const py = y * GRID_SIZE;

        switch (cell.type) {
          case 'road_h':
          case 'road_v':
            this.drawSingleLaneRoad(ctx, px, py, cell.type);
            break;
          case 'road_dual_h':
          case 'road_dual_v':
            this.drawDualLaneRoad(ctx, px, py, cell.type);
            break;
          case 'intersection':
            this.drawIntersection(ctx, px, py);
            break;
          case 'residential':
            this.drawBuilding(ctx, px, py, '#ffd54f', '#fff59d');
            break;
          case 'commercial':
            this.drawBuilding(ctx, px, py, '#90a4ae', '#b0bec5');
            break;
        }
      }
    }
  }

  drawSingleLaneRoad(ctx, x, y, type) {
    const gradient = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE);
    gradient.addColorStop(0, '#4a4a4a');
    gradient.addColorStop(1, '#3a3a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    
    if (type === 'road_h') {
      ctx.beginPath();
      ctx.moveTo(x, y + GRID_SIZE / 2);
      ctx.lineTo(x + GRID_SIZE, y + GRID_SIZE / 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + GRID_SIZE / 2, y);
      ctx.lineTo(x + GRID_SIZE / 2, y + GRID_SIZE);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }

  drawDualLaneRoad(ctx, x, y, type) {
    const gradient = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE);
    gradient.addColorStop(0, '#505050');
    gradient.addColorStop(0.5, '#454545');
    gradient.addColorStop(1, '#3a3a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    
    if (type === 'road_dual_h') {
      ctx.beginPath();
      ctx.moveTo(x, y + GRID_SIZE / 2);
      ctx.lineTo(x + GRID_SIZE, y + GRID_SIZE / 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + GRID_SIZE / 2, y);
      ctx.lineTo(x + GRID_SIZE / 2, y + GRID_SIZE);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    if (type === 'road_dual_h') {
      ctx.strokeRect(x, y + 5, GRID_SIZE, GRID_SIZE - 10);
    } else {
      ctx.strokeRect(x + 5, y, GRID_SIZE - 10, GRID_SIZE);
    }
  }

  drawIntersection(ctx, x, y) {
    const gradient = ctx.createRadialGradient(
      x + GRID_SIZE / 2, y + GRID_SIZE / 2, 0,
      x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE
    );
    gradient.addColorStop(0, '#5a5a5a');
    gradient.addColorStop(1, '#3a3a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x + 5 + i * 8, y + 2, 5, 8);
      ctx.fillRect(x + 5 + i * 8, y + GRID_SIZE - 10, 5, 8);
      ctx.fillRect(x + 2, y + 5 + i * 8, 8, 5);
      ctx.fillRect(x + GRID_SIZE - 10, y + 5 + i * 8, 8, 5);
    }
  }

  drawBuilding(ctx, x, y, baseColor, accentColor) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 3, y + 3, GRID_SIZE - 3, GRID_SIZE - 3);

    const gradient = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(1, accentColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

    ctx.fillStyle = '#64b5f6';
    for (let wx = 0; wx < 2; wx++) {
      for (let wy = 0; wy < 2; wy++) {
        const windowX = x + 8 + wx * 16;
        const windowY = y + 8 + wy * 16;
        ctx.shadowColor = '#64b5f6';
        ctx.shadowBlur = 4;
        ctx.fillRect(windowX, windowY, 8, 8);
        ctx.shadowBlur = 0;
      }
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
  }

  getStats() {
    const speeds = this.vehicles.map(v => v.speed);
    const waitTimes = this.vehicles.map(v => v.totalWaitTime);
    const avgSpeed = speeds.length > 0 
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length * 10 
      : 0;
    const avgWaitTime = waitTimes.length > 0 
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length / 60 
      : 0;
    const roadCells = this.grid.flat().filter(c => this.isRoadCell(c)).length;
    const density = roadCells > 0 
      ? (this.vehicles.length / roadCells) * 100 
      : 0;

    return {
      vehicles: this.vehicles.length,
      avgSpeed: avgSpeed,
      density: density,
      iotCameras: this.iotCameras.length,
      trafficLights: this.trafficLights.length,
      avgWaitTime: avgWaitTime
    };
  }

  reset() {
    this.vehicles = [];
    this.trafficLights = [];
    this.iotCameras = [];
    this.frameCount = 0;
    this.initGrid();
  }

  clearVehiclesOnly() {
    this.vehicles = [];
    this.frameCount = 0;
  }
}