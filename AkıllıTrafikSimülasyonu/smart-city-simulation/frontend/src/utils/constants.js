// ==================== SIMULATION CONSTANTS ====================
export const GRID_SIZE = 40;
export const GRID_WIDTH = 28;
export const GRID_HEIGHT = 20;
export const CANVAS_WIDTH = GRID_WIDTH * GRID_SIZE;
export const CANVAS_HEIGHT = GRID_HEIGHT * GRID_SIZE;
export const FPS = 60;

export const CellType = {
  EMPTY: 'empty',
  ROAD_HORIZONTAL: 'road_h',
  ROAD_VERTICAL: 'road_v',
  ROAD_DUAL_HORIZONTAL: 'road_dual_h',
  ROAD_DUAL_VERTICAL: 'road_dual_v',
  ROAD_INTERSECTION: 'intersection',
  BUILDING_RESIDENTIAL: 'residential',
  BUILDING_COMMERCIAL: 'commercial',
  TRAFFIC_LIGHT: 'traffic_light',
  IOT_CAMERA: 'iot_camera'
};

export const Direction = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3
};

export const LightState = {
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green'
};

export const VEHICLE_COLORS = [
  '#2196f3', 
  '#f44336', 
  '#9c27b0', 
  '#ff9800', 
  '#4caf50'
];

export const EMERGENCY_COLOR = '#ff1744';

export const TOOL_CATEGORIES = [
  {
    name: 'roads',
    title: 'Yollar',
    items: [
      { type: CellType.ROAD_HORIZONTAL, icon: '─', label: 'Tek Şerit (→)', color: '#555' },
      { type: CellType.ROAD_VERTICAL, icon: '│', label: 'Tek Şerit (↓)', color: '#555' },
      { type: CellType.ROAD_DUAL_HORIZONTAL, icon: '═', label: 'Çift Şerit (→)', color: '#666' },
      { type: CellType.ROAD_DUAL_VERTICAL, icon: '║', label: 'Çift Şerit (↓)', color: '#666' },
      { type: CellType.ROAD_INTERSECTION, icon: '╋', label: 'Kavşak', color: '#777' }
    ]
  },
  {
    name: 'traffic',
    title: 'Trafik Yönetimi',
    items: [
      { type: CellType.TRAFFIC_LIGHT, icon: '🚦', label: 'Trafik Işığı', color: '#f44336' },
      { type: CellType.IOT_CAMERA, icon: '📹', label: 'IoT Kamera', color: '#2196f3' },
      { type: 'vehicle_blue', icon: '🚗', label: 'Mavi Araç', color: '#2196f3' },
      { type: 'vehicle_red', icon: '🚗', label: 'Kırmızı Araç', color: '#f44336' },
      { type: 'vehicle_green', icon: '🚗', label: 'Yeşil Araç', color: '#4caf50' },
      { type: 'vehicle_emergency', icon: '🚑', label: 'Acil Durum Aracı', color: '#ff1744' }
    ]
  },
  {
    name: 'buildings',
    title: 'Binalar',
    items: [
      { type: CellType.BUILDING_RESIDENTIAL, icon: '🏠', label: 'Konut', color: '#ffd54f' },
      { type: CellType.BUILDING_COMMERCIAL, icon: '🏢', label: 'İşyeri', color: '#90a4ae' }
    ]
  }
];