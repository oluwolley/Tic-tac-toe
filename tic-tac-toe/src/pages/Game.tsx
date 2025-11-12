import { useEffect, useMemo, useState } from 'react'

import clsx from 'clsx'
import { useNavigate, useParams } from 'react-router-dom'

import { Board } from '../components/Board'
import { GameSidebar } from '../components/GameSidebar'
import { NamePrompt } from '../components/NamePrompt'
import { useGameSubscription } from '../hooks/useGameSubscription'
import { checkWinner } from '../lib/gameLogic'
import type { GameRow, PlayerSymbol } from '../lib/database.types'

const STORAGE_KEY = 'tic-tac-toe:displayName'

const selectRole = (game: GameRow | null, displayName: string | null): PlayerSymbol | null => {
  if (!game || !displayName) return null
  if (game.player_x?.toLowerCase() === displayName.toLowerCase()) return 'X'
  if (game.player_o?.toLowerCase() === displayName.toLowerCase()) return 'O'
  return null
}

const buildInviteUrl = (gameId?: string) => {
  if (typeof window === 'undefined' || !gameId) return ''
  const origin = window.location.origin
  return `${origin}/game/${gameId}`
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState<string | null>(null)
  const [promptOpen, setPromptOpen] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const { game, makeMove, joinGame, resetBoard, resetScores, pendingIndex, isReconnecting, error, loading } =
    useGameSubscription(gameId)

  const role = useMemo(() => selectRole(game, displayName), [game, displayName])
  const inviteUrl = useMemo(() => buildInviteUrl(game?.id), [game?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setDisplayName(stored)
    }
  }, [])

  useEffect(() => {
    if (!game) return
    if (!displayName) {
      setPromptOpen(true)
      return
    }

    const currentRole = selectRole(game, displayName)
    const needsJoin = game.status === 'waiting' || (game.player_o === null && currentRole !== 'O')
    if (!currentRole && needsJoin) {
      setPromptOpen(true)
    } else {
      setPromptOpen(false)
    }
  }, [displayName, game])

  useEffect(() => {
    if (!gameId) {
      navigate('/')
    }
  }, [gameId, navigate])

  const handleJoin = async (name: string) => {
    if (!gameId) return
    setJoinError(null)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, name)
      }
      setDisplayName(name)
      await joinGame(gameId, name)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to join game'
      setJoinError(message)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  const handleCellSelect = async (index: number) => {
    if (!game || !role) return
    if (game.turn !== role) return
    if (game.status === 'finished') return
    await makeMove(index, role)
  }

  const winnerInfo = useMemo(() => {
    if (!game) return null
    const result = checkWinner(game.board)
    if (result.winner) return result
    return null
  }, [game])

  const helperText = useMemo(() => {
    if (!game) return 'Loading game…'
    if (role === null) {
      return game.player_o
        ? 'You are watching this game.'
        : 'Enter your name to join as Player O.'
    }
    if (game.status === 'finished') {
      if (winnerInfo?.winner) return `${winnerInfo.winner} wins! Reset to play again.`
      if (game.board.every((cell) => cell !== '')) return 'Draw game! Reset to play again.'
    }
    if (game.turn === role) return 'Your turn!'
    return `Waiting for ${game.turn}.`
  }, [game, role, winnerInfo])

  const heroMessage = role
    ? `You're playing as ${role}`
    : game?.status === 'waiting'
      ? 'Waiting for players'
      : 'Spectating'

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-2">
        <button
          type="button"
          className="self-start rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gradient sm:text-4xl">Live Tic-Tac-Toe</h1>
        <p className="text-sm text-slate-300">
          {heroMessage}
          {role ? ` • Display name: ${displayName ?? 'Unknown'}` : null}
        </p>
        <p
          className={clsx('text-sm', {
            'text-emerald-300': game && role && game.turn === role && game.status !== 'finished',
            'text-slate-400': !(game && role && game.turn === role && game.status !== 'finished'),
          })}
        >
          {helperText}
        </p>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        {joinError ? <p className="text-sm text-rose-400">{joinError}</p> : null}
      </header>

      <section className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 card p-6">
          {loading && !game ? (
            <div className="flex h-48 items-center justify-center text-slate-400">Loading game…</div>
          ) : game ? (
            <div className="space-y-6">
              <Board
                board={game.board as (PlayerSymbol | '')[]}
                onSelect={handleCellSelect}
                disabled={role === null || game.turn !== role || game.status === 'finished'}
                winningLine={winnerInfo?.line ?? null}
                pendingIndex={pendingIndex}
              />
              {winnerInfo?.winner ? (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-200">
                  <p className="font-semibold">{winnerInfo.winner} wins this round!</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-slate-400">
              Game not found. Return to home.
            </div>
          )}
        </div>
        <GameSidebar
          game={game}
          inviteUrl={inviteUrl}
          onResetBoard={async () => {
            if (!game) return
            await resetBoard()
          }}
          onResetScores={async () => {
            if (!game) return
            await resetScores()
          }}
          isReconnecting={isReconnecting}
        />
      </section>

      <NamePrompt
        isOpen={promptOpen}
        onSubmit={handleJoin}
        onClose={() => setPromptOpen(false)}
        defaultValue={displayName ?? ''}
        title="Join this game"
        description="Enter a display name to join the match. Your name is visible to other players."
        ctaLabel="Join game"
      />
    </main>
  )
}

