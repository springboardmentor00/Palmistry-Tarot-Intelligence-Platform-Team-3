import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ConsultationBooking,
  UserProfile,
  PalmFeatures,
  TarotReadingSession,
  AstrologerRemedy,
  InCallChatMessage
} from '../types';
import {
  extendConsultationBooking,
  completeConsultationSession,
  handleAstrologerNoShow,
  generateIcsCalendarBlob
} from '../database/consultDatabase';
import { formatInr } from '../utils/inr';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Clock,
  PlusCircle,
  Layers,
  Hand,
  MessageSquare,
  FileText,
  Send,
  Star,
  Download,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Award,
  ChevronRight,
  Maximize2,
  Volume2,
  VolumeX,
  Radio,
  Play,
  Compass,
  Zap,
  CheckCircle2,
  Volume1
} from 'lucide-react';

interface LiveVideoCallRoomProps {
  booking: ConsultationBooking;
  currentUser: UserProfile;
  attachedPalm?: PalmFeatures | null;
  attachedTarot?: TarotReadingSession | null;
  onLeaveCall: () => void;
  onTrialUpdated: () => void;
}

const DEFAULT_REMEDIES: AstrologerRemedy[] = [
  {
    id: 'rem_1',
    type: 'gemstone',
    title: 'Natural Yellow Sapphire (Pukhraj)',
    planetOrSign: 'Jupiter (Brihaspati)',
    description: 'Strengthens Mount Jupiter and clears Saturnian delays in career & higher learning.',
    instructions: 'Wear in gold or punch-dhatu on the index finger of the right hand on a Thursday morning.'
  },
  {
    id: 'rem_2',
    type: 'mantra',
    title: 'Brihaspati Gayatri & Maha Mrityunjaya Japa',
    planetOrSign: 'Planetary Harmony',
    description: 'Calms transit tensions and establishes psychic equilibrium for the Life Line.',
    instructions: 'Chant 108 times at sunrise facing East during the waxing moon phase.'
  },
  {
    id: 'rem_3',
    type: 'tarot_meditation',
    title: 'The Star / Ace of Cups Archetypal Meditation',
    planetOrSign: 'Elemental Water',
    description: 'Realigns emotional turbulence revealed in the Three-Card spread.',
    instructions: 'Spend 5 minutes before sleep visualizing violet healing light flowing into the palm center.'
  }
];

/**
 * Plays a celestial singing chime tone via Web Audio API to awaken browser audio device
 */
const playSingingChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime); // 528 Hz transformation frequency
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // ignore
  }
};

