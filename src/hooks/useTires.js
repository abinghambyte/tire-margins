import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase/config'

export function useTires() {
  const [tires, setTires] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'tires'),
      (snap) => {
        setTires(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError(null)
      },
      (e) => {
        setError(e)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  return { tires, loading, error }
}
