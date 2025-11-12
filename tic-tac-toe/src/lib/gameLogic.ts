export const initialBoard = () => Array(9).fill('') as string[]

export const winningLines: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export function checkWinner(board: string[]) {
  for (const line of winningLines) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a] as 'X' | 'O', line }
    }
  }
  if (board.every((cell) => cell)) {
    return { winner: null, draw: true as const }
  }
  return { winner: null, draw: false as const }
}

export function isDraw(board: string[]) {
  return board.every((cell) => cell !== '') && checkWinner(board).winner === null
}

export function nextTurn(current: 'X' | 'O') {
  return current === 'X' ? 'O' : 'X'
}

export function cloneBoard(board: string[]) {
  return [...board]
}

