import { useEffect, useMemo, useState } from "react"
import { useProject } from "../../contexts/ProjectContext"
import { notify } from "../../services/notify"

export default function ProjectSelect({ compact = false }) {
  const { projects, currentProject, setCurrentProject, addProject } = useProject()
  const [mode, setMode] = useState('select') // 'select' | 'create'
  const [name, setName] = useState('')

  const options = useMemo(() => (projects || []).map(p => ({ id: p.id, name: p.name })), [projects])

  useEffect(() => {
    if (!currentProject && options.length > 0 && mode === 'select') {
      // Keep unselected by default to force explicit choice
    }
  }, [currentProject, options, mode])

  const onChange = (e) => {
    const id = e.target.value
    if (!id) return
    const found = projects.find(p => String(p.id) === String(id))
    if (found) setCurrentProject(found)
  }

  const onCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      notify.warn('Enter a project name')
      return
    }
    try {
      const created = await addProject({ name: trimmed })
      setCurrentProject(created)
      setName('')
      setMode('select')
    } catch {}
  }

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 8 }
  const inputStyle = { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', minWidth: 220 }
  const labelStyle = { color: 'var(--muted-foreground)', fontSize: '0.9rem' }
  const btnStyle = { background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }
  const btnSmall = { padding: '6px 10px', fontSize: '0.85rem' }
  const btnSecondary = { background: 'var(--secondary)', color: 'var(--secondary-foreground)' }

  return (
    <div style={{ marginBottom: compact ? 8 : 12 }}>
      <div style={rowStyle}>
        {mode === 'select' ? (
          <>
            <label style={labelStyle}>Project</label>
            <select style={inputStyle} value={currentProject?.id || ''} onChange={onChange}>
              <option value="" disabled>Select a project</option>
              {options.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
            <button style={{ ...btnStyle, ...btnSmall }} onClick={() => setMode('create')}>New</button>
          </>
        ) : (
          <>
            <label style={labelStyle}>New project</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., My Web App" />
            <button style={{ ...btnStyle, ...btnSmall }} onClick={onCreate}>Create</button>
            <button style={{ ...btnStyle, ...btnSmall, ...btnSecondary }} onClick={() => { setMode('select'); setName('') }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}
