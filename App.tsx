import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, PalmFeatures, TarotReadingSession, SystemNotification, SynthesisReport } from './types';
import { INITIAL_USERS } from './data/mockDatabase';
import {
  getReportsForUserDB,
  saveReportForUserDB,
  savePalmScanForUserDB,
  saveTarotSessionForUserDB,
  upsertUserAccountDB,
  getNotificationsForUserDB,
  markNotificationReadDB,
  getUserRecordByEmailDB
} from './database/userDatabase';
import { Navbar } from './components/Navbar';
import { FrontPageLanding } from './components/FrontPageLanding';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthModal } from './components/AuthModal';
import { PalmScanner } from './components/PalmScanner';
import { TarotStudio } from './components/TarotStudio';
import { UnifiedReadingView } from './components/UnifiedReadingView';
import { UserDashboard } from './components/Dashboards/UserDashboard';
import { ReaderDashboard } from './components/Dashboards/ReaderDashboard';
import { ConsultantDashboard } from './components/Dashboards/ConsultantDashboard';
import { AdminDashboard } from './components/Dashboards/AdminDashboard';
import { NotificationCenter } from './components/NotificationCenter';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'palm' | 'tarot' | 'synthesis' | 'dashboard' | 'admin'>('home');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(true);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => 
    getNotificationsForUserDB(INITIAL_USERS[0].email)
  );

  const [currentPalm, setCurrentPalm] = useState<PalmFeatures | null>(null);
  const [currentTarot, setCurrentTarot] = useState<TarotReadingSession | null>(null);
  const [savedReports, setSavedReports] = useState<SynthesisReport[]>(() => 
    getReportsForUserDB(INITIAL_USERS[0].email)
  );
  const [selectedReport, setSelectedReport] = useState<SynthesisReport | null>(null);

  // Synchronize state when user changes or logs in
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setSavedReports(getReportsForUserDB(currentUser.email));
      setNotifications(getNotificationsForUserDB(currentUser.email));
    }
  }, [currentUser]);

  const handlePalmAnalyzed = (features: PalmFeatures) => {
    setCurrentPalm(features);
    savePalmScanForUserDB(currentUser.email, features);

    const today = new Date().toISOString().split('T')[0];
    const newReport: SynthesisReport = {
      id: `report_palm_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: today,
      palmAnalysis: features,
      weightedScore: {
        palmConfidence: Math.round((features.detectionConfidence || 0.9) * 100),
        tarotRelevance: currentTarot ? 90 : 85,
        personalityAlignment: 92,
        userContextRelevance: 88,
        readingConsistency: 95,
        overallScore: Math.round(((features.detectionConfidence || 0.9) * 100 + 90) / 2)
      },
      personality: {
        archetype: `${features.handType.split(' ')[0]} Palm Synthesis`,
        elementalBalance: { fire: 30, water: 25, air: 25, earth: 20 },
        strengths: [
          `Life Line: ${features.lifeLine.quality}`,
          `Head Line: ${features.headLine.quality}`,
          'Visionary Intuition',
          'Strong Vitality'
        ],
        weaknesses: ['Managing high energy bursts', 'Maintaining routine focus'],
        behavioralInsights: [
          `Your ${features.handType} reveals high intuitive adaptability and dynamic personal drive.`,
          features.lifeLine.interpretation
        ],
        growthRecommendations: [
          'Practice 10 minutes of daily grounding breathwork.',
          'Align your core project goals with your primary Life Line markers.'
        ]
      },
      lifeTrends: {
        currentPhase: 'Expansion & Intuitive Discovery',
        opportunites: ['Leadership breakthrough in upcoming projects', 'Enhanced spiritual clarity'],
        challenges: ['Filtering external distractions'],
        timeline: [
          { horizon: 'Next 3 Months', prediction: features.fateLine.interpretation, focusCategory: 'Career' },
          { horizon: '6 Months', prediction: features.heartLine.interpretation, focusCategory: 'Relationships' },
          { horizon: '1 Year', prediction: features.headLine.interpretation, focusCategory: 'Spiritual' }
        ]
      },
      synthesizedGuidance: {
        executiveSummary: `Palm Scan Captured (${features.handType}): Your palm lines demonstrate key potential for career advancement and mental clarity.`,
        personalityOverview: `Head Line (${features.headLine.length}): ${features.headLine.interpretation}`,
        relationshipInsights: `Heart Line (${features.heartLine.length}): ${features.heartLine.interpretation}`,
        careerAndFinance: `Fate Line (${features.fateLine.length}): ${features.fateLine.interpretation}`,
        healthAndWellness: `Life Line (${features.lifeLine.length}): ${features.lifeLine.interpretation}`,
        spiritualActionPlan: [
          'Perform morning visual alignment exercises.',
          'Journal daily synchronicities and intuitive hits.'
        ]
      }
    };

    saveReportForUserDB(currentUser.email, newReport);
    setSavedReports(getReportsForUserDB(currentUser.email));
    setSelectedReport(newReport);
  };

  const handleTarotAnalyzed = (session: TarotReadingSession) => {
    setCurrentTarot(session);
    saveTarotSessionForUserDB(currentUser.email, session);

    const today = new Date().toISOString().split('T')[0];
    const newReport: SynthesisReport = {
      id: `report_tarot_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: today,
      tarotSession: session,
      weightedScore: {
        palmConfidence: currentPalm ? Math.round((currentPalm.detectionConfidence || 0.9) * 100) : 88,
        tarotRelevance: 95,
        personalityAlignment: 91,
        userContextRelevance: 90,
        readingConsistency: 96,
        overallScore: 92.5
      },
      personality: {
        archetype: `${session.spreadTitle} Synthesis`,
        elementalBalance: { fire: 35, water: 30, air: 20, earth: 15 },
        strengths: session.drawnCards.map(c => `${c.positionName}: ${c.card.name}`),
        weaknesses: ['Overthinking card guidance', 'Impatience for outcomes'],
        behavioralInsights: [
          `Inquiry Asked: "${session.question}"`,
          session.aiInterpretation
        ],
        growthRecommendations: [
          'Reflect on key drawn cards during quiet contemplation.',
          'Review the messages weekly.'
        ]
      },
      lifeTrends: {
        currentPhase: `Tarot Alignment: ${session.spreadTitle}`,
        opportunites: ['Deep energetic alignment', 'Clarity on inquiry'],
        challenges: ['Navigating reversed card warnings'],
        timeline: session.drawnCards.slice(0, 3).map((c, i) => ({
          horizon: i === 0 ? 'Present Energy' : i === 1 ? 'Near Future' : 'Outcome',
          prediction: `${c.card.name}: ${c.isReversed ? c.card.meaningReversed : c.card.meaningUpright}`,
          focusCategory: 'Spiritual'
        }))
      },
      synthesizedGuidance: {
        executiveSummary: `Tarot Reading (${session.spreadTitle}): ${session.aiInterpretation}`,
        personalityOverview: session.aiInterpretation,
        relationshipInsights: `Drawn cards illuminate current relational energy: ${session.drawnCards[0]?.card.name || 'Alignment'}.`,
        careerAndFinance: `Career Focus: ${session.drawnCards[1]?.card.name || 'Clarity'} indicates steady progress.`,
        healthAndWellness: 'Maintain inner balance and emotional grounding.',
        spiritualActionPlan: [
          'Meditate on the archetype of your key drawn card.',
          'Trust your inner wisdom and act on high-vibration insights.'
        ]
      }
    };

    saveReportForUserDB(currentUser.email, newReport);
    setSavedReports(getReportsForUserDB(currentUser.email));
    setSelectedReport(newReport);
  };

  const handleLoginSuccess = (usr: UserProfile, isFirstLogin?: boolean) => {
    setCurrentUser(usr);
    setIsLoggedIn(true);
    setIsAuthOpen(false);
    setActiveTab('home');

    // Ensure database record exists for logged in user email
    getUserRecordByEmailDB(usr.email, usr);
    setSavedReports(getReportsForUserDB(usr.email));
    setNotifications(getNotificationsForUserDB(usr.email));
    setCurrentPalm(null);
    setCurrentTarot(null);

    if (isFirstLogin) {
      setTimeout(() => {
        setIsProfileOpen(true);
      }, 300);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('jwt_token');
    setIsAuthOpen(true);
    setCurrentPalm(null);
    setCurrentTarot(null);
    setSelectedReport(null);
  };

  const handleTabSelect = (tab: 'home' | 'palm' | 'tarot' | 'synthesis' | 'dashboard' | 'admin') => {
    if (!isLoggedIn && tab !== 'home') {
      setIsAuthOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    const cleanedProfile: UserProfile = {
      ...updated,
      isFirstTime: false
    };
    setCurrentUser(cleanedProfile);

    // Persist complete credentials and user account in userDatabase
    upsertUserAccountDB(cleanedProfile);
  };

  const handleMarkRead = (id: string) => {
    const updated = markNotificationReadDB(currentUser.email, id);
    setNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#050507] text-[#E0E0E6] font-sans selection:bg-violet-600 selection:text-white flex flex-col">
      
      {/* Top Header Navigation */}
      <Navbar
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        activeTab={activeTab}
        setActiveTab={handleTabSelect}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'home' && (
              <FrontPageLanding
                currentUser={currentUser}
                onNavigate={(tab) => handleTabSelect(tab)}
                onOpenProfile={() => setIsProfileOpen(true)}
              />
            )}

            {activeTab === 'palm' && (
              <PalmScanner
                onPalmAnalyzed={handlePalmAnalyzed}
                userAgeGroup={currentUser.ageGroup}
                userGoals={currentUser.spiritualGoals}
              />
            )}

            {activeTab === 'tarot' && (
              <TarotStudio
                onTarotAnalyzed={handleTarotAnalyzed}
                userContext={currentUser.spiritualGoals?.join(', ')}
              />
            )}

            {activeTab === 'synthesis' && (
              <UnifiedReadingView
                currentPalm={currentPalm}
                currentTarot={currentTarot}
                currentUser={currentUser}
                selectedReport={selectedReport}
              />
            )}

            {activeTab === 'dashboard' && (
              <>
                {currentUser.role === 'user' && (
                  <UserDashboard
                    currentUser={currentUser}
                    savedReports={savedReports}
                    onOpenReport={(rep) => {
                      setSelectedReport(rep);
                      setActiveTab('synthesis');
                    }}
                    onStartReading={(tab) => setActiveTab(tab)}
                  />
                )}
                {currentUser.role === 'reader' && (
                  <ReaderDashboard currentUser={currentUser} />
                )}
                {currentUser.role === 'consultant' && (
                  <ConsultantDashboard currentUser={currentUser} />
                )}
                {currentUser.role === 'admin' && (
                  <AdminDashboard currentUser={currentUser} />
                )}
              </>
            )}

            {activeTab === 'admin' && (
              <AdminDashboard currentUser={currentUser} />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* User Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* User Profile & Astrological Details Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
      />

      {/* Notifications Drawer */}
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
      />

    </div>
  );
}
