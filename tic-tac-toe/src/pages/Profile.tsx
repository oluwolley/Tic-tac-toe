import { useEffect, useState } from 'react'

import dayjs from '../lib/dayjs'

const STORAGE_KEY = 'tic-tac-toe:displayName'

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setDisplayName(stored)
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-10 md:px-8">
      <section className="card space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gradient">Your profile</h1>
          <p className="text-sm text-slate-400">
            Personalize what other players see when you join a lobby. Your display name is stored
            locally on this device only.
          </p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-wide text-slate-400">Display name</p>
          <p className="mt-2 text-2xl font-semibold">{displayName || 'Not set yet'}</p>
          <p className="mt-4 text-sm text-slate-400">
            Last updated {dayjs().utc().format('YYYY-MM-DD HH:mm')} (local storage)
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Tip: clearing your browser storage or switching devices resets this name. Supabase Auth is
          not enabled in this demo; add it for persistent identity and tighten the RLS policy.
        </p>
      </section>
    </main>
  )
}

