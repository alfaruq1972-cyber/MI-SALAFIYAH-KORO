"use client"

import type React from "react"

import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loadDb, saveDb, dbKey, type DB, type Student } from "@/lib/db"
import { useState } from "react"

export default function StudentDashboard({ studentId }: { studentId: string }) {
  const { data: db, mutate } = useSWR<DB>(dbKey, loadDb, { fallbackData: loadDb() })
  const student = db?.students.find((s) => s.id === studentId)
  const [editing, setEditing] = useState(false)

  if (!db || !student) {
    return <div>Data siswa tidak ditemukan.</div>
  }

  const onSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const updated: Student = {
      ...student,
      name: String(form.get("name") || student.name),
      nisn: String(form.get("nisn") || student.nisn),
      birthPlace: String(form.get("birthPlace") || student.birthPlace),
      birthDate: String(form.get("birthDate") || student.birthDate),
      waliKelas: String(form.get("waliKelas") || student.waliKelas),
      photoUrl: String(form.get("photoUrl") || student.photoUrl),
    }
    const next: DB = { ...db, students: db.students.map((s) => (s.id === student.id ? updated : s)) }
    saveDb(next)
    mutate(next, { revalidate: false })
    setEditing(false)
  }

  const attendance = db.attendance
    .filter((a) => a.studentId === student.id)
    .slice(-20)
    .reverse()
  const violations = db.violations
    .filter((v) => v.studentId === student.id)
    .slice(-20)
    .reverse()
  const achievements = db.achievements
    .filter((a) => a.studentId === student.id)
    .slice(-20)
    .reverse()
  const grades = db.grades
    .filter((g) => g.studentId === student.id)
    .slice(-20)
    .reverse()
  const announcements = db.announcements.slice(-20).reverse()

  // Rekap bulanan sederhana (bulan berjalan)
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const monthly = db.attendance.filter((a) => a.studentId === student.id && a.date.startsWith(ym))
  const count = (st: string) => monthly.filter((m) => m.status === st).length

  return (
    <div className="grid gap-6">
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <img
            src={student.photoUrl || "/placeholder.svg?height=96&width=96&query=Foto%20Profil%20Siswa"}
            alt="Foto profil siswa"
            className="size-24 rounded-lg object-cover"
          />
          <div className="grid gap-1">
            <h2 className="text-xl font-semibold">{student.name}</h2>
            <p className="text-sm text-muted-foreground">NISN: {student.nisn || "-"}</p>
            <p className="text-sm text-muted-foreground">
              TTL: {student.birthPlace || "-"}, {student.birthDate || "-"}
            </p>
            <p className="text-sm text-muted-foreground">Wali Kelas: {student.waliKelas || "-"}</p>
          </div>
          <div className="ms-auto">
            <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
              {editing ? "Batal" : "Edit Profil"}
            </Button>
          </div>
        </div>
        {editing && (
          <form className="grid gap-3 mt-4" onSubmit={onSaveProfile}>
            <div className="grid gap-1">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" defaultValue={student.name} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="nisn">NISN</Label>
              <Input id="nisn" name="nisn" defaultValue={student.nisn} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="birthPlace">Tempat Lahir</Label>
              <Input id="birthPlace" name="birthPlace" defaultValue={student.birthPlace} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="birthDate">Tanggal Lahir</Label>
              <Input id="birthDate" name="birthDate" type="date" defaultValue={student.birthDate || ""} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="waliKelas">Wali Kelas</Label>
              <Input id="waliKelas" name="waliKelas" defaultValue={student.waliKelas} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="photoUrl">URL Foto</Label>
              <Input id="photoUrl" name="photoUrl" defaultValue={student.photoUrl} />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Kehadiran Harian</h3>
          <ul className="text-sm grid gap-2">
            {attendance.length === 0 ? <li className="text-muted-foreground">Belum ada data</li> : null}
            {attendance.map((a) => (
              <li key={a.id} className="flex items-center justify-between border-b border-border/60 py-2">
                <span>{a.date}</span>
                <span className="capitalize">{a.status}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Pelanggaran</h3>
          <ul className="text-sm grid gap-2">
            {violations.length === 0 ? <li className="text-muted-foreground">Belum ada data</li> : null}
            {violations.map((v) => (
              <li key={v.id} className="flex items-center justify-between border-b border-border/60 py-2">
                <span>{v.type}</span>
                <span>Skor: {v.score}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Prestasi</h3>
          <ul className="text-sm grid gap-2">
            {achievements.length === 0 ? <li className="text-muted-foreground">Belum ada data</li> : null}
            {achievements.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-border/60 py-2">
                <span>{p.title}</span>
                <span className="text-muted-foreground">{p.date}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Nilai Harian</h3>
          <ul className="text-sm grid gap-2">
            {grades.length === 0 ? <li className="text-muted-foreground">Belum ada data</li> : null}
            {grades.map((n) => (
              <li key={n.id} className="flex items-center justify-between border-b border-border/60 py-2">
                <span>{n.subject}</span>
                <span>{n.score}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Rekap Kehadiran Bulanan</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Hadir</div>
            <div className="text-lg font-semibold">{count("hadir")}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Izin</div>
            <div className="text-lg font-semibold">{count("izin")}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Sakit</div>
            <div className="text-lg font-semibold">{count("sakit")}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Alpha</div>
            <div className="text-lg font-semibold">{count("alpha")}</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Pengumuman</h3>
        <ul className="text-sm grid gap-2">
          {announcements.length === 0 ? <li className="text-muted-foreground">Belum ada pengumuman</li> : null}
          {announcements.map((a) => (
            <li key={a.id} className="flex items-center justify-between border-b border-border/60 py-2">
              <span>{a.message}</span>
              <span className="text-muted-foreground">{a.date}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
