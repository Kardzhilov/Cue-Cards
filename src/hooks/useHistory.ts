import { useCallback, useRef, useState } from 'react'

export interface History<T> {
  state: T
  /** Replace state. When `coalesce` is true, rapid consecutive edits collapse into one undo step. */
  set: (next: T, coalesce?: boolean) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const COALESCE_MS = 600

export function useHistory<T>(initial: T): History<T> {
  const [state, setState] = useState<T>(initial)
  const stateRef = useRef<T>(initial)
  const past = useRef<T[]>([])
  const future = useRef<T[]>([])
  const lastAt = useRef(0)
  const lastCoalesce = useRef(false)
  const [, force] = useState(0)
  const rerender = () => force((n) => n + 1)

  const set = useCallback((next: T, coalesce = false) => {
    const now = Date.now()
    const coalesceNow = coalesce && lastCoalesce.current && now - lastAt.current < COALESCE_MS
    if (!coalesceNow) past.current.push(stateRef.current)
    future.current = []
    lastAt.current = now
    lastCoalesce.current = coalesce
    stateRef.current = next
    setState(next)
  }, [])

  const undo = useCallback(() => {
    if (past.current.length === 0) return
    future.current.unshift(stateRef.current)
    const value = past.current.pop()!
    stateRef.current = value
    lastAt.current = 0
    lastCoalesce.current = false
    setState(value)
    rerender()
  }, [])

  const redo = useCallback(() => {
    if (future.current.length === 0) return
    past.current.push(stateRef.current)
    const value = future.current.shift()!
    stateRef.current = value
    lastAt.current = 0
    lastCoalesce.current = false
    setState(value)
    rerender()
  }, [])

  return {
    state,
    set,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  }
}
