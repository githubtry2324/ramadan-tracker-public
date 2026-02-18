export interface Family {
  id: string
  slug: string
  name: string
  created_at: string
}

export interface Participant {
  id: string
  family_id: string
  name: string
  created_at: string
  order_index: number
}

export interface JuzCompletion {
  id: string
  participant_id: string
  juz_number: number
  round: number
  completed_at: string
}

export interface Database {
  public: {
    Tables: {
      families: {
        Row: Family
        Insert: Omit<Family, 'id' | 'created_at'>
        Update: Partial<Omit<Family, 'id' | 'created_at'>>
      }
      participants: {
        Row: Participant
        Insert: Omit<Participant, 'id' | 'created_at'>
        Update: Partial<Omit<Participant, 'id' | 'created_at'>>
      }
      juz_completions: {
        Row: JuzCompletion
        Insert: Omit<JuzCompletion, 'id' | 'completed_at'>
        Update: Partial<Omit<JuzCompletion, 'id' | 'completed_at'>>
      }
    }
  }
}
