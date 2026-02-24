
export enum OrderState {
  IN_PRODUCTION = 'Em Produção',
  COMPLETED = 'Concluída',
  LATE = 'Atrasada',
  BILLED = 'Facturada',
  OPEN = 'Em Aberto'
}

export enum SectorState {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  LATE = 'LATE'
}

export type UserRole = 'admin' | 'viewer';

export interface User {
  username: string;
  role: UserRole;
  name: string;
}

export interface Sector {
  id: string;
  name: string;
  orderIndex: number;
}

export interface Order {
  id:string;
  docNr: string;
  clientCode: string;
  clientName: string;
  issueDate: Date | null;
  requestedDate: Date | null;
  itemNr: number;
  po: string;
  articleCode: string;
  reference: string;
  colorCode: string;
  colorDesc: string;
  size: string;
  family: string;
  sizeDesc: string;
  ean: string;
  qtyRequested: number;
  dataTec: Date | null;
  
  // Sectors
  felpoCruQty: number;
  felpoCruDate: Date | null;
  tinturariaQty: number;
  tinturariaDate: Date | null;
  confRoupoesQty: number;
  confFelposQty: number;
  confDate: Date | null;
  embAcabQty: number;
  armExpDate: Date | null;
  stockCxQty: number;
  dataEnt: Date | null;
  
  // Special Dates
  dataEspecial: Date | null;
  dataPrinter: Date | null;
  dataDebuxo: Date | null;
  dataAmostras: Date | null;
  dataBordados: Date | null;
  
  // Status
  qtyBilled: number;
  qtyOpen: number;
  
  // Priority (0=None, 1=High/Red, 2=Medium/Orange, 3=Low/Yellow)
  priority?: number;

  // Manual Confection Flag
  isManual?: boolean;

  // Stop Reasons per Sector
  sectorStopReasons?: Record<string, string>;

  // Observations
  sectorObservations?: Record<string, string>;

  // Sector Predicted Dates (New field)
  sectorPredictedDates?: Record<string, Date | null>;
  
  // Raw data from excel for round-trip capability
  _raw?: Record<string, any>;
}

export interface ImportLog {
  id: string;
  timestamp: Date;
  filename: string;
  user: string;
  recordsCount: number;
}

export interface DashboardKPIs {
  totalActiveDocs: number;
  totalLate: number;
  deliveriesThisWeek: number;
  fulfillmentRateWeek: number;
  totalInProduction: number;
  billedVsOpen: { billed: number; open: number };
}
