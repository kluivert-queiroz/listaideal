import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateListAction } from '@/app/actions/lists'
import { ListForm } from '@/components/lists/list-form'
import { Button } from '@/components/ui/button'

export default async function EditListPage({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: list } = await supabase
    .from('lists')
    .select('*')
    .eq('id', listId)
    .eq('owner_id', user.id)
    .single()

  if (!list) notFound()

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/lists/${listId}`}>← Voltar para a lista</Link>
        </Button>
      </div>
      <div>
        <h1 className="font-script text-5xl text-primary leading-none">Editar lista</h1>
      </div>
      <ListForm
        action={updateListAction}
        defaultValues={list}
        listId={listId}
        submitLabel="Salvar alterações"
      />
    </div>
  )
}
