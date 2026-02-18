import Link from 'next/link'
import { Moon, Users, Trophy, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <div className="px-4 py-12 max-w-2xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-900 rounded-2xl mb-4">
            <Moon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">
            Quran Race
          </h1>
          <p className="text-stone-800 text-xl font-arabic mb-2" dir="rtl">
            سَابِقُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ
          </p>
          <p className="text-stone-500 text-sm italic">
            "Race toward forgiveness from your Lord"
          </p>
        </header>

        {/* Features */}
        <div className="grid gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 shadow-md flex items-start gap-4">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Family Leaderboards</h3>
              <p className="text-stone-500 text-sm">Track Quran reading progress together with your family or friends group</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-md flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Khatam Tracking</h3>
              <p className="text-stone-500 text-sm">Track multiple completions with stars and round colors</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-md flex items-start gap-4">
            <div className="p-2 bg-cyan-100 rounded-xl">
              <Zap className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Real-time Sync</h3>
              <p className="text-stone-500 text-sm">See progress updates instantly across all devices</p>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="text-center">
          <Link 
            href="/admin"
            className="inline-block bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            Admin Dashboard
          </Link>
          <p className="text-stone-400 text-xs mt-3">
            Create and manage family trackers
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center py-10 text-stone-400 text-xs">
          Built for Ramadan 1447 / 2026
        </footer>
      </div>
    </div>
  )
}
