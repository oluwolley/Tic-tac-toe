export type GameStatus = 'waiting' | 'in_progress' | 'finished'

export type PlayerSymbol = 'X' | 'O'

export interface GameRow {
  id: string
  created_at: string
  updated_at: string
  status: GameStatus
  board: string[]
  turn: PlayerSymbol
  player_x: string | null
  player_o: string | null
  score_x: number
  score_o: number
  last_move_by: PlayerSymbol | null
  last_move_at: string | null
  version: number
}

export interface GameInsert {
  id?: string
  created_at?: string
  updated_at?: string
  status?: GameStatus
  board?: string[]
  turn?: PlayerSymbol
  player_x?: string | null
  player_o?: string | null
  score_x?: number
  score_o?: number
  last_move_by?: PlayerSymbol | null
  last_move_at?: string | null
  version?: number
}

export type GameUpdate = Partial<GameInsert>

export interface InviteRow {
  id: string
  created_at: string
  expires_at: string | null
  game_id: string
  code: string
}

export interface InviteInsert {
  id?: string
  created_at?: string
  expires_at?: string | null
  game_id: string
  code: string
}

export type InviteUpdate = Partial<InviteInsert>

export type Database = {
  public: {
    Tables: {
      games: {
        Row: GameRow
        Insert: GameInsert
        Update: GameUpdate
      }
      invites: {
        Row: InviteRow
        Insert: InviteInsert
        Update: InviteUpdate
      }
    }
  }
}

