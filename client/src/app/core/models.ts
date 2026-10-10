export type Role = 'General User' | 'Admin';
export interface User { id: string; name: string; email: string; role: Role; createdAt: string; }
export interface RecordItem { id: number; title: string; owner: string; accessLevel: string; }
export interface RecordsResponse { allowedLevels: string[]; hidden: number; records: RecordItem[]; }
