"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, logout } from "@/lib/db"
import { Button } from "@/components/ui/button"
import StudentDashboard from "@/components/student-dashboard"
import TeacherDashboard from "@/components/teacher-dashboard"

// Dashboard: merender sesuai role
export default function DashboardPage() {
  const router = useRouter()
  const [role, setRole] = useState<"siswa" | "guru" | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.replace("/")
      return
    }
    setRole(s.role)
    setUserId(s.userId)
  }, [router])

  if (!role || !userId) {
    return <main className="p-6">Memuat...</main>
  }

  const onLogout = () => {
    logout()
    router.replace("/")
  }

  return (
    <main className="min-h-dvh">
      <header className="w-full border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">MI Salafiyah Koro</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground capitalize">{role}</span>
            <Button variant="secondary" onClick={onLogout}>
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-6">
        {role === "siswa" ? <StudentDashboard studentId={userId} /> : <TeacherDashboard teacherId={userId} />}
      </section>
    </main>
  )
}
