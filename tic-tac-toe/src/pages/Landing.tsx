import { useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { useGameSubscription } from '../hooks/useGameSubscription'

const STORAGE_KEY = 'tic-tac-toe:displayName'

export default function Landing() {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { createGame, error } = useGameSubscription()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) setName(stored)
  }, [])

  useEffect(() => {
    if (error) {
      setFormError(error)
    }
  }, [error])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      setFormError('Please enter a display name.')
      return
    }

    setCreating(true)
    setFormError(null)
    try {
      const game = await createGame(name.trim())
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, name.trim())
      }
      navigate(`/game/${game.id}?as=X`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create game'
      setFormError(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-4 pb-10 pt-[10%] md:px-8">
      <section className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-gradient sm:text-5xl">
            Play Tic-Tac-Toe! The classic X and O game.
          </h1>
          <p className="text-lg text-slate-300">
            Start a match instantly, invite friends with one link, and watch every move update in
            real time.
          </p>
          <form onSubmit={handleSubmit} className="card space-y-4 p-6">
            <div className="space-y-2">
              <label className="text-sm uppercase tracking-wide text-slate-400" htmlFor="player-name">
                Your display name
              </label>
              <input
                id="player-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Grace Hopper"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            {formError && <p className="text-sm text-rose-400">{formError}</p>}
            <button type="submit" className="btn-primary w-full" disabled={creating}>
              {creating ? 'Creating game…' : 'Create game'}
            </button>
          </form>
        </div>
        <div className="card space-y-6 p-6">
          <h2 className="text-xl font-semibold">How it works</h2>
          <ol className="space-y-4 text-slate-300">
            <li>1. Choose a display name and create a new game.</li>
            <li>2. Share the invite link—WhatsApp share is built in.</li>
            <li>3. Supabase keeps both boards in sync in real time.</li>
            <li>4. Reset the board or scores anytime without losing the lobby.</li>
          </ol>
          
        </div>
      </section>
      <footer className="mt-auto border-t border-slate-800 pt-6 text-center text-sm text-slate-400">
        Made with{' '}
        <span aria-hidden="true" className="text-red-500">
          ♥
        </span>{' '}
        by Hammed &copy; 2025
      </footer>
    </main>
  )
}

