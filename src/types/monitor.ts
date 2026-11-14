export type MonitorMode = 'normal' | 'enhanced'
export interface MonitorStatus {
  state: 'stopped' | 'starting' | 'ready' | 'recovering' | 'unavailable'
  mode: MonitorMode | null
}
