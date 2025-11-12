import { useMemo, useRef } from 'react'

import clsx from 'clsx'

type PlayerSymbol = 'X' | 'O' | ''

export interface BoardProps {
  board: PlayerSymbol[]
  onSelect: (index: number) => void
  disabled?: boolean
  winningLine?: number[] | null
  pendingIndex?: number | null
  lastMoveBy?: PlayerSymbol
}

const symbolStyles: Record<'X' | 'O', string> = {
  X: 'text-sky-300',
  O: 'text-emerald-300',
}

const moveFocus = (index: number, key: string) => {
  const row = Math.floor(index / 3)
  const col = index % 3

  switch (key) {
    case 'ArrowUp':
      return col + (row === 0 ? 2 : row - 1) * 3
    case 'ArrowDown':
      return col + (row === 2 ? 0 : row + 1) * 3
    case 'ArrowLeft':
      return row * 3 + (col === 0 ? 2 : col - 1)
    case 'ArrowRight':
      return row * 3 + (col === 2 ? 0 : col + 1)
    default:
      return index
  }
}

export function Board({
  board,
  onSelect,
  disabled = false,
  winningLine,
  pendingIndex,
}: BoardProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  const winningSet = useMemo(() => new Set(winningLine ?? []), [winningLine])

  return (
    <div className="board-grid" role="grid" aria-label="Tic-Tac-Toe board">
      {board.map((value, index) => {
        const isWinning = winningSet.has(index)
        const pending = pendingIndex === index
        const isEmpty = value === ''
        const ariaLabel = isEmpty ? `Cell ${index + 1}, empty` : `Cell ${index + 1}, ${value}`

        return (
          <button
            key={index}
            type="button"
            role="gridcell"
            aria-label={ariaLabel}
            aria-disabled={disabled || !isEmpty}
            disabled={disabled || !isEmpty}
            className={clsx('board-cell', {
              'board-cell--winning': isWinning,
              'ring-2 ring-offset-2 ring-accent ring-offset-slate-900 animate-pulse': pending,
            })}
            onClick={() => onSelect(index)}
            onKeyDown={(event) => {
              if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                return
              }
              event.preventDefault()
              const nextIndex = moveFocus(index, event.key)
              buttonRefs.current[nextIndex]?.focus()
            }}
            ref={(element) => {
              buttonRefs.current[index] = element
            }}
          >
            <span
              className={clsx('board-cell__value', {
                [symbolStyles.X]: value === 'X',
                [symbolStyles.O]: value === 'O',
                'text-slate-500': value === '',
              })}
            >
              {value}
            </span>
          </button>
        )
      })}
    </div>
  )
}

