import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase/config'

/**
 * Reads optional `registeredUsers` from Firestore `portal/stats`.
 * Firebase Auth does not expose total user count on the client; mirror the
 * number from the console when you add/remove users, or automate later.
 *
 * @returns {{ count: number | null | undefined, loading: boolean }}
 */
export function usePortalRegisteredUserCount() {
  const [count, setCount] = useState(undefined)

  useEffect(() => {
    const ref = doc(db, 'portal', 'stats')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setCount(null)
          return
        }
        const raw = snap.data()?.registeredUsers
        setCount(typeof raw === 'number' && Number.isFinite(raw) ? raw : null)
      },
      () => setCount(null),
    )
    return () => unsub()
  }, [])

  const loading = count === undefined
  return { count, loading }
}
