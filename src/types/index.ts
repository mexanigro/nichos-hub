export type UserRole = "owner" | "seller";

export interface HubUser {
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export type ClientStatus = "active" | "suspended" | "trial" | "maintenance" | "archived";

export interface Client {
  id: string;
  businessName: string;
  niche: string;
  deployUrl: string;
  activationDate: Date;
  status: ClientStatus;
  adminEmail: string;
  clientId: string;
  vercelProjectId?: string;
  notes?: string;
}

export type HealthStatus = "healthy" | "degraded" | "down";

export interface ClientWithHealth extends Client {
  healthStatus: HealthStatus;
  lastIncident?: {
    id: number;
    severity: string;
    description: string;
    createdAt: Date;
  };
  uptimeLast24h?: number;
}

export type MessageCategory = "maintenance" | "support" | "conversation";
export type MessageStatus = "new" | "read";
export type MessageSender = "client" | "provider";

export interface ProviderMessage {
  id: string;
  clientId: string;
  businessName: string;
  message: string;
  createdAt: Date;
  status: MessageStatus;
  category?: MessageCategory;
  categoryReason?: string;
  sender: MessageSender;
  parentId?: string;
}

export type ProspectStatus = "following" | "rejected" | "closed";

export interface Prospect {
  id: string;
  businessName: string;
  city: string;
  nicheTarget: string;
  assignedSeller: string;
  lastContact: Date;
  notes: ProspectNote[];
  status: ProspectStatus;
  rejectionReason?: string;
  createdBy: string;
  createdAt: Date;
}

export interface ProspectNote {
  text: string;
  author: string;
  createdAt: Date;
}

export type Severity = "warning" | "critical";
export type CheckType = "http" | "api" | "firestore" | "booking";

export interface Incident {
  id: number;
  clientId: string;
  severity: Severity;
  checkType: CheckType;
  description: string;
  claudeDiagnosis?: string;
  actionTaken?: string;
  resolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Metric {
  id: number;
  clientId: string;
  checkType: CheckType;
  responseTimeMs: number | null;
  statusCode: number | null;
  success: boolean;
  error: string | null;
  checkedAt: Date;
}

export interface UptimeStats {
  clientId: string;
  last24h: number;
  last7d: number;
  totalChecks24h: number;
  totalChecks7d: number;
}
