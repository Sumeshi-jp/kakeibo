import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'
import { useState, type ReactNode } from 'react'

interface Item {
  id: string
  archived: boolean
}

interface ManagedListProps<T extends Item> {
  items: T[]
  renderItem: (item: T) => ReactNode
  onSelect: (item: T) => void
  /** 表示中（アーカイブ以外）の並びを入れ替える */
  onMove: (index: number, delta: -1 | 1) => void
  emptyText: string
}

/** 並べ替えボタンとアーカイブ済みの折りたたみが付いた一覧 */
export function ManagedList<T extends Item>({ items, renderItem, onSelect, onMove, emptyText }: ManagedListProps<T>) {
  const [showArchived, setShowArchived] = useState(false)
  const active = items.filter((i) => !i.archived)
  const archived = items.filter((i) => i.archived)

  return (
    <div>
      {active.length === 0 && <p className="border-b border-hairline py-4 text-sm text-slate">{emptyText}</p>}
      <ul>
        {active.map((item, i) => (
          <li key={item.id} className="flex items-center border-b border-hairline">
            <button type="button" onClick={() => onSelect(item)} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 text-left">
              {renderItem(item)}
            </button>
            <div className="flex shrink-0">
              <button
                type="button"
                aria-label="上へ"
                disabled={i === 0}
                onClick={() => onMove(i, -1)}
                className="grid size-11 place-items-center text-slate disabled:opacity-25"
              >
                <ChevronUp size={20} />
              </button>
              <button
                type="button"
                aria-label="下へ"
                disabled={i === active.length - 1}
                onClick={() => onMove(i, 1)}
                className="grid size-11 place-items-center text-slate disabled:opacity-25"
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {archived.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            aria-expanded={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            className="flex min-h-11 items-center gap-1 text-sm text-slate"
          >
            <ChevronRight size={16} className={showArchived ? 'rotate-90' : ''} />
            アーカイブ済み（{archived.length}）
          </button>
          {showArchived && (
            <ul className="opacity-60">
              {archived.map((item) => (
                <li key={item.id} className="border-b border-hairline">
                  <button type="button" onClick={() => onSelect(item)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
                    {renderItem(item)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
