'use client'
import { useMemo, useState } from 'react'
import { Users, ChevronDown, ChevronRight } from 'lucide-react'

type Employee = {
  id: string
  firstName: string
  lastName: string
  jobTitle?: string
  department?: string
  avatarUrl?: string
  status: string
  managerId?: string | null
  reports?: Employee[]
}

type Props = {
  employees: Employee[]
  onSelectEmployee: (emp: Employee) => void
}

function Avatar({ emp, size = 'md' }: { emp: Employee; size?: 'sm' | 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' }
  const colors = ['bg-brand-100 text-brand-600', 'bg-purple-100 text-purple-600', 'bg-green-100 text-green-600', 'bg-amber-100 text-amber-600', 'bg-pink-100 text-pink-600']
  const color = colors[(emp.firstName.charCodeAt(0) + emp.lastName.charCodeAt(0)) % colors.length]
  const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase()
  if (emp.avatarUrl) return <img src={emp.avatarUrl} className={`${sizes[size]} rounded-xl object-cover flex-shrink-0`} />
  return <div className={`${sizes[size]} ${color} rounded-xl flex items-center justify-center font-bold flex-shrink-0`}>{initials}</div>
}

function OrgNode({
  node,
  onSelect,
  depth = 0,
}: {
  node: Employee & { children: (Employee & { children: any[] })[] }
  onSelect: (emp: Employee) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children.length > 0

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        onClick={() => onSelect(node)}
        className={`relative cursor-pointer group transition-all duration-200 ${
          depth === 0 ? 'scale-110' : ''
        }`}
      >
        <div className="bg-white border-2 border-gray-100 hover:border-brand-300 hover:shadow-glow-sm rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[180px] max-w-[220px] transition-all">
          <Avatar emp={node} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink text-xs truncate">
              {node.firstName} {node.lastName}
            </p>
            <p className="text-ink-muted text-xs truncate mt-0.5">{node.jobTitle || '—'}</p>
            {node.department && (
              <p className="text-brand-400 text-xs font-medium truncate mt-0.5">{node.department}</p>
            )}
          </div>
        </div>
        {node.status !== 'ACTIVE' && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-white" />
        )}
      </div>

      {/* Expand/collapse button */}
      {hasChildren && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-1 w-6 h-6 rounded-full bg-gray-100 hover:bg-brand-100 flex items-center justify-center transition-colors"
        >
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
            : <div className="flex items-center gap-0.5">
                <span className="text-xs font-bold text-brand-500">{node.children.length}</span>
              </div>
          }
        </button>
      )}

      {/* Children */}
      {hasChildren && expanded && (
        <div className="relative mt-0">
          {/* Vertical connector */}
          <div className="w-px h-4 bg-gray-200 mx-auto" />

          {/* Horizontal bar */}
          {node.children.length > 1 && (
            <div
              className="h-px bg-gray-200 absolute top-0"
              style={{
                left: `calc(50% - ${((node.children.length - 1) * 240) / 2}px)`,
                width: `${(node.children.length - 1) * 240}px`,
              }}
            />
          )}

          {/* Child nodes */}
          <div className="flex items-start gap-6">
            {node.children.map(child => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-gray-200" />
                <OrgNode node={child} onSelect={onSelect} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function OrgChart({ employees, onSelectEmployee }: Props) {
  // Build tree structure
  const tree = useMemo(() => {
    type NodeWithChildren = Employee & { children: NodeWithChildren[] }

    const map: Record<string, NodeWithChildren> = {}
    employees.forEach(e => { map[e.id] = { ...e, children: [] } })

    const roots: NodeWithChildren[] = []
    employees.forEach(e => {
      if (e.managerId && map[e.managerId]) {
        map[e.managerId].children.push(map[e.id])
      } else {
        roots.push(map[e.id])
      }
    })

    return roots
  }, [employees])

  if (employees.length === 0) {
    return (
      <div className="card py-20 text-center">
        <Users className="w-10 h-10 text-ink-muted mx-auto mb-3" />
        <p className="font-semibold text-ink">Org şeması oluşturmak için çalışan ekleyin</p>
        <p className="text-sm text-ink-muted mt-1">Çalışanlara yönetici atadıkça hiyerarşi otomatik oluşur</p>
      </div>
    )
  }

  return (
    <div className="card overflow-auto p-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="text-xs text-ink-muted bg-surface-muted rounded-xl px-3 py-2 border border-gray-100">
          💡 Yönetici atayarak hiyerarşiyi genişletin · Karta tıklayarak detayları görün
        </div>
      </div>
      <div className="flex flex-col items-center gap-6 overflow-x-auto pb-4">
        {tree.length > 0 ? (
          tree.map(root => (
            <OrgNode key={root.id} node={root} onSelect={onSelectEmployee} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-ink-muted">Yönetici ilişkisi kurulmamış</p>
          </div>
        )}
      </div>
    </div>
  )
}
