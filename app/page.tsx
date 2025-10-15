"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ensureSeed, login, getSession } from "@/lib/db"

// Halaman Login: Siswa dan Guru
export default function Page() {
  const router = useRouter()
  const [role, setRole] = useState<"siswa" | "guru">("siswa")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Seed DB jika belum ada
    ensureSeed()
    const session = getSession()
    if (session) {
      router.replace("/dashboard")
    }
  }, [router])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const res = login({ role, name, password })
    if (res.ok) {
      router.replace("/dashboard")
    } else {
      setError(res.error || "Login gagal")
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card text-card-foreground p-6 rounded-xl shadow-sm">
        <h1 className="text-2xl font-semibold text-balance mb-1">MI Salafiyah Koro</h1>
        <p className="text-sm text-muted-foreground mb-6">Aplikasi Informasi Siswa</p>

        <div className="flex bg-muted rounded-lg p-1 mb-6" role="tablist" aria-label="Pilih peran">
          <button
            type="button"
            role="tab"
            aria-selected={role === "siswa"}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-sm",
              role === "siswa" ? "bg-background font-medium" : "opacity-70",
            )}
            onClick={() => setRole("siswa")}
          >
            Siswa
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === "guru"}
            className={cn(
              "flex-1 py-2 px-3 rounded-md text-sm",
              role === "guru" ? "bg-background font-medium" : "opacity-70",
            )}
            onClick={() => setRole("guru")}
          >
            Guru
          </button>
        </div>

        <form className="grid gap-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-2">
            <Label htmlFor="name">Nama {role === "siswa" ? "Siswa" : "Guru"}</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === "siswa" ? "Contoh: Budi Santoso" : "Contoh: Guru Admin"}
              required
              autoComplete="username"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Masuk
          </Button>
          <p className="text-xs text-muted-foreground">
            Catatan: Akun guru awal adalah "Guru Admin" dengan sandi "admin123". Akun siswa dapat dibuat/diatur oleh
            guru.
          </p>
        </form>
      </Card>
    </main>
  )
}
