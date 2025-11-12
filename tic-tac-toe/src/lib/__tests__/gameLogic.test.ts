import { describe, expect, it } from 'vitest'

import { checkWinner, initialBoard, isDraw, winningLines } from '../gameLogic'

describe('checkWinner', () => {
  it('detects a winner for every winning line', () => {
    for (const line of winningLines) {
      const board = initialBoard()
      for (const index of line) {
        board[index] = 'X'
      }

      const result = checkWinner(board)
      expect(result.winner).toBe('X')
      expect(result.line).toEqual(line)
      expect(result.draw).toBeUndefined()
    }
  })

  it('detects a draw when the board is full without winner', () => {
    const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']
    const result = checkWinner(board)

    expect(result.winner).toBeNull()
    expect(result.draw).toBeTruthy()
    expect(isDraw(board)).toBe(true)
  })

  it('returns no winner for an unfinished game', () => {
    const board = initialBoard()
    board[0] = 'X'
    const result = checkWinner(board)
    expect(result.winner).toBeNull()
    expect(result.draw).toBe(false)
  })
})

