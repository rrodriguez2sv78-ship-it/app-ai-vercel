/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Administrador' | 'Supervisor' | 'Auxiliar';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarColor: string;
  password?: string;
}

export type AuditStage = 'Pendiente' | 'En curso' | 'Cerrada' | 'Atrasada';

export interface AuditItem {
  id: string;
  criterionText: string;
  sType: '1ª S' | '2ª S' | '3ª S' | '4ª S' | '5ª S';
  complies: boolean | null; // true = Sí, false = No, null = Not answered
  comment: string;
  photo?: string; // base64 string
}

export interface Audit {
  id: string;
  area: string;
  status: AuditStage;
  createdAt: string; // ISO String
  completedAt?: string;
  score: number; // percentage
  creator: User;
  assignedTo: User;
  observations: string;
  solutionTime: string; // e.g., "24 horas", "48 horas", "72 horas"
  items: AuditItem[];
  actionPlans: ActionPlan[];
  resolutionCode?: string; // unique resolution code generated (e.g. "RES-5847")
  isResolved?: boolean; // whether resolution was provided
  resolvedAt?: string; // when it was resolved
  resolutionComments?: string; // comments describing the general resolution
}

export interface ActionPlan {
  id: string;
  itemText: string;
  sTypeId: string;
  failureDetail: string;
  correctiveAction: string;
  responsible: string;
  deadline: string;
  status: 'Pendiente' | 'Resuelto';
  evidencePhoto?: string; // base64 response of solution
}

export interface SStepConfig {
  id: string;
  sType: '1ª S' | '2ª S' | '3ª S' | '4ª S' | '5ª S';
  title: string;
  criteria: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string; // e.g., "10 min ago" or full timestamp
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export interface AreaCompliance {
  area: string;
  average: number; // 0 - 100
  totalAudits: number;
  totalPlanes: number;
}
