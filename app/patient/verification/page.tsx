export default function VerificationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-3xl font-bold">Verificați emailul</h1>
        <p className="text-gray-500">
          V-am trimis un email cu un link de confirmare. Vă rugăm să verificați emailul și să urmați instrucțiunile
          pentru a vă activa contul.
        </p>
        <p className="text-sm text-muted-foreground">
          După confirmarea emailului, vă veți putea autentifica în aplicație.
        </p>
      </div>
    </div>
  )
}

