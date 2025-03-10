"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

type Diagnostic = {
  id: string
  name: string
  chat_id: string
  created_at: string
}

export default function DiagnosticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchDiagnostics()
    }
  }, [user])

  const fetchDiagnostics = async () => {
    try {
      setLoading(true)
      console.log("Starting diagnostics fetch...")

      const { data, error } = await supabase
        .from("diagnostics")
        .select("id, name, chat_id, created_at")
        .eq("doctor_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase query error:", error)
        throw error
      }

      console.log("Fetched diagnostics:", data)
      setDiagnostics(data || [])
    } catch (error) {
      console.error("Error fetching diagnostics:", error)
      toast.error("Nu s-au putut încărca diagnosticele")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/doctor/diagnostics/${id}/edit`)
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      console.log("Attempting to delete diagnostic:", id)

      const { error } = await supabase.from("diagnostics").delete().eq("id", id)

      if (error) {
        console.error("Delete error:", error)
        throw error
      }

      console.log("Successfully deleted diagnostic:", id)
      setDiagnostics(diagnostics.filter((d) => d.id !== id))
      toast.success("Diagnostic șters cu succes")
    } catch (error) {
      console.error("Error deleting diagnostic:", error)
      toast.error("Nu s-a putut șterge diagnosticul")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Diagnostice</h1>
        <Button onClick={() => router.push("/doctor/dashboard")} className="bg-black hover:bg-black/90">
          Creare Diagnostic Nou
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Diagnostice</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : diagnostics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nu aveți niciun diagnostic creat. Creați primul diagnostic din dashboard.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nume</TableHead>
                    <TableHead>ID Chat</TableHead>
                    <TableHead>Data Creării</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnostics.map((diagnostic) => (
                    <TableRow key={diagnostic.id}>
                      <TableCell className="font-medium">{diagnostic.name}</TableCell>
                      <TableCell>{diagnostic.chat_id}</TableCell>
                      <TableCell>
                        {new Date(diagnostic.created_at).toLocaleDateString("ro-RO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(diagnostic.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" disabled={deletingId === diagnostic.id}>
                                {deletingId === diagnostic.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sunteți sigur că doriți să ștergeți acest diagnostic? Această acțiune nu poate fi
                                  anulată.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anulare</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(diagnostic.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Șterge
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

