export interface Resource {
  id: string;
  name: string;
  value: number;
  max: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'critical' | 'warning' | 'optimal';
}

export interface ISRUModule {
  id: string;
  name: string;
  type: 'regolith' | 'atmosphere' | 'ice';
  efficiency: number;
  powerConsumption: number;
  outputRate: number;
  status: 'active' | 'idle' | 'maintenance';
}

export interface HabitatZone {
  id: string;
  name: string;
  type: 'residential' | 'greenhouse' | 'laboratory' | 'power-plant';
  population: number;
  oxygenLevel: number;
  temperature: number;
  integrity: number;
}
