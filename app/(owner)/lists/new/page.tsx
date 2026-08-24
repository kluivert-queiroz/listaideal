import Link from 'next/link'
import { createListAction } from '@/app/actions/lists'
import { ListForm } from '@/components/lists/list-form'
import { Button } from '@/components/ui/button'

export default function NewListPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard">← Painel</Link>
        </Button>
      </div>
      <div>
        <h1 className="font-heading text-5xl text-primary leading-none">Nova lista de presentes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Preencha os detalhes. Você pode adicionar presentes após criar a lista.
        </p>
      </div>
      <ListForm action={createListAction} submitLabel="Criar lista" />
    </div>
  )
}
