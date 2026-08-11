import React, { useState } from 'react';
import { UserProfile, SynthesisReport } from '../../types';
import { INITIAL_REPORTS } from '../../data/mockDatabase';
import { saveSpiritualGoalsForUserDB } from '../../database/userDatabase';
import { 
  User, 
  BookOpen, 
  Sparkles, 
  Plus, 
  Check, 
  Settings, 
  Calendar, 
  Clock, 
  Award,
  ChevronRight,
  TrendingUp,
  FileText,
  Database
} from 'lucide-react';

interface UserDashboardProps {
  currentUser: UserProfile;
  savedReports?: SynthesisReport[];
  onOpenReport: (report: SynthesisReport) => void;
  onStartReading?: (tab: 'palm' | 'tarot') => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, savedReports, onOpenReport, onStartReading }) => {
  const [goals, setGoals] = useState<string[]>(currentUser.spiritualGoals || []);
  const [newGoal, setNewGoal] = useState<string>('');
  const [focusArea, setFocusArea] = useState<string>(currentUser.readingPreferences?.focusAreas[0] || 'Career Growth');

  // Filter reports strictly for the logged in user
  const allReports = savedReports || INITIAL_REPORTS;
  const reportsToDisplay = allReports.filter(
    rep => rep.userId === currentUser.id || rep.userName?.toLowerCase() === currentUser.name?.toLowerCase()
  );

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      const updated = [...goals, newGoal.trim()];
      setGoals(updated);
      setNewGoal('');
      if (currentUser.email) {
        saveSpiritualGoalsForUserDB(currentUser.email, updated);
      }
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Profile Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/60 shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-slate-950 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">{currentUser.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.email} • Age Group: {currentUser.ageGroup}</p>
            <div className="flex items-center space-x-2 mt-2 text-xs text-amber-300 font-medium">
              <Award className="w-4 h-4" />
              <span>Preferred Deck: {currentUser.readingPreferences?.preferredDeck}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1.5 shrink-0">
          <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold text-[11px]">
            <Database className="w-3.5 h-3.5" />
            <span>Database Storage Key</span>
          </div>
          <div className="font-mono text-[11px] text-white truncate max-w-[200px]" title={currentUser.email}>
            {currentUser.email}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>User Data Isolated & Syncing</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Reading History & Saved Reports */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">Reading History & Synthesized Reports</h3>
            </div>
            <span className="text-xs text-slate-400">{reportsToDisplay.length} Saved</span>
          </div>

          <div className="space-y-3">
            {reportsToDisplay.length > 0 ? (
              reportsToDisplay.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => onOpenReport(rep)}
                  className="p-4 bg-slate-950/80 border border-slate-800 hover:border-indigo-500/80 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-950/80 border border-indigo-800/60 rounded-xl text-indigo-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors flex items-center space-x-2">
                        <span>{rep.personality.archetype}</span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{rep.createdAt}</span>
                        </span>
                        <span>•</span>
                        <span className="text-amber-400 font-semibold">Score: {rep.weightedScore.overallScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400">
                    <span>View Report</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
                <h4 className="font-bold text-sm text-white">No Reading History Yet for {currentUser.name}</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Scan your palm or perform a Tarot reading to generate your first personalized AI synthesis report.
                </p>
                {onStartReading && (
                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <button
                      onClick={() => onStartReading('palm')}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
                    >
                      Start Palm Scan
                    </button>
                    <button
                      onClick={() => onStartReading('tarot')}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
                    >
                      Draw Tarot Cards
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Spiritual Goals & Preferences */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Spiritual Goals Manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">Spiritual Goal Tracker</h3>
            </div>

            <div className="space-y-2 text-xs">
              {goals.map((g, idx) => (
                <div key={idx} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{g}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Goal Input */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add new spiritual goal..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddGoal}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
