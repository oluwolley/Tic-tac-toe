import type { PostgrestError } from '@supabase/supabase-js'

import { initialBoard, checkWinner, nextTurn, cloneBoard } from './gameLogic'
import type { GameInsert, GameRow, GameUpdate, PlayerSymbol } from './database.types'
import type { TypedSupabaseClient } from './supabase'

export class GameServiceError extends Error {
  readonly cause?: PostgrestError | Error
  readonly code: string

  constructor(message: string, cause?: PostgrestError | Error, code = 'SERVICE_ERROR') {
    super(message)
    this.name = 'GameServiceError'
    this.cause = cause
    this.code = code
  }
}

export type GameMutationResult = {
  game: GameRow
  conflict?: boolean
}

export async function createGame(
  client: TypedSupabaseClient,
  playerName: string,
): Promise<GameRow> {
  const now = new Date().toISOString()
  const payload: GameInsert = {
    player_x: playerName,
    status: 'waiting',
    board: initialBoard(),
    turn: 'X',
    updated_at: now,
    last_move_at: null,
    last_move_by: null,
    score_x: 0,
    score_o: 0,
    version: 0,
  }

  const { data, error } = await client.from('games').insert<GameInsert>(payload).select().single()

  if (error || !data) {
    throw new GameServiceError('Failed to create game', error ?? undefined, error?.code)
  }

  return data
}

export async function fetchGame(
  client: TypedSupabaseClient,
  gameId: string,
): Promise<GameRow | null> {
  const { data, error } = await client.from('games').select('*').eq('id', gameId).single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new GameServiceError('Failed to fetch game', error, error.code)
  }

  return data
}

export async function joinGame(
  client: TypedSupabaseClient,
  gameId: string,
  playerName: string,
): Promise<GameRow> {
  const now = new Date().toISOString()
  const update: GameUpdate = {
    player_o: playerName,
    status: 'in_progress',
    updated_at: now,
  }

  const { data, error } = await client
    .from('games')
    .update<GameUpdate>(update)
    .eq('id', gameId)
    .is('player_o', null)
    .select()
    .single()

  if (error) {
    throw new GameServiceError('Failed to join game', error, error.code)
  }

  if (!data) {
    throw new GameServiceError('Game already has a second player', undefined, 'ALREADY_JOINED')
  }

  return data
}

const makeUpdatePayload = (
  game: GameRow,
  nextBoard: string[],
  symbol: PlayerSymbol,
) => {
  const now = new Date().toISOString()
  const result = checkWinner(nextBoard)
  const isWin = !!result.winner
  const isDraw = result.draw
  const update: GameUpdate = {
    board: nextBoard,
    last_move_by: symbol,
    last_move_at: now,
    updated_at: now,
    version: game.version + 1,
  }

  if (isWin) {
    update.status = 'finished'
    update.turn = symbol
    const scoreKey = symbol === 'X' ? 'score_x' : 'score_o'
    update[scoreKey] = game[scoreKey] + 1
  } else if (isDraw) {
    update.status = 'finished'
    update.turn = nextTurn(symbol)
  } else {
    update.status = 'in_progress'
    update.turn = nextTurn(symbol)
  }

  return { update, result }
}

export async function updateGameMove(
  client: TypedSupabaseClient,
  gameId: string,
  index: number,
  playerSymbol: PlayerSymbol,
): Promise<GameMutationResult> {
  const game = await fetchGame(client, gameId)
  if (!game) {
    throw new GameServiceError('Game not found', undefined, 'NOT_FOUND')
  }

  if (index < 0 || index > 8) {
    throw new GameServiceError('Invalid move index', undefined, 'INVALID_INDEX')
  }

  if (game.status === 'finished') {
    throw new GameServiceError('Game already finished', undefined, 'GAME_FINISHED')
  }

  if (game.turn !== playerSymbol) {
    throw new GameServiceError('Not your turn', undefined, 'OUT_OF_TURN')
  }

  if (game.board[index]) {
    throw new GameServiceError('Cell already occupied', undefined, 'CELL_OCCUPIED')
  }

  const board = cloneBoard(game.board)
  board[index] = playerSymbol

  const { update } = makeUpdatePayload(game, board, playerSymbol)

  const { data, error, count } = await client
    .from('games')
    .update<GameUpdate>(update)
    .eq('id', gameId)
    .eq('version', game.version)
    .select()
    .maybeSingle()

  if (error) {
    throw new GameServiceError('Failed to update game', error, error.code)
  }

  if (!data) {
    return {
      conflict: true,
      game: await fetchGame(client, gameId).then((g) => {
        if (!g) {
          throw new GameServiceError('Game not found after conflict', undefined, 'NOT_FOUND')
        }
        return g
      }),
    }
  }

  return { game: data, conflict: count === 0 }
}

export async function resetBoard(
  client: TypedSupabaseClient,
  game: GameRow,
): Promise<GameRow> {
  const now = new Date().toISOString()
  const nextTurnSymbol =
    game.last_move_by === 'X' ? ('O' as PlayerSymbol) : game.last_move_by === 'O' ? ('X' as PlayerSymbol) : 'X'

  const update: GameUpdate = {
    board: initialBoard(),
    status: 'in_progress',
    turn: nextTurnSymbol,
    last_move_by: null,
    last_move_at: null,
    updated_at: now,
    version: game.version + 1,
  }

  const { data, error } = await client
    .from('games')
    .update<GameUpdate>(update)
    .eq('id', game.id)
    .eq('version', game.version)
    .select()
    .single()

  if (error) {
    throw new GameServiceError('Failed to reset board', error, error.code)
  }

  return data
}

export async function resetScores(
  client: TypedSupabaseClient,
  game: GameRow,
): Promise<GameRow> {
  const now = new Date().toISOString()

  const update: GameUpdate = {
    board: initialBoard(),
    status: 'waiting',
    turn: 'X',
    score_x: 0,
    score_o: 0,
    last_move_by: null,
    last_move_at: null,
    updated_at: now,
    version: game.version + 1,
  }

  const { data, error } = await client
    .from('games')
    .update<GameUpdate>(update)
    .eq('id', game.id)
    .eq('version', game.version)
    .select()
    .single()

  if (error) {
    throw new GameServiceError('Failed to reset scores', error, error.code)
  }

  return data
}

