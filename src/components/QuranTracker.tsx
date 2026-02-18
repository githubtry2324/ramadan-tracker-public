'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase'
import type { Participant, Family } from '@/types/database'
import confetti from 'canvas-confetti'
import { Plus, Star, Check, Pencil, X, Moon, Flame, Trash2 } from 'lucide-react'

const TOTAL_JUZ = 30
const RAMADAN_START = new Date(2026, 1, 17) // Feb 17, 2026 local time - Ramadan starts at Maghrib
const RAMADAN_DAYS = 30

interface ParticipantData extends Participant {
  completions: Map<string, boolean>
  currentRound: number
  totalCompleted: number
  streak: number
}

interface QuranTrackerProps {
  familySlug: string
}

const DEMO_PARTICIPANTS: Omit<Participant, 'family_id'>[] = [
  { id: '1', name: 'Demo User 1', created_at: new Date().toISOString(), order_index: 0 },
  { id: '2', name: 'Demo User 2', created_at: new Date().toISOString(), order_index: 1 },
]

const DEMO_STREAKS: Record<string, number> = { '1': 3, '2': 0 }

const ROUND_COLORS = [
  { solid: 'bg-emerald-500', text: 'text-emerald-600' },
  { solid: 'bg-pink-500', text: 'text-pink-600' },
  { solid: 'bg-violet-500', text: 'text-violet-600' },
  { solid: 'bg-cyan-500', text: 'text-cyan-600' },
  { solid: 'bg-amber-500', text: 'text-amber-600' },
  { solid: 'bg-fuchsia-500', text: 'text-fuchsia-600' },
]

