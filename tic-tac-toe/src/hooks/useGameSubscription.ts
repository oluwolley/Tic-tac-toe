import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { RealtimeChannel } from '@supabase/supabase-js'

import type { GameRow, PlayerSymbol } from '../lib/database.types'
import {
  GameServiceError,
  createGame as serviceCreateGame,
  fetchGame,
  joinGame as serviceJoinGame,
  resetBoard as serviceResetBoard,
  resetScores as serviceResetScores,
  updateGameMove,
} from '../lib/gameService'
import { checkWinner, cloneBoard, nextTurn } from '../lib/gameLogic'
import { useSupabaseClient } from './useSupabaseClient'

type SubscriptionState = 'idle' | 'connecting' | 'online' | 'error'

type MakeMoveResult = {
  success: boolean
  conflict?: boolean
  message?: string
}

const createOptimisticGame = (game: GameRow, index: number, symbol: PlayerSymbol): GameRow => {
  const board = cloneBoard(game.board)
  board[index] = symbol
  const { winner, draw } = checkWinner(board)

  let nextTurnSymbol: PlayerSymbol = nextTurn(symbol)
  let status: 'finished' | 'in_progress' = 'in_progress'

  if (winner) {
    nextTurnSymbol = symbol
    status = 'finished'
  } else if (draw) {
    nextTurnSymbol = nextTurn(symbol)
    status = 'finished'
  }

  return {
    ...game,
    board,
    status,
    turn: nextTurnSymbol,
    last_move_by: symbol,
    last_move_at: new Date().toISOString(),
    version: game.version + 1,
  }
}

export function useGameSubscription(gameId?: string) {
  const supabase = useSupabaseClient()
  const [game, setGame] = useState<GameRow | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(gameId))
  const [error, setError] = useState<string | null>(null)
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>('idle')
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!gameId) {
      setGame(null)
      setLoading(false)
      setSubscriptionState('idle')
      return
    }

    let isCancelled = false
    setLoading(true)
    setSubscriptionState('connecting')
    setError(null)

    fetchGame(supabase, gameId)
      .then((data) => {
        if (isCancelled) return
        if (!data) {
          setError('Game not found')
          setSubscriptionState('error')
          return
        }
        setGame(data)
        setSubscriptionState('online')
      })
      .catch((err: unknown) => {
        if (isCancelled) return
        const message = err instanceof Error ? err.message : 'Failed to load game'
        setError(message)
        setSubscriptionState('error')
      })
      .finally(() => {
        if (!isCancelled) setLoading(false)
      })

    const channel = supabase
      .channel(`public:games:id=eq.${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) => {
        const latest = payload.new as GameRow
        setGame(latest)
        setPendingIndex(null)
        setSubscriptionState('online')
      })
      .on('presence', { event: 'sync' }, () => {
        setSubscriptionState('online')
      })
      .on('status', (status) => {
        if (status === 'SUBSCRIBED') {
          setSubscriptionState('online')
        } else if (status === 'CLOSED') {
          setSubscriptionState('error')
        } else if (status === 'CHANNEL_ERROR') {
          setSubscriptionState('error')
        } else {
          setSubscriptionState('connecting')
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      isCancelled = true
      setSubscriptionState('idle')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [gameId, supabase])

  const create = useCallback(async (playerName: string) => {
    setLoading(true)
    setError(null)
    try {
      const created = await serviceCreateGame(supabase, playerName)
      setGame(created)
      return created
    } catch (err) {
      const message = err instanceof GameServiceError ? err.message : 'Unable to create game'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const join = useCallback(
    async (gameIdToJoin: string, playerName: string) => {
      setLoading(true)
      setError(null)
      try {
        const joined = await serviceJoinGame(supabase, gameIdToJoin, playerName)
        setGame(joined)
        return joined
      } catch (err) {
        const message =
          err instanceof GameServiceError
            ? err.code === 'ALREADY_JOINED'
              ? 'This game already has two players.'
              : err.message
            : 'Unable to join game'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  const makeMove = useCallback(
    async (index: number, symbol: PlayerSymbol): Promise<MakeMoveResult> => {
      if (!game) {
        return { success: false, message: 'Game not loaded' }
      }

      if (game.board[index]) {
        return { success: false, message: 'Cell already filled' }
      }
      setPendingIndex(index)

      const snapshot = game
      const optimistic = createOptimisticGame(snapshot, index, symbol)
      setGame(optimistic)

      try {
        const { game: updated, conflict } = await updateGameMove(supabase, game.id, index, symbol)
        setGame(updated)
        setPendingIndex(null)

        return { success: true, conflict }
      } catch (err) {
        setPendingIndex(null)
        setGame({
          ...snapshot,
          board: [...snapshot.board],
        })
        const message =
          err instanceof GameServiceError ? err.message : 'Unable to play move. Please try again.'
        setError(message)
        return { success: false, message }
      }
    },
    [game, supabase],
  )

  const reset = useCallback(async () => {
    if (!game) return null
    try {
      const updated = await serviceResetBoard(supabase, game)
      setGame(updated)
      return updated
    } catch (err) {
      const message = err instanceof GameServiceError ? err.message : 'Failed to reset board'
      setError(message)
      throw err
    }
  }, [game, supabase])

  const resetScoreboard = useCallback(async () => {
    if (!game) return null
    try {
      const updated = await serviceResetScores(supabase, game)
      setGame(updated)
      return updated
    } catch (err) {
      const message = err instanceof GameServiceError ? err.message : 'Failed to reset scores'
      setError(message)
      throw err
    }
  }, [game, supabase])

  const value = useMemo(
    () => ({
      game,
      loading,
      error,
      subscriptionState,
      isReconnecting: subscriptionState === 'connecting',
      pendingIndex,
      createGame: create,
      joinGame: join,
      makeMove,
      resetBoard: reset,
      resetScores: resetScoreboard,
    }),
    [create, error, game, join, loading, makeMove, pendingIndex, reset, resetScoreboard, subscriptionState],
  )

  return value
}

