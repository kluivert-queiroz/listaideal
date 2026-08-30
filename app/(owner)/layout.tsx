import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/nav'

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex flex-1 flex-col">
      <Nav email={user.email ?? ''} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  )
}
