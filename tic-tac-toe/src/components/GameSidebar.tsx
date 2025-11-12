import { useState } from 'react'

import type { GameRow } from '../lib/database.types'
import dayjs from '../lib/dayjs'
import { ShareButtons } from './ShareButtons'

interface GameSidebarProps {
  game: GameRow | null
  inviteUrl: string
  onResetBoard: () => Promise<unknown> | unknown
  onResetScores: () => Promise<unknown> | unknown
  isReconnecting?: boolean
}

const statusLabel = (game: GameRow | null) => {
  if (!game) return 'No game'
  switch (game.status) {
    case 'waiting':
      return 'Waiting for opponent'
    case 'in_progress':
      return `Turn: ${game.turn}`
    case 'finished':
      return 'Game finished'
    default:
      return game.status
  }
}

export function GameSidebar({
  game,
  inviteUrl,
  onResetBoard,
  onResetScores,
  isReconnecting = false,
}: GameSidebarProps) {
  const [resetLoading, setResetLoading] = useState(false)
  const [scoreResetLoading, setScoreResetLoading] = useState(false)

  const handleResetBoard = async () => {
    setResetLoading(true)
    try {
      await onResetBoard()
    } finally {
      setResetLoading(false)
    }
  }

  const handleResetScores = async () => {
    setScoreResetLoading(true)
    try {
      await onResetScores()
    } finally {
      setScoreResetLoading(false)
    }
  }

  const lastMoveText =
    game?.last_move_at && game.last_move_by
      ? `${game.last_move_by} moved ${dayjs(game.last_move_at).fromNow()}`
      : 'No moves yet'

  return (
    <aside className="card p-6 space-y-6 w-full lg:w-80">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-400">Status</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gradient">{statusLabel(game)}</span>
          {isReconnecting && (
            <span className="text-xs text-amber-400 animate-pulse">Reconnecting…</span>
          )}
        </div>
        <p className="text-sm text-slate-400">{lastMoveText}</p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Players</p>
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-4 py-3">
              <div>
                <p className="text-slate-300 text-sm">Player X</p>
                <p className="text-lg font-semibold text-sky-300">
                  {game?.player_x ?? 'Waiting…'}
                </p>
              </div>
              <span className="text-2xl font-bold text-sky-400">{game?.score_x ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-4 py-3">
              <div>
                <p className="text-slate-300 text-sm">Player O</p>
                <p className="text-lg font-semibold text-emerald-300">
                  {game?.player_o ?? 'Waiting…'}
                </p>
              </div>
              <span className="text-2xl font-bold text-emerald-400">{game?.score_o ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className="btn-primary w-full"
          onClick={handleResetBoard}
          disabled={resetLoading || !game}
        >
          {resetLoading ? 'Resetting…' : 'Reset Board'}
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={handleResetScores}
          disabled={scoreResetLoading || !game}
        >
          {scoreResetLoading ? 'Resetting…' : 'Reset Scores'}
        </button>
      </div>

      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400 mb-3">Invite a friend</p>
        <ShareButtons inviteUrl={inviteUrl} />
      </div>
    </aside>
  )
}