export const LiveVideoCallRoom: React.FC<LiveVideoCallRoomProps> = ({
  booking: initialBooking,
  currentUser,
  attachedPalm,
  attachedTarot,
  onLeaveCall,
  onTrialUpdated
}) => {
  const [booking, setBooking] = useState<ConsultationBooking>(initialBooking);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isAstrologerAudioMuted, setIsAstrologerAudioMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'notes' | 'chat' | 'remedies'>('telemetry');
  
  // Timer State (15 mins = 900 seconds)
  const initialSeconds = (booking.durationMinutes || 15) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const [isCallActive, setIsCallActive] = useState(true);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionStatus, setExtensionStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  // Astrologer Presence & Video simulation
  const [astrologerStatus, setAstrologerStatus] = useState<'connecting' | 'connected' | 'delayed'>('connected');
  const [astrologerSpeaking, setAstrologerSpeaking] = useState(false);
  const [isAstrologerThinking, setIsAstrologerThinking] = useState(false);
  const [currentCaption, setCurrentCaption] = useState<string>('');
  const [lastSpokenText, setLastSpokenText] = useState<string>('');

  // User Live Voice / Microphone Recognition State
  const [userInterimSpeech, setUserInterimSpeech] = useState<string>('');
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [micStatusNotice, setMicStatusNotice] = useState<string>('Microphone ready · Listening live');
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const safetyEndTimerRef = useRef<any>(null);
  const latestSpeechRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);

  // Chat & Notes state
  const [chatMessages, setChatMessages] = useState<InCallChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'system',
      senderName: 'System',
      text: 'Encrypted peer-to-peer session initiated. Astrologer has received your attached readings.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'msg_2',
      sender: 'expert',
      senderName: booking.expertName,
      text: `Namaste ${currentUser.name || 'Seeker'}, I am reviewing your chart. Let us examine your question on ${booking.topic.toUpperCase()}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [liveNotes, setLiveNotes] = useState<string>(
    `• Consultation Topic: ${booking.topic.toUpperCase()}\n• Primary Observation: Strong Jupiter mount resonance with minor Saturn transit friction.\n• Line Quality: Clear Life Line trajectory with forked Head Line indicating dual creative and analytical aptitude.`
  );

  // Post-Session Summary state
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSummarySubmitted, setIsSummarySubmitted] = useState(false);

  // Video Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Generates intelligent, personalized astrologer voice response to user questions
   */
  const generateAstrologerAnswer = useCallback((query: string): string => {
    const q = query.toLowerCase();
    const name = currentUser.name || 'Seeker';
    const zodiac = currentUser.zodiacSign ? `${currentUser.zodiacSign}` : 'your astrological archetype';
    const palmOverview = attachedPalm?.overviewSummary || 'your strong Life Line and prominent Jupiter mount';
    const handType = attachedPalm?.handType || 'Fire';
    const tarotTitle = attachedTarot?.spreadTitle || 'the cards';

    if (q.includes('career') || q.includes('job') || q.includes('business') || q.includes('promotion') || q.includes('money') || q.includes('wealth') || q.includes('finance')) {
      return `Looking at your Fate Line and Mount Apollo, ${name}, a major professional turning point aligns within your next lunar transit. Since you have a ${handType} hand disposition, channel your analytical drive into high-impact initiatives. You will see positive monetary progression soon.`;
    }
    if (q.includes('love') || q.includes('marriage') || q.includes('relationship') || q.includes('partner') || q.includes('soulmate') || q.includes('future husband') || q.includes('future wife')) {
      return `Examining your Heart Line, I see great emotional depth and loyalty. In ${tarotTitle}, the energy emphasizes open communication and trusting your vulnerability. Any current hesitation is temporary, and harmonious partnership alignment is opening up for you.`;
    }
    if (q.includes('remedy') || q.includes('gemstone') || q.includes('stone') || q.includes('mantra') || q.includes('ritual') || q.includes('pooja') || q.includes('cure')) {
      return `For your chart and current planetary transits, I strongly recommend wearing a natural Yellow Sapphire on your index finger on a Thursday morning, along with chanting the Brihaspati Gayatri mantra daily at dawn. This will clear karmic friction.`;
    }
    if (q.includes('palm') || q.includes('line') || q.includes('hand') || q.includes('life line') || q.includes('head line') || q.includes('heart line')) {
      return `Your palm displays ${palmOverview}. The clarity of your main lines demonstrates resilient physical vitality and sharp intuitive discernment. Keep nurturing your natural leadership qualities.`;
    }
    if (q.includes('tarot') || q.includes('card') || q.includes('future') || q.includes('destiny') || q.includes('spread')) {
      return `The Tarot spread confirms that you are at a decisive spiritual crossroads. What seemed like obstacles are actually clearing unnecessary baggage. Trust your inner compass over the next two months.`;
    }
    if (q.includes('health') || q.includes('stress') || q.includes('peace') || q.includes('mind') || q.includes('anxiety')) {
      return `Your Life Line indicates robust foundational vitality, but Saturn transits are currently asking you to prioritize restorative rest and mindful grounding. Spend ten minutes in morning meditation to steady your aura.`;
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('namaste') || q.includes('can you hear me') || q.includes('testing') || q.includes('speak')) {
      return `Namaste ${name}! Yes, I hear you loud and clear through your microphone. Please ask me anything about your destiny, palm lines, relationships, or planetary timing.`;
    }

    // Default contextual replies
    const standardResponses = [
      `I hear your question clearly, ${name}. Aligning this with your ${zodiac} energy and palm crease measurements, the path ahead demands patience followed by bold decisive action.`,
      `Thank you for asking that. Looking closely at your planetary aspects and line quality, the indicators show significant clarity emerging right after this month's transit.`,
      `That is an important inquiry. The symbology in your reading suggests that focusing on steady discipline and inner alignment will unlock the outcome you seek.`,
      `I see positive momentum opening up in your spiritual chart. Continue trusting your inner voice, as your Head Line fork indicates strong intuition.`
    ];
    return standardResponses[Math.floor(Math.random() * standardResponses.length)];
  }, [attachedPalm, attachedTarot, currentUser.name, currentUser.zodiacSign]);

  /**
   * Spoken Astrologer Voice Function with robust audio playback
   */
  const speakAstrologerVoice = useCallback((textToSpeak: string) => {
    setLastSpokenText(textToSpeak);
    setCurrentCaption(textToSpeak);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAstrologerSpeaking(false);
      setIsAstrologerThinking(false);
      return;
    }

    try {
      playSingingChime();
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      (window as any).__lastUtterance = utterance; // Prevent Chrome V8 garbage collection bug

      // Select Best Astrological Voice
      const loadVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const indianVoice = voices.find(v => v.lang.includes('IN') || v.name.includes('India') || v.name.includes('Hindi'));
        const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Samantha')));
        
        if (indianVoice || englishVoice || (voices.length > 0)) {
          utterance.voice = indianVoice || englishVoice || voices[0];
        }
        utterance.lang = 'en-US';
        utterance.rate = 0.93;
        utterance.pitch = 1.05;
        utterance.volume = isAstrologerAudioMuted ? 0 : 1.0;

        utterance.onstart = () => {
          setIsAstrologerThinking(false);
          setAstrologerSpeaking(true);
          setCurrentCaption(textToSpeak);
        };

        utterance.onend = () => {
          setAstrologerSpeaking(false);
          setIsAstrologerThinking(false);
          isProcessingRef.current = false;
        };

        utterance.onerror = (e) => {
          console.warn('[SpeechSynthesis] Event notice:', e);
          setAstrologerSpeaking(false);
          setIsAstrologerThinking(false);
          isProcessingRef.current = false;
        };

        if (safetyEndTimerRef.current) {
          clearTimeout(safetyEndTimerRef.current);
        }
        const estimatedDurationMs = Math.max(3000, textToSpeak.length * 85);
        safetyEndTimerRef.current = setTimeout(() => {
          setAstrologerSpeaking(false);
          setIsAstrologerThinking(false);
          isProcessingRef.current = false;
        }, estimatedDurationMs);

        window.speechSynthesis.speak(utterance);
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        loadVoiceAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          loadVoiceAndSpeak();
        };
        // Fallback immediate speak if onvoiceschanged doesn't trigger
        setTimeout(loadVoiceAndSpeak, 100);
      }
    } catch (err) {
      console.warn('[SpeechSynthesis] Exception:', err);
      setAstrologerSpeaking(false);
      setIsAstrologerThinking(false);
      isProcessingRef.current = false;
    }
  }, [isAstrologerAudioMuted]);

  /**
   * Process a spoken question from the seeker and trigger the Astrologer's voice reply
   */
  const processUserQuestion = useCallback((spokenText: string) => {
    const cleanQuery = spokenText.trim();
    if (!cleanQuery || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsUserSpeaking(false);
    setUserInterimSpeech('');
    latestSpeechRef.current = '';

    // If astrologer was speaking, cancel previous speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Add seeker question to chat immediately
    const userMsg: InCallChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'seeker',
      senderName: currentUser.name || 'You (Voice)',
      text: cleanQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsAstrologerThinking(true);

    // Generate intelligent astrologer response and speak back immediately
    setTimeout(() => {
      const astrologerReply = generateAstrologerAnswer(cleanQuery);
      const replyMsg: InCallChatMessage = {
        id: `exp_${Date.now() + 1}`,
        sender: 'expert',
        senderName: booking.expertName,
        text: astrologerReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, replyMsg]);
      setCurrentCaption(astrologerReply);
      speakAstrologerVoice(astrologerReply);
    }, 350);
  }, [booking.expertName, currentUser.name, generateAstrologerAnswer, speakAstrologerVoice]);

  /**
   * Setup Web Speech Recognition for the Seeker's Microphone
   */
  useEffect(() => {
    if (!isCallActive || isSessionEnded || !isMicOn) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListeningMic(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setMicStatusNotice('Microphone active (Type in chat or tap Ask chips)');
      setIsListeningMic(true);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListeningMic(true);
        setMicStatusNotice('Microphone listening live · Speak your question anytime');
      };

      recognition.onresult = (event: any) => {
        let interimStr = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += transcript;
          } else {
            interimStr += transcript;
          }
        }

        const currentSpeech = (finalStr || interimStr).trim();
        if (currentSpeech) {
          setIsUserSpeaking(true);
          setUserInterimSpeech(currentSpeech);
          latestSpeechRef.current = currentSpeech;

          // If user interrupts or speaks, clear debounce and wait for brief pause
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Trigger response on final result or 750ms of silence
          const waitTime = finalStr ? 350 : 750;
          silenceTimerRef.current = setTimeout(() => {
            const queryToSend = latestSpeechRef.current.trim();
            if (queryToSend.length >= 2 && !isProcessingRef.current) {
              processUserQuestion(queryToSend);
            }
          }, waitTime);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[SpeechRecognition] notice:', event?.error);
        if (event.error === 'not-allowed') {
          setMicStatusNotice('Microphone permission needed in browser');
        }
      };

      recognition.onend = () => {
        if (isMicOn && isCallActive && !isSessionEnded) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or active
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('[SpeechRecognition] Init error:', err);
      setMicStatusNotice('Microphone active · Speak your question');
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [isCallActive, isMicOn, isSessionEnded, processUserQuestion]);

  // Initial WebRTC User Media Camera & Immediate Welcome Speech on Room Open
  useEffect(() => {
    let active = true;
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: true
          });
          if (active && localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        }
      } catch (err) {
        console.warn('[LiveVideo] Webcam access denied or fallback needed:', err);
      }
    }
    startCamera();

    // Trigger Astrologer Audible Spoken Greeting Immediately on Room Open (within 350ms)
    const seekerName = currentUser.name || 'Seeker';
    const welcomeSpeech = `Namaste ${seekerName}! I am ${booking.expertName}. I have your spiritual readings open before me. I am listening live to your voice. Please feel free to speak your question aloud now.`;
    
    const initialSpeechTimer = setTimeout(() => {
      speakAstrologerVoice(welcomeSpeech);
    }, 350);

    return () => {
      active = false;
      clearTimeout(initialSpeechTimer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [booking.expertName, currentUser.name, speakAstrologerVoice]);

  // Main Call Timer Countdown
  useEffect(() => {
    if (!isCallActive || isSessionEnded) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEndCall(false);
          return 0;
        }
        // Spoken warning at 2 minutes remaining
        if (prev === 120) {
          setShowExtensionModal(true);
          speakAstrologerVoice(`We have two minutes remaining in our scheduled session. If you would like to continue our consultation, you can extend our session by ten minutes.`);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCallActive, isSessionEnded, speakAstrologerVoice]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle Camera
  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => (t.enabled = !isCamOn));
    }
    setIsCamOn(!isCamOn);
  };

  // Toggle Mic
  const toggleMic = () => {
    const nextMic = !isMicOn;
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => (t.enabled = nextMic));
    }
    setIsMicOn(nextMic);
    if (!nextMic) {
      setUserInterimSpeech('');
      setIsUserSpeaking(false);
    }
  };

  // Toggle Astrologer Audio (Mute/Unmute)
  const toggleAstrologerAudio = () => {
    const nextMuted = !isAstrologerAudioMuted;
    setIsAstrologerAudioMuted(nextMuted);
    if (nextMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setAstrologerSpeaking(false);
    } else {
      speakAstrologerVoice("Astrologer voice audio unmuted. I am listening to you.");
    }
  };

  // Replay Last Spoken Voice
  const handleReplayAstrologerVoice = () => {
    const textToReplay = lastSpokenText || `Namaste ${currentUser.name || 'Seeker'}, I am ${booking.expertName}. I am listening to your voice live. Please speak any question aloud.`;
    speakAstrologerVoice(textToReplay);
  };

  // Handle Session Extension (+10 Mins)
  const handleExtendSession = () => {
    setExtensionStatus('processing');
    setTimeout(() => {
      const res = extendConsultationBooking(booking.id, 10, 499);
      if (res.ok && res.booking) {
        setBooking(res.booking);
        setSecondsRemaining(prev => prev + 600);
        setExtensionStatus('success');
        setChatMessages(msgs => [
          ...msgs,
          {
            id: `sys_${Date.now()}`,
            sender: 'system',
            senderName: 'System',
            text: 'Session successfully extended by +10 minutes. Video and microphone stream continuous.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        speakAstrologerVoice("Thank you. Our consultation has been extended by ten minutes. Let us continue exploring your astrological timing.");
        setTimeout(() => {
          setShowExtensionModal(false);
          setExtensionStatus('idle');
        }, 1200);
      }
    }, 1000);
  };

  // Astrologer No-Show Restitution Handler
  const handleSimulateNoShow = () => {
    const res = handleAstrologerNoShow(booking.id);
    if (res.ok) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      onTrialUpdated();
      alert(`Astrologer delayed. Your trial session credit has been 100% restored (+1 free trial), and ₹${res.bonusGrantedInr} compensation credit was added to your account!`);
      onLeaveCall();
    }
  };

  // Handle End Call & Post-Session Wrap-Up
  const handleEndCall = (manual: boolean = true) => {
    setIsCallActive(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    completeConsultationSession(booking.id, {
      notes: liveNotes,
      remedies: DEFAULT_REMEDIES
    });
    setIsSessionEnded(true);
  };

  // Submit Feedback
  const handleSubmitSummary = () => {
    completeConsultationSession(booking.id, {
      notes: liveNotes,
      remedies: DEFAULT_REMEDIES,
      seekerRating: rating,
      seekerReview: feedbackText
    });
    setIsSummarySubmitted(true);
    setTimeout(() => {
      onTrialUpdated();
      onLeaveCall();
    }, 1500);
  };

  // Send Chat Message & Trigger Spoken Astrologer Response
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userQuery = chatInput.trim();
    setChatInput('');
    processUserQuestion(userQuery);
  };

  // Quick Astrological Speech Trigger buttons
  const handleTriggerSpeechTopic = (topicType: 'palm' | 'tarot' | 'remedy' | 'career' | 'love') => {
    if (topicType === 'palm') {
      const speech = attachedPalm
        ? `Let us examine your ${attachedPalm.handType || 'hand'} palm. Your Life Line is ${attachedPalm.lifeLine?.length || 'strong'} and clear, which indicates strong vitality and steady progress in your journey.`
        : 'Looking at your palm structure, your Mount of Jupiter is prominent, reflecting high ambition and wisdom.';
      speakAstrologerVoice(speech);
    } else if (topicType === 'tarot') {
      const speech = attachedTarot
        ? `Regarding your ${attachedTarot.spreadTitle}, the cards reveal a major breakthrough once current planetary transits complete.`
        : 'The cards highlight a karmic crossroads where patience will bring you significant rewards.';
      speakAstrologerVoice(speech);
    } else if (topicType === 'remedy') {
      speakAstrologerVoice('I have prescribed the Yellow Sapphire gemstone and the Maha Mrityunjaya mantra in your remedies tab to energize your aura.');
    } else if (topicType === 'career') {
      processUserQuestion('What does my astrological chart say about my career and finances?');
    } else if (topicType === 'love') {
      processUserQuestion('Can you analyze my love life and relationship compatibility?');
    }
  };

  // Download ICS Calendar Invite
  const downloadIcs = () => {
    const link = document.createElement('a');
    link.href = generateIcsCalendarBlob(booking);
    link.download = `consultation-${booking.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Post Session Summary Dialog
  if (isSessionEnded) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-2xl w-full bg-[#0A0A0F] border border-violet-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-violet-600 to-amber-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <Award className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Session Completed with {booking.expertName}</h2>
            <p className="text-xs text-white/60">
              Duration: {booking.durationMinutes || 15} mins · Focus Area: {booking.topic.toUpperCase()}
            </p>
          </div>

          {/* Astrological Remedies Prescription */}
          <div className="space-y-3 bg-violet-950/20 border border-violet-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Prescribed Astrological Remedies
              </h3>
              <button
                type="button"
                onClick={downloadIcs}
                className="text-[10px] text-violet-300 hover:text-white flex items-center gap-1 font-mono uppercase underline"
              >
                <Download className="w-3 h-3" />
                Save .ics Reminder
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DEFAULT_REMEDIES.map(rem => (
                <div key={rem.id} className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-1">
                  <div className="text-[10px] font-bold text-violet-400 uppercase">{rem.type}</div>
                  <div className="text-xs font-bold text-white">{rem.title}</div>
                  <div className="text-[10px] text-white/60">{rem.description}</div>
                  <div className="text-[9px] text-amber-300/80 font-mono mt-1 pt-1 border-t border-white/5">
                    {rem.instructions}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Astrologer Live Notes Summary */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-white/50 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Astrologer Session Notes & Key Dates
            </div>
            <pre className="text-xs text-white/80 font-sans whitespace-pre-wrap leading-relaxed">
              {liveNotes}
            </pre>
          </div>

          {/* Rating & Review */}
          {!isSummarySubmitted ? (
            <div className="space-y-4 border-t border-white/10 pt-4">
              <div className="text-center space-y-1.5">
                <p className="text-xs font-semibold text-white">Rate your reading with {booking.expertName}</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Write a brief reflection or feedback (optional)..."
                rows={2}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSubmitSummary}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-amber-500 hover:from-violet-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg"
                >
                  Save & Return to Platform
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-3 text-emerald-400 text-xs font-bold">
              ✓ Consultation summary saved to your permanent spiritual profile!
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#050507] text-[#E0E0E6] flex flex-col overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-16 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/50 flex items-center justify-center">
            <Compass className="w-4 h-4 text-violet-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{booking.expertName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Video & Audio Online
              </span>
            </div>
            <p className="text-[10px] text-white/50">Topic: {booking.topic.toUpperCase()} · Room: {booking.roomId.slice(0, 14)}...</p>
          </div>
        </div>

        {/* Live Countdown Timer & Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Astrologer Voice Status Beacon */}
          <button
            type="button"
            onClick={toggleAstrologerAudio}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              !isAstrologerAudioMuted
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
            }`}
            title="Toggle Astrologer Voice Audio"
          >
            {!isAstrologerAudioMuted ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
            <span>{!isAstrologerAudioMuted ? 'Astrologer Voice: ON' : 'Voice Muted'}</span>
          </button>

          <button
            type="button"
            onClick={handleReplayAstrologerVoice}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/40 text-violet-200 text-xs font-semibold"
            title="Replay Astrologer Speech"
          >
            <Volume1 className="w-3.5 h-3.5 text-amber-300" />
            <span>Replay Voice</span>
          </button>

          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold transition-all ${
              secondsRemaining <= 120
                ? 'bg-rose-950/60 border-rose-500/80 text-rose-300 animate-pulse'
                : secondsRemaining <= 300
                ? 'bg-amber-950/60 border-amber-500/80 text-amber-300'
                : 'bg-black/60 border-white/10 text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowExtensionModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+10 Mins (₹499)</span>
          </button>

          <button
            type="button"
            onClick={() => handleEndCall(true)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Video Viewport & Telemetry Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left: Video Area */}
        <div className="flex-1 bg-black flex flex-col relative p-4 justify-between">
          
          {/* Main Astrologer Video Container */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#101018] to-[#0A0A0F] border border-white/10 flex items-center justify-center shadow-2xl">
            <div className="w-full h-full relative flex items-center justify-center">
              
              {/* Seeker Microphone Live Listening Banner (Top Overlay) */}
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
                <div className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-medium flex items-center gap-2 transition-all ${
                  isUserSpeaking
                    ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/30'
                    : isMicOn
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                }`}>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isUserSpeaking ? 'bg-amber-400' : isMicOn ? 'bg-emerald-400' : 'bg-rose-400'
                    }`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isUserSpeaking ? 'bg-amber-400' : isMicOn ? 'bg-emerald-400' : 'bg-rose-400'
                    }`} />
                  </span>
                  <span className="font-mono text-[11px]">
                    {isUserSpeaking
                      ? '🎙️ Listening to you... (Pause to send)'
                      : isMicOn
                      ? '🎙️ Microphone Live · Speak your question aloud anytime'
                      : '🔇 Microphone muted (Unmute to speak)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReplayAstrologerVoice}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] uppercase rounded-xl shadow flex items-center gap-1"
                    title="Click to hear astrologer voice"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Hear Astrologer Voice</span>
                  </button>

                  {userInterimSpeech && (
                    <button
                      type="button"
                      onClick={() => processUserQuestion(userInterimSpeech)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-[10px] rounded-lg shadow-lg flex items-center gap-1 shrink-0 animate-bounce"
                    >
                      <span>Ask Now</span>
                      <Send className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Simulated Astrologer Video Avatar / Feed */}
              <div className="relative text-center space-y-4">
                <div className="relative inline-block cursor-pointer" onClick={handleReplayAstrologerVoice}>
                  <img
                    src={booking.expertAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80'}
                    alt={booking.expertName}
                    className="w-48 h-48 sm:w-64 sm:h-64 object-cover rounded-3xl border-2 border-violet-500/40 shadow-2xl"
                  />
                  {astrologerSpeaking && (
                    <div className="absolute -inset-2 rounded-3xl border-2 border-amber-400 animate-ping opacity-50 pointer-events-none" />
                  )}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md rounded-xl py-1 px-2.5 text-[11px] font-bold text-white flex items-center justify-between">
                    <span>{booking.expertName}</span>
                    <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                      {astrologerSpeaking ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          <span>Speaking (Audible)</span>
                        </>
                      ) : isAstrologerThinking ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                          <span>Synthesizing Answer...</span>
                        </>
                      ) : isUserSpeaking ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                          <span>Hearing You...</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>Listening Live</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Audio Waveform Indicator */}
                <div className="flex items-center justify-center gap-1.5 h-6">
                  {[40, 70, 90, 60, 100, 45, 80, 50].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-200 ${
                        astrologerSpeaking
                          ? 'bg-amber-400 shadow-sm shadow-amber-400'
                          : isUserSpeaking
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                          : isAstrologerThinking
                          ? 'bg-violet-400 animate-pulse'
                          : 'bg-white/20'
                      }`}
                      style={{
                        height: astrologerSpeaking || isUserSpeaking || isAstrologerThinking
                          ? `${Math.max(6, Math.round(h * (0.6 + 0.4 * Math.random())))}px`
                          : '4px'
                      }}
                    />
                  ))}
                </div>

                {/* Live Seeker Spoken Question Bubble */}
                {userInterimSpeech && (
                  <div className="max-w-md mx-auto bg-violet-950/95 backdrop-blur-md border border-violet-400/80 rounded-xl px-4 py-2 text-xs text-violet-100 shadow-2xl leading-relaxed animate-fade-in flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-violet-300 font-bold uppercase font-mono block mb-0.5 flex items-center gap-1">
                        <Mic className="w-3 h-3 text-amber-300 animate-pulse" /> You asked:
                      </span>
                      "{userInterimSpeech}"
                    </div>
                    <button
                      type="button"
                      onClick={() => processUserQuestion(userInterimSpeech)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-bold rounded-lg shrink-0"
                    >
                      Send
                    </button>
                  </div>
                )}

                {/* Live Spoken Captions Subtitle Box */}
                {currentCaption && !userInterimSpeech && (
                  <div className="max-w-md mx-auto bg-black/85 backdrop-blur-md border border-amber-500/40 rounded-xl px-4 py-2 text-xs text-amber-200 shadow-xl leading-relaxed animate-fade-in">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-amber-400 font-bold uppercase font-mono">
                        🎙️ {booking.expertName} speaking:
                      </span>
                      <button
                        type="button"
                        onClick={handleReplayAstrologerVoice}
                        className="text-[9px] text-amber-300 hover:text-white underline font-mono"
                      >
                        Replay
                      </button>
                    </div>
                    "{currentCaption}"
                  </div>
                )}

                {/* Quick Voice Ask Action Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleTriggerSpeechTopic('palm')}
                    className="px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/40 text-[10px] font-semibold text-violet-200 flex items-center gap-1 transition-all"
                  >
                    <Hand className="w-3 h-3 text-emerald-400" />
                    <span>Ask about Palm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerSpeechTopic('tarot')}
                    className="px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/40 text-[10px] font-semibold text-violet-200 flex items-center gap-1 transition-all"
                  >
                    <Layers className="w-3 h-3 text-amber-400" />
                    <span>Ask about Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerSpeechTopic('career')}
                    className="px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/40 text-[10px] font-semibold text-violet-200 flex items-center gap-1 transition-all"
                  >
                    <Compass className="w-3 h-3 text-sky-400" />
                    <span>Ask Career Forecast</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerSpeechTopic('love')}
                    className="px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/40 text-[10px] font-semibold text-violet-200 flex items-center gap-1 transition-all"
                  >
                    <HeartIcon className="w-3 h-3 text-pink-400" />
                    <span>Ask Love & Synastry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerSpeechTopic('remedy')}
                    className="px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/40 text-[10px] font-semibold text-violet-200 flex items-center gap-1 transition-all"
                  >
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>Ask for Remedies</span>
                  </button>
                </div>
              </div>

              {/* Floating Seeker PIP (Picture-in-Picture) */}
              <div className="absolute bottom-4 right-4 w-36 h-28 sm:w-48 sm:h-36 bg-[#050507] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                {isCamOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white/50 text-[10px]">
                    <VideoOff className="w-5 h-5 mb-1" />
                    <span>Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span>You</span>
                  {isMicOn ? (
                    <span className="text-emerald-400">● Live Mic</span>
                  ) : (
                    <span className="text-rose-400">● Muted</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* In-Call Media Control Bar */}
          <div className="mt-3 bg-[#0A0A0F]/80 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3 rounded-xl transition-all ${
                isMicOn ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40' : 'bg-rose-600 text-white'
              }`}
              title={isMicOn ? 'Microphone is ON and listening · Click to Mute' : 'Microphone Muted · Click to Unmute'}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={toggleCam}
              className={`p-3 rounded-xl transition-all ${
                isCamOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-600 text-white'
              }`}
              title={isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={toggleAstrologerAudio}
              className={`p-3 rounded-xl transition-all ${
                !isAstrologerAudioMuted ? 'bg-white/10 text-emerald-400 hover:bg-white/20' : 'bg-rose-600 text-white'
              }`}
              title={!isAstrologerAudioMuted ? 'Mute Astrologer Audio' : 'Unmute Astrologer Audio'}
            >
              {!isAstrologerAudioMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <div className="h-6 w-[1px] bg-white/10 mx-1" />

            <button
              type="button"
              onClick={() => {
                setActiveTab('telemetry');
                handleTriggerSpeechTopic('palm');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>AI Data</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                activeTab === 'notes'
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                activeTab === 'chat'
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('remedies');
                handleTriggerSpeechTopic('remedy');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                activeTab === 'remedies'
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Remedies</span>
            </button>
          </div>
        </div>

        {/* Right: Telemetry & Interactive Astrologer Side Panel */}
        <div className="w-full lg:w-96 bg-[#0A0A0F] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col h-80 lg:h-auto overflow-hidden">
          
          {/* Panel Header */}
          <div className="p-3 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              {activeTab === 'telemetry' && <Layers className="w-3.5 h-3.5 text-violet-400" />}
              {activeTab === 'notes' && <FileText className="w-3.5 h-3.5 text-amber-400" />}
              {activeTab === 'chat' && <MessageSquare className="w-3.5 h-3.5 text-sky-400" />}
              {activeTab === 'remedies' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              {activeTab.toUpperCase()}
            </span>
            <span className="text-[10px] text-white/40 font-mono">Shared with Seer</span>
          </div>

          {/* Panel Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            
            {/* TAB 1: Attached AI Telemetry */}
            {activeTab === 'telemetry' && (
              <div className="space-y-4">
                {attachedPalm && (
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-violet-300 font-bold text-xs">
                      <span className="flex items-center gap-1.5"><Hand className="w-3.5 h-3.5" /> AI Palm Scan Telemetry</span>
                      <span className="text-[10px] font-mono text-emerald-400">{attachedPalm.detectionConfidence ? `${Math.round(attachedPalm.detectionConfidence * 100)}% Conf` : 'Active'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white/5 p-2 rounded-lg">
                        <div className="text-white/40">Life Line</div>
                        <div className="font-semibold text-white">{attachedPalm.lifeLine?.length || 'Long'} · {attachedPalm.lifeLine?.quality || 'Clear'}</div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg">
                        <div className="text-white/40">Head Line</div>
                        <div className="font-semibold text-white">{attachedPalm.headLine?.length || 'Medium'} · {attachedPalm.headLine?.quality || 'Forked'}</div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg">
                        <div className="text-white/40">Heart Line</div>
                        <div className="font-semibold text-white">{attachedPalm.heartLine?.length || 'Deep'} · {attachedPalm.heartLine?.quality || 'Clear'}</div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg">
                        <div className="text-white/40">Hand Element</div>
                        <div className="font-semibold text-amber-300">{attachedPalm.handType || 'Fire'} Element</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/60 leading-relaxed italic">
                      {attachedPalm.overviewSummary || 'Major lines show strong stamina and intellect with promising career inflection ahead.'}
                    </p>
                  </div>
                )}

                {attachedTarot && (
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-violet-300 font-bold text-xs">
                      <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Attached Tarot Spread</span>
                      <span className="text-[10px] font-mono text-amber-300">{attachedTarot.spreadTitle}</span>
                    </div>
                    <div className="space-y-1.5">
                      {attachedTarot.cards?.slice(0, 3).map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-lg text-[10px]">
                          <span className="font-bold text-white">{c.card.name}</span>
                          <span className="text-amber-300 font-mono">{c.isReversed ? 'Reversed ↺' : 'Upright ↑'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!attachedPalm && !attachedTarot && (
                  <div className="text-center py-8 text-white/40 space-y-2">
                    <Layers className="w-8 h-8 mx-auto opacity-40" />
                    <p>No prior AI scans attached for this session.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Live Astrologer Notes */}
            {activeTab === 'notes' && (
              <div className="space-y-2">
                <p className="text-[10px] text-white/50">Live notes being drafted during your reading:</p>
                <textarea
                  value={liveNotes}
                  onChange={e => setLiveNotes(e.target.value)}
                  rows={10}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            {/* TAB 3: Chat */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full space-y-3">
                <div className="flex-1 space-y-2 overflow-y-auto max-h-56">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl text-xs space-y-0.5 ${
                        msg.sender === 'seeker'
                          ? 'bg-violet-950/60 border border-violet-500/30 ml-4 text-violet-100'
                          : msg.sender === 'expert'
                          ? 'bg-black/60 border border-white/10 mr-4 text-white'
                          : 'bg-amber-950/30 border border-amber-500/20 text-amber-200 text-[10px]'
                      }`}
                    >
                      <div className="flex justify-between text-[9px] opacity-60">
                        <span>{msg.senderName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div>{msg.text}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type or speak a question aloud..."
                    className="flex-1 bg-black/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: Prescribed Remedies */}
            {activeTab === 'remedies' && (
              <div className="space-y-3">
                {DEFAULT_REMEDIES.map(rem => (
                  <div key={rem.id} className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-1">
                    <div className="text-[10px] font-bold text-amber-400 uppercase">{rem.type}</div>
                    <div className="text-xs font-bold text-white">{rem.title}</div>
                    <div className="text-[10px] text-white/60">{rem.description}</div>
                    <div className="text-[9px] text-violet-300 font-mono pt-1 border-t border-white/5">
                      {rem.instructions}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Real-time In-Call Extension Prompt Modal */}
      <AnimatePresence>
        {showExtensionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-[#0A0A0F] border border-amber-500/50 rounded-3xl p-6 space-y-5 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Extend Consultation?</h3>
                <p className="text-xs text-white/60">
                  Your reading with {booking.expertName} will end in {formatTime(secondsRemaining)}. Add +10 minutes seamlessly without disconnecting.
                </p>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-white">+10 Minutes Live Video</div>
                  <div className="text-[10px] text-white/40">Includes updated remedy prescription</div>
                </div>
                <div className="font-mono text-base font-bold text-amber-300">₹499</div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExtensionModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold"
                >
                  Continue As-Is
                </button>
                <button
                  type="button"
                  onClick={handleExtendSession}
                  disabled={extensionStatus === 'processing'}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5"
                >
                  {extensionStatus === 'processing' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Extend for ₹499</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper inline heart icon for love questions
const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