export function QuranTracker({ familySlug }: QuranTrackerProps) {
  const [family, setFamily] = useState<Family | null>(null)
  const [familyNotFound, setFamilyNotFound] = useState(false)
  const [participants, setParticipants] = useState<ParticipantData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [addingParticipant, setAddingParticipant] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [localCompletions, setLocalCompletions] = useState<Map<string, Set<string>>>(new Map())
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null)

  const getRamadanProgress = () => {
    const now = new Date()
    const diffTime = now.getTime() - RAMADAN_START.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { daysLeft: RAMADAN_DAYS, percentage: 100, dayNumber: 0 }
    if (diffDays >= RAMADAN_DAYS) return { daysLeft: 0, percentage: 0, dayNumber: RAMADAN_DAYS }
    
    const daysLeft = RAMADAN_DAYS - diffDays
    const percentage = Math.round((daysLeft / RAMADAN_DAYS) * 100)
    return { daysLeft, percentage, dayNumber: diffDays + 1 }
  }

  const [ramadanProgress, setRamadanProgress] = useState(getRamadanProgress())

  useEffect(() => {
    const interval = setInterval(() => setRamadanProgress(getRamadanProgress()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Load family by slug
  useEffect(() => {
    const loadFamily = async () => {
      if (isDemoMode || !supabase) {
        setFamily({ id: 'demo', slug: familySlug, name: 'Demo Family', created_at: new Date().toISOString() })
        return
      }

      try {
        const { data, error } = await supabase
          .from('families')
          .select('*')
          .eq('slug', familySlug)
          .single()

        if (error || !data) {
          setFamilyNotFound(true)
          setLoading(false)
          return
        }

        setFamily(data)
      } catch (error) {
        console.error('Error loading family:', error)
        setFamilyNotFound(true)
        setLoading(false)
      }
    }

    loadFamily()
  }, [familySlug])

  const loadData = useCallback(async () => {
    if (!family) return

    if (isDemoMode) {
      const participantData: ParticipantData[] = DEMO_PARTICIPANTS.map(p => {
        const pCompletions = localCompletions.get(p.id) || new Set()
        const completions = new Map<string, boolean>()
        pCompletions.forEach(key => completions.set(key, true))
        
        let maxRound = 1
        pCompletions.forEach(key => {
          const round = parseInt(key.split('-')[1])
          if (round > maxRound) maxRound = round
        })

        let currentRoundComplete = true
        for (let j = 1; j <= TOTAL_JUZ; j++) {
          if (!completions.has(`${j}-${maxRound}`)) {
            currentRoundComplete = false
            break
          }
        }

        return {
          ...p,
          family_id: family.id,
          completions,
          currentRound: currentRoundComplete ? maxRound + 1 : maxRound,
          totalCompleted: pCompletions.size,
          streak: DEMO_STREAKS[p.id] || 0
        }
      })
      setParticipants(participantData)
      setLoading(false)
      return
    }

    try {
      const [participantsRes, completionsRes] = await Promise.all([
        supabase!.from('participants').select('*').eq('family_id', family.id).order('order_index'),
        supabase!.from('juz_completions').select('*, participants!inner(family_id)').eq('participants.family_id', family.id)
      ])

      if (participantsRes.error) throw participantsRes.error

      const completionsByParticipant = new Map<string, unknown[]>()
      ;(completionsRes.data || []).forEach((c: unknown) => {
        const completion = c as { participant_id: string; juz_number: number; round: number }
        const existing = completionsByParticipant.get(completion.participant_id) || []
        existing.push(completion)
        completionsByParticipant.set(completion.participant_id, existing)
      })

      const participantData: ParticipantData[] = (participantsRes.data || []).map((p: unknown) => {
        const participant = p as Participant
        const completions = new Map<string, boolean>()
        const pCompletions = completionsByParticipant.get(participant.id) || []
        
        let maxRound = 1
        pCompletions.forEach((c: unknown) => {
          const completion = c as { juz_number: number; round: number }
          completions.set(`${completion.juz_number}-${completion.round}`, true)
          if (completion.round > maxRound) maxRound = completion.round
        })

        let currentRoundComplete = true
        for (let j = 1; j <= TOTAL_JUZ; j++) {
          if (!completions.has(`${j}-${maxRound}`)) {
            currentRoundComplete = false
            break
          }
        }

        return {
          ...participant,
          completions,
          currentRound: currentRoundComplete ? maxRound + 1 : maxRound,
          totalCompleted: pCompletions.length,
          streak: 0
        }
      })

      setParticipants(participantData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [family, localCompletions])

  useEffect(() => {
    if (family) {
      loadData()
      if (!isDemoMode && supabase) {
        const participantsChannel = supabase
          .channel(`participants-${family.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `family_id=eq.${family.id}` }, loadData)
          .subscribe()
        const completionsChannel = supabase
          .channel(`completions-${family.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'juz_completions' }, loadData)
          .subscribe()
        return () => {
          supabase!.removeChannel(participantsChannel)
          supabase!.removeChannel(completionsChannel)
        }
      }
    }
  }, [family, loadData])

  const triggerConfetti = (isBigMilestone: boolean) => {
    const colors = ['#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
    if (isBigMilestone) {
      const duration = 4000
      const end = Date.now() + duration
      const frame = () => {
        confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors })
        confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    } else {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors, scalar: 1.2 })
    }
  }

  const toggleJuz = async (participantId: string, juzNumber: number, round: number, isCompleted: boolean) => {
    const key = `${juzNumber}-${round}`
    
    if (isDemoMode) {
      setLocalCompletions(prev => {
        const newMap = new Map(prev)
        const participantSet = new Set(prev.get(participantId) || [])
        
        if (isCompleted) {
          participantSet.delete(key)
        } else {
          participantSet.add(key)
          let completedCount = 0
          for (let j = 1; j <= TOTAL_JUZ; j++) {
            if (participantSet.has(`${j}-${round}`)) completedCount++
          }
          if (completedCount % 5 === 0) {
            triggerConfetti(completedCount === TOTAL_JUZ)
          }
        }
        
        newMap.set(participantId, participantSet)
        return newMap
      })
      return
    }

    try {
      if (isCompleted) {
        await supabase!.from('juz_completions').delete()
          .eq('participant_id', participantId).eq('juz_number', juzNumber).eq('round', round)
      } else {
        await supabase!.from('juz_completions')
          .insert({ participant_id: participantId, juz_number: juzNumber, round })
        const participant = participants.find(p => p.id === participantId)
        if (participant) {
          let completedCount = 1
          for (let j = 1; j <= TOTAL_JUZ; j++) {
            if (j !== juzNumber && participant.completions.has(`${j}-${round}`)) completedCount++
          }
          if (completedCount % 5 === 0) {
            triggerConfetti(completedCount === TOTAL_JUZ)
          }
        }
      }
    } catch (error) {
      console.error('Error toggling juz:', error)
    }
  }

  const addParticipant = async () => {
    if (!newParticipantName.trim() || !family) return
    if (isDemoMode) {
      alert('Connect Supabase to add participants')
      setAddingParticipant(false)
      return
    }
    try {
      await supabase!.from('participants').insert({ 
        name: newParticipantName.trim(), 
        family_id: family.id,
        order_index: participants.length 
      })
      setNewParticipantName('')
      setAddingParticipant(false)
    } catch (error) {
      console.error('Error adding participant:', error)
    }
  }

  const updateName = async (id: string) => {
    if (!newName.trim()) return
    if (isDemoMode) { setEditingName(null); return }
    try {
      await supabase!.from('participants').update({ name: newName.trim() }).eq('id', id)
      setEditingName(null)
      setNewName('')
    } catch (error) {
      console.error('Error updating name:', error)
    }
  }

  const deleteParticipant = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will remove all their progress.`)) return
    if (isDemoMode) { alert('Connect Supabase to delete participants'); return }
    try {
      await supabase!.from('participants').delete().eq('id', id)
    } catch (error) {
      console.error('Error deleting participant:', error)
    }
  }

  const getCompletedRounds = (participant: ParticipantData): number => {
    let rounds = 0, round = 1
    while (true) {
      let complete = true
      for (let j = 1; j <= TOTAL_JUZ; j++) {
        if (!participant.completions.has(`${j}-${round}`)) { complete = false; break }
      }
      if (complete) { rounds++; round++ } else break
    }
    return rounds
  }

  const getCompletedInRound = (participant: ParticipantData): number => {
    let completed = 0
    for (let j = 1; j <= TOTAL_JUZ; j++) {
      if (participant.completions.has(`${j}-${participant.currentRound}`)) completed++
    }
    return completed
  }

  const sortedParticipants = [...participants].sort((a, b) => {
    const aScore = getCompletedRounds(a) * 30 + getCompletedInRound(a)
    const bScore = getCompletedRounds(b) * 30 + getCompletedInRound(b)
    return bScore - aScore
  })

  if (familyNotFound) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Family Not Found</h1>
        <p className="text-stone-500">This tracker link doesn't exist or has been removed.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Moon className="w-12 h-12 text-cyan-600 animate-pulse" />
      </div>
    )
  }

  const progressPercent = 100 - ramadanProgress.percentage

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <div className="px-4 py-6 max-w-2xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-5 animate-fade-in">
          <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-1">
            Quran Race
          </h1>
          {family && <p className="text-stone-500 text-sm mb-3">{family.name}</p>}
          <p className="text-stone-800 text-2xl font-arabic mb-2" dir="rtl">
            سَابِقُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ
          </p>
          <p className="text-stone-500 text-sm italic">
            "Race toward forgiveness from your Lord"
          </p>
        </header>

        {/* Progress Bar - With depth and color phases */}
        {(() => {
          let barColor = 'bg-emerald-500'
          if (ramadanProgress.dayNumber > 10 && ramadanProgress.dayNumber <= 20) {
            barColor = 'bg-amber-500'
          } else if (ramadanProgress.dayNumber > 20) {
            barColor = 'bg-red-500'
          }
          
          return (
            <div className="mb-5 rounded-2xl bg-stone-900 p-5 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-stone-400">Day {ramadanProgress.dayNumber} of 30</span>
                <span className="text-2xl font-black text-white drop-shadow-lg">{ramadanProgress.daysLeft} days left</span>
              </div>
              <div className="h-4 bg-stone-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${barColor} rounded-full transition-all duration-1000`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )
        })()}

        {/* Stats */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 bg-white rounded-xl py-2 px-4 shadow-md text-center animate-fade-in">
            <p className="text-2xl font-black text-stone-900">{participants.length}</p>
            <p className="text-xs text-stone-500 font-semibold tracking-wider">RACERS</p>
          </div>
          <div className="flex-1 bg-white rounded-xl py-2 px-4 shadow-md text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
            <p className="text-2xl font-black text-amber-500">{participants.reduce((acc, p) => acc + getCompletedRounds(p), 0)}</p>
            <p className="text-xs text-stone-500 font-semibold tracking-wider">KHATAMS</p>
          </div>
        </div>

        {/* Intention Banner */}
        <div className="mb-5 bg-stone-800 rounded-xl p-3 text-center animate-fade-in">
          <p className="text-stone-300 text-xs tracking-wide">
            Renew your intention daily. This leaderboard is for tracking, you are reading it for <span className="font-semibold text-white">Allah</span>.
          </p>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2">
          {sortedParticipants.map((p, idx) => {
            const completedRounds = getCompletedRounds(p)
            const roundColors = ROUND_COLORS[(p.currentRound - 1) % ROUND_COLORS.length]
            const isExpanded = expandedPerson === p.id

            return (
              <div 
                key={p.id} 
                className={`bg-white rounded-2xl overflow-hidden animate-fade-in transition-all duration-300 shadow-md ${
                  idx === 0 ? 'ring-2 ring-amber-500' : ''
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div 
                  className="p-3 flex items-center gap-2 cursor-pointer active:bg-stone-50"
                  onClick={() => setExpandedPerson(isExpanded ? null : p.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {editingName === p.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateName(p.id)}
                            className="flex-1 bg-stone-100 rounded px-2 py-1 text-sm outline-none border"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button onClick={(e) => { e.stopPropagation(); updateName(p.id) }} className="text-emerald-500">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-base truncate">{p.name}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingName(p.id); setNewName(p.name) }} 
                            className="opacity-30 hover:opacity-100"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteParticipant(p.id, p.name) }} 
                            className="opacity-30 hover:opacity-100 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      {p.streak > 0 && (
                        <span className="flex items-center bg-orange-100 rounded-full px-2 py-0.5 animate-pulse">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span className="text-xs font-black text-orange-600 ml-0.5">{p.streak}</span>
                        </span>
                      )}

                      <span className="text-xs font-semibold text-stone-400">Round {p.currentRound}</span>
                      {completedRounds > 0 && (
                        <div className="flex items-center">
                          {Array.from({ length: Math.min(completedRounds, 3) }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500 -ml-0.5" />
                          ))}
                          {completedRounds > 3 && <span className="text-amber-600 text-xs font-bold">+{completedRounds - 3}</span>}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 grid overflow-hidden" style={{ gridTemplateColumns: 'repeat(30, 1fr)' }}>
                      {Array.from({ length: TOTAL_JUZ }).map((_, i) => {
                        const juzNum = i + 1
                        const isCompleted = p.completions.has(`${juzNum}-${p.currentRound}`)
                        return (
                          <div 
                            key={i}
                            className={`h-7 flex items-center justify-center text-[7px] font-bold transition-all duration-300 border-r border-black/30 last:border-r-0 ${
                              isCompleted ? `${roundColors.solid} text-white` : 'bg-stone-300 text-stone-500'
                            }`}
                          >
                            {juzNum}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className={`text-stone-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 animate-slide-down">
                    <div className="grid grid-cols-10 gap-1">
                      {Array.from({ length: TOTAL_JUZ }).map((_, i) => {
                        const juzNum = i + 1
                        const isCompleted = p.completions.has(`${juzNum}-${p.currentRound}`)

                        return (
                          <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); toggleJuz(p.id, juzNum, p.currentRound, isCompleted) }}
                            className={`aspect-square rounded text-xs font-bold flex items-center justify-center transition-all duration-200 active:scale-90 ${
                              isCompleted 
                                ? `${roundColors.solid} text-white shadow-sm` 
                                : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                            }`}
                          >
                            {isCompleted ? <Check className="w-4 h-4" /> : juzNum}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {addingParticipant ? (
            <div className="bg-white rounded-xl border border-stone-200 p-3 flex items-center gap-2 animate-fade-in">
              <input
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                placeholder="Name"
                className="flex-1 bg-stone-100 rounded-lg px-3 py-2 text-sm outline-none border border-stone-200"
                autoFocus
              />
              <button onClick={addParticipant} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors">
                Add
              </button>
              <button onClick={() => setAddingParticipant(false)} className="text-stone-400 hover:text-stone-600 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingParticipant(true)}
              className="w-full p-4 text-sm text-stone-400 hover:text-cyan-600 bg-white rounded-xl border border-dashed border-stone-300 hover:border-cyan-400 flex items-center justify-center gap-2 transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Racer
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-stone-400 fill-stone-400" /> Khatam
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-stone-400" /> Streak
          </span>
          <span>Tap to expand</span>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-stone-300 text-xs">
          May Allah accept your ibadah
          {isDemoMode && <span className="text-stone-400 ml-2">· Demo</span>}
        </footer>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
