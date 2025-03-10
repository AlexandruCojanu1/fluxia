"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { PlusCircle, Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { checkSupabaseConnection } from "@/lib/supabase"

type Category = {
  name: string
  questions: string[]
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

export function DiagnosticCreation() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [diagnostic, setDiagnostic] = useState({
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

  const generateChatId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return "CHAT_" + Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
  }

  const addCategory = () => {
    setDiagnostic({
      ...diagnostic,
      categories: [...diagnostic.categories, { name: "", questions: [""] }],
    })
  }

  const removeCategory = (categoryIndex: number) => {
    const newCategories = [...diagnostic.categories]
    newCategories.splice(categoryIndex, 1)
    setDiagnostic({ ...diagnostic, categories: newCategories })
  }

  const updateCategory = (categoryIndex: number, name: string) => {
    const newCategories = [...diagnostic.categories]
    newCategories[categoryIndex].name = name
    setDiagnostic({ ...diagnostic, categories: newCategories })
  }

  const addQuestion = (categoryIndex: number) => {
    const newCategories = [...diagnostic.categories]
    newCategories[categoryIndex].questions.push("")
    setDiagnostic({ ...diagnostic, categories: newCategories })
  }

  const removeQuestion = (categoryIndex: number, questionIndex: number) => {
    const newCategories = [...diagnostic.categories]
    newCategories[categoryIndex].questions.splice(questionIndex, 1)
    setDiagnostic({ ...diagnostic, categories: newCategories })
  }

  const updateQuestion = (categoryIndex: number, questionIndex: number, text: string) => {
    const newCategories = [...diagnostic.categories]
    newCategories[categoryIndex].questions[questionIndex] = text
    setDiagnostic({ ...diagnostic, categories: newCategories })
  }

  const addFinalMessage = () => {
    setDiagnostic({
      ...diagnostic,
      finalMessages: [...diagnostic.finalMessages, ""],
    })
  }

  const removeFinalMessage = (index: number) => {
    const newMessages = [...diagnostic.finalMessages]
    newMessages.splice(index, 1)
    setDiagnostic({
      ...diagnostic,
      finalMessages: newMessages,
    })
  }

  const updateFinalMessage = (index: number, message: string) => {
    const newMessages = [...diagnostic.finalMessages]
    newMessages[index] = message
    setDiagnostic({
      ...diagnostic,
      finalMessages: newMessages,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const isConnected = await checkSupabaseConnection()
      if (!isConnected) {
        throw new Error("Nu s-a putut stabili conexiunea cu serverul")
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        throw new Error("Eroare la verificarea sesiunii")
      }

      if (!session?.user?.id) {
        console.error("No authenticated user found")
        throw new Error("Nu sunteți autentificat")
      }

      // Validări
      if (!diagnostic.name.trim()) {
        throw new Error("Numele diagnosticului este obligatoriu")
      }

      if (!diagnostic.categories.length) {
        throw new Error("Adăugați cel puțin o categorie")
      }

      for (const category of diagnostic.categories) {
        if (!category.name.trim()) {
          throw new Error("Toate categoriile trebuie să aibă un nume")
        }
        if (!category.questions.length || category.questions.some((q) => !q.trim())) {
          throw new Error("Toate categoriile trebuie să aibă cel puțin o întrebare completată")
        }
      }

      if (!diagnostic.finalMessages.length || diagnostic.finalMessages.some((m) => !m.trim())) {
        throw new Error("Adăugați cel puțin un mesaj final valid")
      }

      const scheduleDays = Object.entries(diagnostic.scheduleDays)
        .filter(([_, value]) => value)
        .map(([day]) => day)

      if (!scheduleDays.length) {
        throw new Error("Selectați cel puțin o zi pentru programare")
      }

      const chatId = generateChatId()

      const diagnosticData = {
        name: diagnostic.name,
        categories: diagnostic.categories,
        final_messages: diagnostic.finalMessages,
        schedule_days: scheduleDays,
        notification_time: diagnostic.notificationTime,
        duration_days: diagnostic.durationDays,
        chat_id: chatId,
        doctor_id: session.user.id,
      }

      const { data, error: insertError } = await supabase.from("diagnostics").insert([diagnosticData]).select().single()

      if (insertError) {
        console.error("Database insert error:", insertError)
        throw new Error(`Eroare la salvarea diagnosticului: ${insertError.message}`)
      }

      toast.success(`Diagnostic creat cu succes! ID Chat: ${chatId}`)
      router.push("/doctor/diagnostics")
    } catch (error) {
      console.error("Error creating diagnostic:", error)
      const message = error instanceof Error ? error.message : "Eroare la crearea diagnosticului"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Creare Diagnostic Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nume Diagnostic */}
          <div className="space-y-2">
            <Label htmlFor="name">Nume Diagnostic</Label>
            <Input
              id="name"
              value={diagnostic.name}
              onChange={(e) => setDiagnostic({ ...diagnostic, name: e.target.value })}
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

            {diagnostic.categories.map((category, categoryIndex) => (
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
                      disabled={diagnostic.categories.length === 1}
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
              {diagnostic.finalMessages.map((message, index) => (
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
                    disabled={diagnostic.finalMessages.length === 1}
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
              {Object.entries(diagnostic.scheduleDays).map(([day, checked]) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={checked}
                    onCheckedChange={(checked) =>
                      setDiagnostic({
                        ...diagnostic,
                        scheduleDays: {
                          ...diagnostic.scheduleDays,
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
              value={diagnostic.notificationTime}
              onChange={(e) => setDiagnostic({ ...diagnostic, notificationTime: e.target.value })}
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
              value={diagnostic.durationDays}
              onChange={(e) => setDiagnostic({ ...diagnostic, durationDays: Number.parseInt(e.target.value) })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Se creează...
              </>
            ) : (
              "Creează Diagnostic Chat"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

