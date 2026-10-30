export type IncidentType =
  | 'fight'
  | 'medical_emergency'
  | 'fire_smoke'
  | 'overcrowding'
  | 'theft'
  | 'other';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type StadiumZone =
  | 'North Stand'
  | 'South Stand'
  | 'East Stand'
  | 'West Stand'
  | 'Gate A'
  | 'Gate B'
  | 'VIP'
  | 'Parking';

export type IncidentStatus = 'active' | 'dispatched' | 'resolving' | 'resolved';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'supporter' | 'operator';
  text: string;
  timestamp: string;
  quickReplies?: string[];
}

export interface RawReport {
  id: string;
  incidentId?: string;
  text: string;
  timestamp: string;
  language: string;
  zone: StadiumZone;
  reporterSource: 'text' | 'voice' | 'photo' | 'quick_button';
  photoUrl?: string;
  exactSeat?: string;
}

export interface IncidentStateMemory {
  incident_type: string;
  ticket_seat: string;
  facts_known: Record<string, any>;
  actions_already_given: string[];
}

export interface Incident {
  id: string;
  incident_type: IncidentType;
  severity: Severity;
  zone: StadiumZone;
  exactSeat: string;
  english_summary: string;
  dashboard_summary?: string;
  recommended_action: string;
  confidence: number;
  reportCount: number;
  firstReportTime: string;
  lastReportTime: string;
  status: IncidentStatus;
  why_merged: string;
  rawReports: RawReport[];
  assignedTeam: string;
  timeToFirstResponseMs: number;
  chatMessages: ChatMessage[];
  operatorTakenOver?: boolean;
  estimatedArrivalMinutes: number;
  lockedLanguage?: 'French' | 'Arabic' | 'English';
  escalate?: boolean;
  stateMemory?: IncidentStateMemory;
}

export interface ZoneCoordinate {
  zone: StadiumZone;
  x: number;
  y: number;
  label: string;
  frenchLabel: string;
  arabicLabel: string;
}

export const REGISTERED_TICKET = {
  gate: 'Gate B',
  block: 'Block 104',
  row: '12',
  seat: '44',
  stand: 'North Stand',
  fullSeatString: 'Gate B • Block 104 • Row 12 • Seat 44 • North Stand',
  zone: 'North Stand' as StadiumZone,
};

export function getLocalizedTicketSeat(lang?: string): string {
  if (lang === 'ar') return 'بوابة B • مدرج 104 • صف 12 • مقعد 44 • المدرج الشمالي';
  if (lang === 'fr') return 'Porte B • Bloc 104 • Rang 12 • Siège 44 • Virage Nord';
  return 'Gate B • Block 104 • Row 12 • Seat 44 • North Stand';
}
