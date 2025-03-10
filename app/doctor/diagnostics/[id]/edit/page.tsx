"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { PlusCircle, Trash2, ArrowLeft, Loader2 } from "lucide-react"

type Category = {
  name: string
  questions: string[]
}

type DiagnosticData = {
  id: number
  name: string
  categories: Category[]
  final_messages: string[]
  schedule_days: string[]
  notification_time: string
  duration_days: number
  chat_id: string
}

const DAYS_MAP = {
  monday: "Luni",
  tuesday: "Marți",
  wednesday: "Miercuri",
  thursday: "Joi",
  friday: "Vineri",
  saturday: "Sâmbătă",
  sunday: "Duminică",
}

const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function EditDiagnosticPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    categories: [{ name: "", questions: [""] }] as Category[],
    finalMessages: [""],
    scheduleDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    notificationTime: "09:00",
    durationDays: 7,
  })

  useEffect(() => {
    if (user) {
      fetchDiagnostic()
    }
  }, [user, params.id])

  const fetchDiagnostic = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("diagnostics")
        .select("*")
        .eq("id", params.id)
        .eq("doctor_id", user?.id)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        toast.error("Diagnosticul nu a fost găsit")
        router.push("/doctor/diagnostics")
        return
      }

      setDiagnostic(data)

      // Convertim datele pentru formular
      const scheduleDaysObj = ALL_DAYS.reduce(
        (acc, day) => {
          acc[day as keyof typeof formData.scheduleDays] = data.schedule_days.includes(day)
          return acc
        },
        {} as Record<string, boolean>,
      )

      setFormData({
        name: data.name,
        categories: data.categories || [{ name: "", questions: [""] }],
        finalMessages: data.final_messages || [""],
        scheduleDays: scheduleDaysObj,
        notificationTime: data.notification_time || "09:00",
        durationDays: data.duration_days || 7,
      })
    } catch (error) {
      console.error("Error fetching diagnostic:", error)
      toast.error("Nu s-a putut încărca diagnosticul")
      router.push("/doctor/diagnostics")
    } finally {
      setLoading(false)
    }
  }

  const addCategory = () => {
    setFormData({
      ...formData,
      categories: [...formData.categories, { name: "", questions: [""] }],
    })
  }

  const removeCategory = (categoryIndex: number) => {
    const newCategories = [...formData.categories]
    newCategories.splice(categoryIndex, 1)
    setFormData({ ...formData, categories: newCategories })
  }

  const updateCategory = (categoryIndex: number, name: string) => {
    const newCategories = [...formData.categories]
    newCategories[categoryIndex].name = name
    setFormData({ ...formData, categories: newCategories })
  }

  const addQuestion = (categoryIndex: number) => {
    const newCategories = [...formData.categories]
    newCategories[categoryIndex].questions.push("")
    setFormData({ ...formData, categories: newCategories })
  }

  const removeQuestion = (categoryIndex: number, questionIndex: number) => {
    const newCategories = [...formData.categories]
    newCategories[categoryIndex].questions.splice(questionIndex, 1)
    setFormData({ ...formData, categories: newCategories })
  }

  const updateQuestion = (categoryIndex: number, questionIndex: number, text: string) => {
    const newCategories = [...formData.categories]
    newCategories[categoryIndex].questions[questionIndex] = text
    setFormData({ ...formData, categories: newCategories })
  }

  const addFinalMessage = () => {
    setFormData({
      ...formData,
      finalMessages: [...formData.finalMessages, ""],
    })
  }

  const removeFinalMessage = (index: number) => {
    const newMessages = [...formData.finalMessages]
    newMessages.splice(index, 1)
    setFormData({
      ...formData,
      finalMessages: newMessages,
    })
  }

  const updateFinalMessage = (index: number, message: string) => {
    const newMessages = [...formData.finalMessages]
    newMessages[index] = message
    setFormData({
      ...formData,
      finalMessages: newMessages,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validări
      if (!formData.name.trim()) {
        throw new Error("Numele diagnosticului este obligatoriu")
      }

      if (!formData.categories.length) {
        throw new Error("Adăugați cel puțin o categorie")
      }

      for (const category of formData.categories) {
        if (!category.name.trim()) {
          throw new Error("Toate categoriile trebuie să aibă un nume")
        }
        if (!category.questions.length || category.questions.some((q) => !q.trim())) {
          throw new Error("Toate categoriile trebuie să aibă cel puțin o întrebare completată")
        }
      }

      if (!formData.finalMessages.length || formData.finalMessages.some((m) => !m.trim())) {
        throw new Error("Adăugați cel puțin un mesaj final valid")
      }

      const scheduleDays = Object.entries(formData.scheduleDays)
        .filter(([_, value]) => value)
        .map(([day]) => day)

      if (!scheduleDays.length) {
        throw new Error("Selectați cel puțin o zi pentru programare")
      }

      if (!diagnostic) {
        throw new Error("Datele diagnosticului nu sunt disponibile")
      }

      const updatedData = {
        name: formData.name,
        categories: formData.categories,
        final_messages: formData.finalMessages,
        schedule_days: scheduleDays,
        notification_time: formData.notificationTime,
        duration_days: formData.durationDays,
      }

      const { error } = await supabase.from("diagnostics").update(updatedData).eq("id", diagnostic.id)

      if (error) {
        throw error
      }

      toast.success("Diagnostic actualizat cu succes!")
      router.push("/doctor/diagnostics")
    } catch (error) {
      console.error("Error updating diagnostic:", error)
      const message = error instanceof Error ? error.message : "Eroare la actualizarea diagnosticului"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/doctor/diagnostics")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Editare Diagnostic</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Editare Diagnostic: {diagnostic?.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nume Diagnostic */}
            <div className="space-y-2">
              <Label htmlFor="name">Nume Diagnostic</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Introduceți numele diagnosticului"
                required
              />
            </div>

            {/* Categorii și Întrebări */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Categorii și Întrebări de Monitorizare</Label>
                <Button type="button" variant="outline" onClick={addCategory}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adaugă Categorie
                </Button>
              </div>

              {formData.categories.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={category.name}
                        onChange={(e) => updateCategory(categoryIndex, e.target.value)}
                        placeholder={`Categoria ${categoryIndex + 1}`}
                        required
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeCategory(categoryIndex)}
                        disabled={formData.categories.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {category.questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="flex items-center gap-2">
                          <Input
                            value={question}
                            onChange={(e) => updateQuestion(categoryIndex, questionIndex, e.target.value)}
                            placeholder={`Întrebarea ${questionIndex + 1}`}
                            required
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeQuestion(categoryIndex, questionIndex)}
                            disabled={category.questions.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addQuestion(categoryIndex)}
                        className="mt-2"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adaugă Întrebare
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Mesaje Finale */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Mesaje Finale de Întrebări</Label>
                <Button type="button" variant="outline" onClick={addFinalMessage}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adaugă Mesaj
                </Button>
              </div>
              <div className="space-y-2">
                {formData.finalMessages.map((message, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Textarea
                      value={message}
                      onChange={(e) => updateFinalMessage(index, e.target.value)}
                      placeholder={`Mesajul final ${index + 1}`}
                      required
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeFinalMessage(index)}
                      disabled={formData.finalMessages.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Aceste mesaje vor fi afișate aleatoriu după ce pacientul răspunde la toate întrebările din ziua
                respectivă.
              </p>
            </div>

            {/* Zile Programate */}
            <div className="space-y-2">
              <Label>Zile Programate</Label>
              <div className="flex flex-wrap gap-4">
                {Object.entries(formData.scheduleDays).map(([day, checked]) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={checked}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          scheduleDays: {
                            ...formData.scheduleDays,
                            [day]: checked === true,
                          },
                        })
                      }
                    />
                    <Label htmlFor={day} className="capitalize">
                      {DAYS_MAP[day as keyof typeof DAYS_MAP]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Ora Notificărilor */}
            <div className="space-y-2">
              <Label htmlFor="notificationTime">Ora Notificărilor</Label>
              <Input
                id="notificationTime"
                type="time"
                value={formData.notificationTime}
                onChange={(e) => setFormData({ ...formData, notificationTime: e.target.value })}
                required
              />
            </div>

            {/* Durata */}
            <div className="space-y-2">
              <Label htmlFor="durationDays">Durata (zile)</Label>
              <Input
                id="durationDays"
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: Number.parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/doctor/diagnostics")}
                disabled={saving}
              >
                Anulare
              </Button>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  "Salvează Modificările"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

