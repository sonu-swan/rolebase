import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

type Role = 'General User' | 'Admin';
interface User { id: string; name: string; email: string; role: Role; salt: string; hash: string; createdAt: string; }

// ---- Simple local storage: one JSON file (swap these 2 functions for Mongo/DynamoDB later) ----
const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');
const hashPw = (pw: string, salt: string) => crypto.scryptSync(pw, salt, 32).toString('hex');
const makeUser = (id: string, name: string, email: string, role: Role, pw: string): User => {
  const salt = crypto.randomBytes(8).toString('hex');
  return { id, name, email, role, salt, hash: hashPw(pw, salt), createdAt: new Date().toISOString() };
};
function loadUsers(): User[] {
  if (!fs.existsSync(DB_FILE)) {
    saveUsers([
      makeUser('admin', 'Asha Admin', 'admin@demo.com', 'Admin', 'admin123'),
      makeUser('user1', 'Uma User', 'user1@demo.com', 'General User', 'user123'),
    ]);
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function saveUsers(u: User[]) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(u, null, 2));
}
const safe = ({ salt, hash, ...rest }: User) => rest;

// ---- Dummy records with access levels ----
const RECORDS = [
  { id: 1, title: 'Company holiday list', owner: 'HR', accessLevel: 'Public' },
  { id: 2, title: 'Office Wi-Fi guide', owner: 'IT', accessLevel: 'Public' },
  { id: 3, title: 'Team roadmap Q4', owner: 'Product', accessLevel: 'Internal' },
  { id: 4, title: 'Vendor contract list', owner: 'Finance', accessLevel: 'Internal' },
  { id: 5, title: 'Salary bands', owner: 'HR', accessLevel: 'Confidential' },
  { id: 6, title: 'Security audit report', owner: 'Security', accessLevel: 'Confidential' },
];
const ALLOWED: Record<Role, string[]> = {
  'General User': ['Public', 'Internal'],
  Admin: ['Public', 'Internal', 'Confidential'],
};

// ---- Helpers ----
const sessions = new Map<string, string>(); // token -> user id
const wait = (req: Request) => new Promise(r => setTimeout(r, Math.min(Math.max(Number(req.query.delay) || 0, 0), 10000)));
type H = (req: Request, res: Response) => Promise<void> | void;
const h = (fn: H) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res)).catch(next);

function auth(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const user = loadUsers().find(u => u.id === sessions.get(token));
  if (!user) return void res.status(401).json({ message: 'Please log in again.' });
  (req as any).user = user;
  next();
}
function adminOnly(req: Request, res: Response, next: NextFunction) {
  if ((req as any).user.role !== 'Admin') return void res.status(403).json({ message: 'Admins only.' });
  next();
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', h(async (req, res) => {
  const { userId, password, role } = req.body || {};
  const user = loadUsers().find(u => u.id === userId);
  if (!user || hashPw(String(password || ''), user.salt) !== user.hash || user.role !== role) {
    return void res.status(401).json({ message: 'Wrong user ID, password or role.' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, user.id);
  res.json({ token, user: safe(user) });
}));

// Public sign-up. Always creates a "General User" - nobody can make themselves Admin from here.
app.post('/api/register', h(async (req, res) => {
  const { id, name, email, password } = req.body || {};
  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(String(id || ''))) return void res.status(400).json({ message: 'User ID must be 3-30 letters, numbers, dot, dash or underscore.' });
  if (!name || String(password || '').length < 6) return void res.status(400).json({ message: 'Name is required and the password needs 6+ characters.' });
  const users = loadUsers();
  if (users.some(u => u.id === id)) return void res.status(409).json({ message: 'That User ID is taken.' });
  users.push(makeUser(id, String(name).slice(0, 60), String(email || '').slice(0, 80), 'General User', password));
  saveUsers(users);
  res.status(201).json({ ok: true });
}));

app.get('/api/me', auth, h(async (req, res) => { await wait(req); res.json(safe((req as any).user)); }));

app.get('/api/records', auth, h(async (req, res) => {
  await wait(req);
  const role: Role = (req as any).user.role;
  const rows = RECORDS.filter(r => ALLOWED[role].includes(r.accessLevel));
  res.json({ allowedLevels: ALLOWED[role], hidden: RECORDS.length - rows.length, records: rows });
}));

// ---- Admin: manage users ----
app.get('/api/users', auth, adminOnly, h(async (req, res) => { await wait(req); res.json(loadUsers().map(safe)); }));

app.post('/api/users', auth, adminOnly, h(async (req, res) => {
  await wait(req);
  const { id, name, email, role, password } = req.body || {};
  if (!id || !name || !password || !['Admin', 'General User'].includes(role)) return void res.status(400).json({ message: 'ID, name, password and a valid role are required.' });
  const users = loadUsers();
  if (users.some(u => u.id === id)) return void res.status(409).json({ message: 'User ID already exists.' });
  users.push(makeUser(id, name, email || '', role, password));
  saveUsers(users);
  res.status(201).json({ ok: true });
}));

app.put('/api/users/:id', auth, adminOnly, h(async (req, res) => {
  await wait(req);
  const users = loadUsers(); const u = users.find(x => x.id === req.params.id);
  if (!u) return void res.status(404).json({ message: 'User not found.' });
  const { name, email, role, password } = req.body || {};
  if (name) u.name = name; if (email !== undefined) u.email = email;
  if (['Admin', 'General User'].includes(role)) u.role = role;
  if (password) u.hash = hashPw(password, u.salt);
  saveUsers(users); res.json(safe(u));
}));

app.delete('/api/users/:id', auth, adminOnly, h(async (req, res) => {
  await wait(req);
  if (req.params.id === (req as any).user.id) return void res.status(400).json({ message: 'You cannot delete yourself.' });
  const users = loadUsers(); const rest = users.filter(u => u.id !== req.params.id);
  if (rest.length === users.length) return void res.status(404).json({ message: 'User not found.' });
  saveUsers(rest); res.json({ ok: true });
}));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => res.status(500).json({ message: err.message }));
app.listen(3000, () => console.log('API on http://localhost:3000'));
