"use client"

import type React from "react"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { dbKey, loadDb, saveDb, type DB, type Student, type AttendanceStatus, waLink } from "@/lib/db"

export default function TeacherDashboard({ teacherId }: { teacherId: string }) {
  const { data: db, mutate } = useSWR<DB>(dbKey, loadDb, { fallbackData: loadDb() })
  const [tab, setTab] = useState<"siswa" | "kehadiran" | "pelanggaran" | "prestasi_nilai" | "rekap" | "pengumuman">(
    "siswa",
  )

  const students = db?.students || []
  const selectedStudentIdDefault = students[0]?.id || ""
  const [selectedStudentId, setSelectedStudentId] = useState<string>(selectedStudentIdDefault)

  const selectedStudent = useMemo(() => students.find((s) => s.id === selectedStudentId), [students, selectedStudentId])

  if (!db) return <div>Memuat...</div>

  const setDb = (next: DB) => {
    saveDb(next)
    mutate(next, { revalidate: false })
  }

  // Siswa: Tambah/Update
  const onSubmitStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const id = String(f.get("id") || "")
    const payload: Student = {
      id: id || crypto.randomUUID(),
      name: String(f.get("name") || ""),
      nisn: String(f.get("nisn") || ""),
      birthPlace: String(f.get("birthPlace") || ""),
      birthDate: String(f.get("birthDate") || ""),
      waliKelas: String(f.get("waliKelas") || ""),
      photoUrl: String(f.get("photoUrl") || ""),
      parentWa: String(f.get("parentWa") || ""),
    }
    const password = String(f.get("password") || "")
    const exists = db.students.some((s) => s.id === payload.id)
    const nextStudents = exists
      ? db.students.map((s) => (s.id === payload.id ? payload : s))
      : [...db.students, payload]
    // update password map
    const pEntry = { role: "siswa" as const, userId: payload.id, password }
    const hasPass = db.passwords.find((p) => p.role === "siswa" && p.userId === payload.id)
    const nextPasswords = password
      ? hasPass
        ? db.passwords.map((p) => (p.role === "siswa" && p.userId === payload.id ? pEntry : p))
        : [...db.passwords, pEntry]
      : db.passwords
    setDb({ ...db, students: nextStudents, passwords: nextPasswords })
    ;(e.target as HTMLFormElement).reset()
  }

  // Kehadiran: input harian
  const onSubmitAttendance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const studentId = String(f.get("studentId") || "")
    const date = String(f.get("date") || "")
    const status = String(f.get("status") || "hadir") as AttendanceStatus
    const rec = { id: crypto.randomUUID(), studentId, date, status }
    setDb({ ...db, attendance: [...db.attendance, rec] })
    ;(e.target as HTMLFormElement).reset()
  }

  // Pelanggaran: input + WA realtime
  const onSubmitViolation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const studentId = String(f.get("studentId") || "")
    const type = String(f.get("type") || "")
    const score = Number(f.get("score") || 0)
    const rec = { id: crypto.randomUUID(), studentId, type, score, date: new Date().toISOString().slice(0, 10) }
    setDb({ ...db, violations: [...db.violations, rec] })

    const student = db.students.find((s) => s.id === studentId)
    if (student?.parentWa) {
      const msg = `Assalamualaikum, orang tua/wali ${student.name}. Terdapat pelanggaran: ${type} (skor ${score}) pada tanggal ${rec.date}. Mohon perhatian.`
      const href = waLink(student.parentWa, msg)
      window.open(href, "_blank", "noopener,noreferrer")
    }
    ;(e.target as HTMLFormElement).reset()
  }

  // Prestasi
  const onSubmitAchievement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const studentId = String(f.get("studentId") || "")
    const title = String(f.get("title") || "")
    const date = String(f.get("date") || "")
    const rec = { id: crypto.randomUUID(), studentId, title, date }
    setDb({ ...db, achievements: [...db.achievements, rec] })
    ;(e.target as HTMLFormElement).reset()
  }

  // Nilai harian
  const onSubmitGrade = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const studentId = String(f.get("studentId") || "")
    const subject = String(f.get("subject") || "")
    const score = Number(f.get("score") || 0)
    const date = String(f.get("date") || "")
    const rec = { id: crypto.randomUUID(), studentId, subject, score, date }
    setDb({ ...db, grades: [...db.grades, rec] })
    ;(e.target as HTMLFormElement).reset()
  }

  // Rekap bulanan tidak menyimpan data terpisah—otomatis dari kehadiran
  const monthOptions = Array.from({ length: 12 }, (_, i) => i)

  // Pengumuman
  const onSubmitAnnouncement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const message = String(f.get("message") || "")
    const date = new Date().toISOString().slice(0, 16).replace("T", " ")
    const rec = { id: crypto.randomUUID(), message, date }
    setDb({ ...db, announcements: [rec, ...db.announcements] })
    ;(e.target as HTMLFormElement).reset()
  }

  const attendByMonth = (studentId: string, year: number, month0: number) => {
    const ym = `${year}-${String(month0 + 1).padStart(2, "0")}`
    const rows = db.attendance.filter((a) => a.studentId === studentId && a.date.startsWith(ym))
    return {
      hadir: rows.filter((r) => r.status === "hadir").length,
      izin: rows.filter((r) => r.status === "izin").length,
      sakit: rows.filter((r) => r.status === "sakit").length,
      alpha: rows.filter((r) => r.status === "alpha").length,
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={tab === "siswa" ? "default" : "secondary"} onClick={() => setTab("siswa")}>
          Data Siswa
        </Button>
        <Button variant={tab === "kehadiran" ? "default" : "secondary"} onClick={() => setTab("kehadiran")}>
          Kehadiran
        </Button>
        <Button variant={tab === "pelanggaran" ? "default" : "secondary"} onClick={() => setTab("pelanggaran")}>
          Pelanggaran
        </Button>
        <Button variant={tab === "prestasi_nilai" ? "default" : "secondary"} onClick={() => setTab("prestasi_nilai")}>
          Prestasi & Nilai
        </Button>
        <Button variant={tab === "rekap" ? "default" : "secondary"} onClick={() => setTab("rekap")}>
          Rekap Bulanan
        </Button>
        <Button variant={tab === "pengumuman" ? "default" : "secondary"} onClick={() => setTab("pengumuman")}>
          Pengumuman
        </Button>
      </div>

      {tab === "siswa" && (
        <Card className="p-4 grid gap-4">
          <h3 className="text-lg font-semibold">Tambah/Update Siswa</h3>
          <form className="grid sm:grid-cols-2 gap-4" onSubmit={onSubmitStudent}>
            <div className="grid gap-1">
              <Label htmlFor="id">ID (opsional untuk update)</Label>
              <Input id="id" name="id" placeholder="Kosongkan untuk tambah baru" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="nisn">NISN</Label>
              <Input id="nisn" name="nisn" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="birthPlace">Tempat Lahir</Label>
              <Input id="birthPlace" name="birthPlace" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="birthDate">Tanggal Lahir</Label>
              <Input id="birthDate" name="birthDate" type="date" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="waliKelas">Wali Kelas</Label>
              <Input id="waliKelas" name="waliKelas" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="photoUrl">URL Foto</Label>
              <Input id="photoUrl" name="photoUrl" placeholder="https://..." />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="parentWa">No. WA Orangtua (62...)</Label>
              <Input id="parentWa" name="parentWa" placeholder="62812xxxxxxx" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">Password Siswa</Label>
              <Input id="password" name="password" type="password" placeholder="********" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">Simpan</Button>
            </div>
          </form>

          <div className="mt-2">
            <h4 className="font-medium mb-2">Daftar Siswa</h4>
            <ul className="text-sm grid gap-2">
              {students.length === 0 ? <li className="text-muted-foreground">Belum ada data</li> : null}
              {students.map((s) => (
                <li key={s.id} className="flex items-center justify-between border rounded-lg p-2">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-muted-foreground">
                      {s.nisn || "-"} • Wali Kelas: {s.waliKelas || "-"}
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => setSelectedStudentId(s.id)}>
                    Pilih
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {tab === "kehadiran" && (
        <Card className="p-4 grid gap-4">
          <h3 className="text-lg font-semibold">Input Kehadiran Harian</h3>
          <form className="grid sm:grid-cols-4 gap-4" onSubmit={onSubmitAttendance}>
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor="studentId">Siswa</Label>
              <select id="studentId" name="studentId" required className="h-10 rounded-md border bg-background px-3">
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="date">Tanggal</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                required
                className="h-10 rounded-md border bg-background px-3 capitalize"
              >
                <option value="hadir">hadir</option>
                <option value="izin">izin</option>
                <option value="sakit">sakit</option>
                <option value="alpha">alpha</option>
              </select>
            </div>
            <div className="sm:col-span-4 flex justify-end">
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      {tab === "pelanggaran" && (
        <Card className="p-4 grid gap-4">
          <h3 className="text-lg font-semibold">Input Pelanggaran (WA Realtime)</h3>
          <form className="grid sm:grid-cols-4 gap-4" onSubmit={onSubmitViolation}>
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor="studentId">Siswa</Label>
              <select id="studentId" name="studentId" required className="h-10 rounded-md border bg-background px-3">
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="type">Jenis Pelanggaran</Label>
              <Input id="type" name="type" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="score">Skor</Label>
              <Input id="score" name="score" type="number" min={0} required />
            </div>
            <div className="sm:col-span-4 flex justify-end">
              <Button type="submit">Simpan & Kirim WA</Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground">Pastikan nomor WA orangtua menggunakan awalan 62 dan benar.</p>
        </Card>
      )}

      {tab === "prestasi_nilai" && (
        <Card className="p-4 grid gap-6">
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Input Prestasi</h3>
            <form className="grid sm:grid-cols-4 gap-4" onSubmit={onSubmitAchievement}>
              <div className="grid gap-1 sm:col-span-2">
                <Label htmlFor="studentId">Siswa</Label>
                <select id="studentId" name="studentId" required className="h-10 rounded-md border bg-background px-3">
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="title">Judul/Deskripsi</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="date">Tanggal</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="sm:col-span-4 flex justify-end">
                <Button type="submit">Simpan Prestasi</Button>
              </div>
            </form>
          </div>

          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Input Nilai Harian</h3>
            <form className="grid sm:grid-cols-5 gap-4" onSubmit={onSubmitGrade}>
              <div className="grid gap-1 sm:col-span-2">
                <Label htmlFor="studentId">Siswa</Label>
                <select id="studentId" name="studentId" required className="h-10 rounded-md border bg-background px-3">
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="subject">Mata Pelajaran</Label>
                <Input id="subject" name="subject" required />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="score">Nilai</Label>
                <Input id="score" name="score" type="number" step="1" min={0} max={100} required />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="date">Tanggal</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="sm:col-span-5 flex justify-end">
                <Button type="submit">Simpan Nilai</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {tab === "rekap" && (
        <Card className="p-4 grid gap-4">
          <h3 className="text-lg font-semibold">Rekap Kehadiran Bulanan</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="grid gap-1">
              <Label>Siswa</Label>
              <select
                className="h-10 rounded-md border bg-background px-3"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <Label>Bulan</Label>
              <select className="h-10 rounded-md border bg-background px-3" id="month">
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m, 1).toLocaleString("id-ID", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <Label>Tahun</Label>
              <Input id="year" type="number" defaultValue={new Date().getFullYear()} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {(() => {
              const mSel = Number((document.getElementById("month") as HTMLSelectElement | null)?.value ?? 0)
              const ySel = Number(
                (document.getElementById("year") as HTMLInputElement | null)?.value ?? new Date().getFullYear(),
              )
              const rec = attendByMonth(selectedStudentId, ySel, mSel)
              return (
                <>
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Hadir</div>
                    <div className="text-lg font-semibold">{rec.hadir}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Izin</div>
                    <div className="text-lg font-semibold">{rec.izin}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Sakit</div>
                    <div className="text-lg font-semibold">{rec.sakit}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Alpha</div>
                    <div className="text-lg font-semibold">{rec.alpha}</div>
                  </div>
                </>
              )
            })()}
          </div>
          <p className="text-xs text-muted-foreground">Ubah bulan/tahun di atas untuk melihat rekap.</p>
        </Card>
      )}

      {tab === "pengumuman" && (
        <Card className="p-4 grid gap-4">
          <h3 className="text-lg font-semibold">Buat Pengumuman</h3>
          <form className="grid gap-3" onSubmit={onSubmitAnnouncement}>
            <div className="grid gap-1">
              <Label htmlFor="message">Pengumuman</Label>
              <Textarea id="message" name="message" placeholder="Tulis pengumuman di sini..." required />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Kirim</Button>
            </div>
          </form>

          <div className="mt-2">
            <h4 className="font-medium mb-2">Riwayat Pengumuman</h4>
            <ul className="text-sm grid gap-2">
              {db.announcements.length === 0 ? <li className="text-muted-foreground">Belum ada pengumuman</li> : null}
              {db.announcements.map((a) => (
                <li key={a.id} className="flex items-center justify-between border rounded-lg p-2">
                  <div>{a.message}</div>
                  <div className="text-muted-foreground">{a.date}</div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  )
}
