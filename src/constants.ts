import { Resource, ISRUModule, HabitatZone } from './types';

export const MARS_CONSTANTS = {
  GRAVITY: 3.721, // m/s^2
  ATM_PRESSURE: 0.006, // bar
  AVG_TEMP: -63, // Celsius
  SOL_DURATION: 88775, // seconds (24h 39m 35s)
  currentSol: 42,
};

export const INITIAL_RESOURCES: Resource[] = [
  { id: 'o2', name: 'Oxygen', value: 85, max: 100, unit: '%', trend: 'stable', status: 'optimal' },
  { id: 'h2o', name: 'Water', value: 42, max: 100, unit: 'm³', trend: 'down', status: 'warning' },
  { id: 'pwr', name: 'Power', value: 92, max: 100, unit: 'kW', trend: 'up', status: 'optimal' },
  { id: 'food', name: 'Food', value: 15, max: 100, unit: 'kg', trend: 'down', status: 'critical' },
];

export const INITIAL_ISRU_MODULES: ISRUModule[] = [
  { id: 'moxie-1', name: 'MOXIE-A', type: 'atmosphere', efficiency: 0.95, powerConsumption: 12, outputRate: 0.8, status: 'active' },
  { id: 'regolith-1', name: 'Regolith Extractor', type: 'regolith', efficiency: 0.82, powerConsumption: 25, outputRate: 5.0, status: 'active' },
  { id: 'ice-1', name: 'Subsurface Ice Drill', type: 'ice', efficiency: 0.75, powerConsumption: 40, outputRate: 2.5, status: 'idle' },
];

export const INITIAL_HABITAT_ZONES: HabitatZone[] = [
  { id: 'res-1', name: 'Residential Hub', type: 'residential', population: 12, oxygenLevel: 21, temperature: 22, integrity: 98 },
  { id: 'gh-1', name: 'Hydroponics Lab', type: 'greenhouse', population: 2, oxygenLevel: 25, temperature: 28, integrity: 95 },
  { id: 'lab-1', name: 'Geology Lab', type: 'laboratory', population: 4, oxygenLevel: 21, temperature: 20, integrity: 99 },
  { id: 'pwr-1', name: 'Nuclear Reactor', type: 'power-plant', population: 0, oxygenLevel: 18, temperature: 45, integrity: 92 },
];
