import { beforeEach, describe, expect, it } from 'vitest'

import type { GameRow, PlayerSymbol } from '../database.types'
import { initialBoard, winningLines } from '../gameLogic'
import { updateGameMove } from '../gameService'

type SupabaseQueryResult<T> = {
  data: T | null
  error: null
  count?: number | null
}

class SupabaseClientMock {
  private state: GameRow
  private conflictSnapshot: GameRow | null = null

  constructor(initialState: GameRow) {
    this.state = { ...initialState, board: [...initialState.board] }
  }

  simulateConflict(nextState: GameRow) {
    this.conflictSnapshot = { ...nextState, board: [...nextState.board] }
  }

  from(table: string) {
    if (table !== 'games') {
      throw new Error(`Unsupported table ${table}`)
    }

    return {
      select: () => ({
        eq: (_column: string, value: string) => ({
          single: async (): Promise<SupabaseQueryResult<GameRow>> => {
            if (value !== this.state.id) {
              return { data: null, error: null }
            }
            return { data: this.cloneState(), error: null }
          },
        }),
      }),
      update: (payload: Partial<GameRow>) => ({
        eq: (column: string, value: unknown) => ({
          eq: (versionColumn: string, versionValue: unknown) => ({
            select: () => ({
              maybeSingle: async (): Promise<SupabaseQueryResult<GameRow>> => {
                if (column !== 'id' || value !== this.state.id) {
                  return { data: null, error: null, count: 0 }
                }

                if (versionColumn === 'version' && versionValue !== this.state.version) {
                  return { data: null, error: null, count: 0 }
                }

                if (this.conflictSnapshot) {
                  this.state = this.conflictSnapshot
                  this.conflictSnapshot = null
                  return { data: null, error: null, count: 0 }
                }

                this.state = {
                  ...this.state,
                  ...payload,
                  board: payload.board ? [...payload.board] : [...this.state.board],
                } as GameRow

                return { data: this.cloneState(), error: null, count: 1 }
              },
            }),
            single: async (): Promise<SupabaseQueryResult<GameRow>> => {
              if (column !== 'id' || value !== this.state.id) {
                return { data: null, error: null }
              }

              this.state = {
                ...this.state,
                ...payload,
                board: payload.board ? [...payload.board] : [...this.state.board],
              } as GameRow

              return { data: this.cloneState(), error: null }
            },
          }),
        }),
      }),
    }
  }

  private cloneState(): GameRow {
    return { ...this.state, board: [...this.state.board] }
  }
}

const createGame = (overrides: Partial<GameRow> = {}): GameRow => {
  const board = overrides.board ? [...overrides.board] : initialBoard()

  return {
    id: 'game-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'in_progress',
    turn: 'X',
    player_x: 'Alice',
    player_o: 'Bob',
    score_x: 0,
    score_o: 0,
    last_move_by: null,
    last_move_at: null,
    version: 0,
    ...overrides,
    board,
  }
}

describe('updateGameMove', () => {
  let client: SupabaseClientMock
  let baseState: GameRow

  beforeEach(() => {
    baseState = createGame()
    client = new SupabaseClientMock(baseState)
  })

  it('applies a valid move and swaps turn', async () => {
    const result = await updateGameMove(client as never, baseState.id, 0, 'X')

    expect(result.conflict).toBeFalsy()
    expect(result.game.board[0]).toBe('X')
    expect(result.game.turn).toBe('O')
    expect(result.game.version).toBe(1)
    expect(result.game.last_move_by).toBe('X')
  })

  it('increments score and finishes the game when a player wins', async () => {
    const winningBoard = initialBoard()
    const line = winningLines[0]
    winningBoard[line[0]] = 'X'
    winningBoard[line[1]] = 'X'

    baseState = createGame({ board: winningBoard, version: 2 })
    client = new SupabaseClientMock(baseState)

    const result = await updateGameMove(client as never, baseState.id, line[2], 'X')

    expect(result.game.status).toBe('finished')
    expect(result.game.score_x).toBe(1)
    expect(result.game.turn).toBe('X')
  })

  it('returns conflict when version mismatch occurs', async () => {
    const remoteState = {
      ...baseState,
      board: ['X', '', '', '', '', '', '', '', ''],
      version: 1,
      turn: 'O' as PlayerSymbol,
    }

    client.simulateConflict(remoteState)

    const result = await updateGameMove(client as never, baseState.id, 1, 'X')

    expect(result.conflict).toBe(true)
    expect(result.game.board[0]).toBe('X')
    expect(result.game.version).toBe(1)
  })
})

