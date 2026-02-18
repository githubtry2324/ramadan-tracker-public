'use client'

import { useEffect, useState } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase'
import type { Family } from '@/types/database'
import { Plus, Copy, Trash2, Users, Check } from 'lucide-react'

export default function AdminPage() {
  const [families, setFamilies] = useState<(Family & { participantCount: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [newFamilySlug, setNewFamilySlug] = useState('')
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Simple password check (set ADMIN_PASSWORD in env)
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === adminPassword) {
      setAuthenticated(true)
      localStorage.setItem('admin_auth', 'true')
    } else {
      alert('Incorrect password')
    }
  }

  useEffect(() => {
    if (localStorage.getItem('admin_auth') === 'true') {
      setAuthenticated(true)
    }
  }, [])

  const loadFamilies = async () => {
    if (isDemoMode || !supabase) {
      setFamilies([
        { id: '1', slug: 'khan', name: 'Khan Family', created_at: new Date().toISOString(), participantCount: 4 },
        { id: '2', slug: 'smith', name: 'Smith Family', created_at: new Date().toISOString(), participantCount: 3 },
      ])
      setLoading(false)
      return
    }

    try {
      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('*')
        .order('created_at', { ascending: false })

      if (familiesError) throw familiesError

      // Get participant counts
      const familiesWithCounts = await Promise.all(
        (familiesData || []).map(async (family) => {
          const { count } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', family.id)
          return { ...family, participantCount: count || 0 }
        })
      )

      setFamilies(familiesWithCounts)
    } catch (error) {
      console.error('Error loading families:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authenticated) {
      loadFamilies()
    }
  }, [authenticated])

  const createFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFamilyName.trim() || !newFamilySlug.trim()) return
    
    const slug = newFamilySlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    
    if (isDemoMode || !supabase) {
      alert('Connect Supabase to create families')
      return
    }

    setAdding(true)
    try {
      const { error } = await supabase
        .from('families')
        .insert({ name: newFamilyName.trim(), slug })

      if (error) {
        if (error.code === '23505') {
          alert('A family with this URL slug already exists')
        } else {
          throw error
        }
      } else {
        setNewFamilyName('')
        setNewFamilySlug('')
        loadFamilies()
      }
    } catch (error) {
      console.error('Error creating family:', error)
      alert('Failed to create family')
    } finally {
      setAdding(false)
    }
  }

  const deleteFamily = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and ALL their participants? This cannot be undone.`)) return
    
    if (isDemoMode || !supabase) return

    try {
      await supabase.from('families').delete().eq('id', id)
      loadFamilies()
    } catch (error) {
      console.error('Error deleting family:', error)
    }
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/family/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold text-stone-900 mb-4 text-center">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full bg-stone-100 rounded-lg px-4 py-3 mb-4 outline-none border border-stone-200 focus:border-cyan-500"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-black text-stone-900">Admin Dashboard</h1>
          <p className="text-stone-500 mt-1">Manage Quran Race families</p>
        </header>

        {/* Create New Family */}
        <form onSubmit={createFamily} className="bg-white rounded-2xl p-4 shadow-md mb-6">
          <h2 className="font-bold text-lg mb-3">Create New Family</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={newFamilyName}
              onChange={(e) => {
                setNewFamilyName(e.target.value)
                if (!newFamilySlug || newFamilySlug === generateSlug(newFamilyName)) {
                  setNewFamilySlug(generateSlug(e.target.value))
                }
              }}
              placeholder="Family name (e.g., Smith Family)"
              className="w-full bg-stone-100 rounded-lg px-4 py-3 outline-none border border-stone-200 focus:border-cyan-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-stone-400 text-sm">/family/</span>
              <input
                type="text"
                value={newFamilySlug}
                onChange={(e) => setNewFamilySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="url-slug"
                className="flex-1 bg-stone-100 rounded-lg px-4 py-3 outline-none border border-stone-200 focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !newFamilyName.trim() || !newFamilySlug.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-stone-300 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {adding ? 'Creating...' : 'Create Family'}
            </button>
          </div>
        </form>

        {/* Families List */}
        <div className="space-y-3">
          <h2 className="font-bold text-lg">Families ({families.length})</h2>
          
          {loading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-stone-400">Loading...</div>
          ) : families.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-stone-400">
              No families yet. Create one above!
            </div>
          ) : (
            families.map((family) => (
              <div key={family.id} className="bg-white rounded-2xl p-4 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{family.name}</h3>
                    <p className="text-stone-400 text-sm">/family/{family.slug}</p>
                    <div className="flex items-center gap-1 mt-1 text-stone-500 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{family.participantCount} participants</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(family.slug)}
                      className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-500 hover:text-cyan-600"
                      title="Copy link"
                    >
                      {copied === family.slug ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => deleteFamily(family.id, family.name)}
                      className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-500 hover:text-red-500"
                      title="Delete family"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            localStorage.removeItem('admin_auth')
            setAuthenticated(false)
          }}
          className="mt-6 text-stone-400 hover:text-stone-600 text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
