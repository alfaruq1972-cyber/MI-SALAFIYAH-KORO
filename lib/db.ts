// Utilitas DB lokal + tipe data

export type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpha"

export type Student = {
  id: string
  name: string
  nisn?: string
  birthPlace?: string
  birthDate?: string
  waliKelas?: string
  photoUrl?: string
  parentWa?: string
}

export type Teacher = {
  id: string
  name: string
  waliKelas?: string
  photoUrl?: string
}

export type Attendance = {
  id: string
  studentId: string
  date: string // YYYY-MM-DD
  status: AttendanceStatus
}

export type Violation = {
  id: string
  studentId: string
  type: string
  score: number
  date: string // YYYY-MM-DD
}

export type Achievement = {
  id: string
  studentId: string
  title: string
  date: string // YYYY-MM-DD
}

export type Grade = {
  id: string
  studentId: string
  subject: string
  score: number
  date: string // YYYY-MM-DD
}

export type Announcement = {
  id: string
  message: string
  date: string // YYYY-MM-DD HH:mm
}

export type PasswordMap = {
  role: "siswa" | "guru"
  userId: string
  password: string
}

export type Session = {
  role: "siswa" | "guru"
  userId: string
}

export type DB = {
  students: Student[]
  teachers: Teacher[]
  attendance: Attendance[]
  violations: Violation[]
  achievements: Achievement[]
  grades: Grade[]
  announcements: Announcement[]
  passwords: PasswordMap[]
}

export const dbKey = "mi-koro-db"
const sessionKey = "mi-koro-session"

// Seed awal agar aplikasi langsung bisa dicoba
const initialDb: DB = {
  students: [
    {
      id: "stu-001",
      name: "Budi Santoso",
      nisn: "1234567890",
      birthPlace: "Gresik",
      birthDate: "2014-08-12",
      waliKelas: "Ust. Ahmad",
      photoUrl: "",
      parentWa: "6281234567890",
    },
  ],
  teachers: [
    {
      id: "t-001",
      name: "Guru Admin",
      waliKelas: "Kelas 6",
      photoUrl: "",
    },
  ],
  attendance: [],
  violations: [],
  achievements: [],
  grades: [],
  announcements: [],
  passwords: [
    { role: "guru", userId: "t-001", password: "admin123" },
    { role: "siswa", userId: "stu-001", password: "budi123" },
  ],
}

export function ensureSeed() {
  if (typeof window === "undefined") return
  const raw = localStorage.getItem(dbKey)
  if (!raw) {
    localStorage.setItem(dbKey, JSON.stringify(initialDb))
  }
}

export function loadDb(): DB {
  if (typeof window === "undefined") return initialDb
  const raw = localStorage.getItem(dbKey)
  if (!raw) {
    localStorage.setItem(dbKey, JSON.stringify(initialDb))
    return initialDb
  }
  try {
    return JSON.parse(raw) as DB
  } catch {
    // reset jika korup
    localStorage.setItem(dbKey, JSON.stringify(initialDb))
    return initialDb
  }
}

export function saveDb(next: DB) {
  if (typeof window === "undefined") return
  localStorage.setItem(dbKey, JSON.stringify(next))
}

export function setSession(s: Session) {
  if (typeof window === "undefined") return
  localStorage.setItem(sessionKey, JSON.stringify(s))
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(sessionKey)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem(sessionKey)
}

export function login(params: { role: "siswa" | "guru"; name: string; password: string }):
  | { ok: true }
  | { ok: false; error?: string } {
  const db = loadDb()
  const { role, name, password } = params
  if (role === "guru") {
    const t = db.teachers.find((tt) => tt.name.toLowerCase() === name.toLowerCase())
    if (!t) return { ok: false, error: "Guru tidak ditemukan" }
    const pass = db.passwords.find((p) => p.role === "guru" && p.userId === t.id)
    if (!pass || pass.password !== password) return { ok: false, error: "Sandi salah" }
    setSession({ role: "guru", userId: t.id })
    return { ok: true }
  } else {
    const s = db.students.find((ss) => ss.name.toLowerCase() === name.toLowerCase())
    if (!s) return { ok: false, error: "Siswa tidak ditemukan" }
    const pass = db.passwords.find((p) => p.role === "siswa" && p.userId === s.id)
    if (!pass || pass.password !== password) return { ok: false, error: "Sandi salah" }
    setSession({ role: "siswa", userId: s.id })
    return { ok: true }
  }
}

export function logout() {
  clearSession()
}

// Util buat link WA
export function waLink(phone62: string, message: string) {
  const p = phone62.replace(/[^\d]/g, "")
  const text = encodeURIComponent(message)
  return `https://wa.me/${p}?text=${text}`
}
