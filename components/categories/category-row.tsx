'use client'

import { useState } from 'react'
import {
  deleteCategoryAction,
  reorderCategoryAction,
} from '@/app/actions/categories'
import { RenameCategoryForm } from './rename-category-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { GiftCategory } from '@/lib/types'

export function CategoryRow({
  category,
  giftCount,
  isFirst,
  isLast,
}: {
  category: GiftCategory
  giftCount: number
  isFirst: boolean
  isLast: boolean
}) {
  const [renameOpen, setRenameOpen] = useState(false)

  return (
    <div className="flex gap-3 items-center py-2 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm">{category.name}</span>
        <span className="text-xs text-muted-foreground ml-2">
          {giftCount} {giftCount === 1 ? 'presente' : 'presentes'}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <form action={reorderCategoryAction}>
          <input type="hidden" name="category_id" value={category.id} />
          <input type="hidden" name="list_id" value={category.list_id} />
          <input type="hidden" name="direction" value="up" />
          <Button type="submit" variant="ghost" size="icon" disabled={isFirst} className="h-7 w-7">
            ↑
          </Button>
        </form>
        <form action={reorderCategoryAction}>
          <input type="hidden" name="category_id" value={category.id} />
          <input type="hidden" name="list_id" value={category.list_id} />
          <input type="hidden" name="direction" value="down" />
          <Button type="submit" variant="ghost" size="icon" disabled={isLast} className="h-7 w-7">
            ↓
          </Button>
        </form>

        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              Renomear
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renomear categoria</DialogTitle>
            </DialogHeader>
            <RenameCategoryForm category={category} onSuccess={() => setRenameOpen(false)} />
          </DialogContent>
        </Dialog>

        <form action={deleteCategoryAction}>
          <input type="hidden" name="category_id" value={category.id} />
          <input type="hidden" name="list_id" value={category.list_id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          >
            Excluir
          </Button>
        </form>
      </div>
    </div>
  )
}
