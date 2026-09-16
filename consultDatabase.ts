import { AstrologerRemedy, ConsultationBooking, TrialAccount } from '../types';

const CONSULT_DB_KEY = 'celestial_consult_db_v2';

interface ConsultStore {
  trialsByEmail: Record<string, TrialAccount>;
  phonesUsed: Record<string, string>;
  fingerprintsUsed: Record<string, string[]>;
  bookings: ConsultationBooking[];
}

const emptyStore = (): ConsultStore => ({
  trialsByEmail: {},
  phonesUsed: {},
  fingerprintsUsed: {},
  bookings: []
});

const readStore = (): ConsultStore => {
  try {
    const raw = localStorage.getItem(CONSULT_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ConsultStore;
      if (parsed && parsed.trialsByEmail && parsed.bookings) {
        parsed.phonesUsed = parsed.phonesUsed || {};
        parsed.fingerprintsUsed = parsed.fingerprintsUsed || {};
        return parsed;
      }
    }
  } catch (err) {
    console.error('[ConsultDB] read failed', err);
  }
  return emptyStore();
};

const writeStore = (store: ConsultStore): void => {
  localStorage.setItem(CONSULT_DB_KEY, JSON.stringify(store));
};

export const getOrCreateTrialAccount = (email: string): TrialAccount => {
  const clean = email.trim().toLowerCase();
  const store = readStore();
  if (store.trialsByEmail[clean]) {
    return store.trialsByEmail[clean];
  }
  const created: TrialAccount = {
    email: clean,
    verifiedPhoneE164: '',
    trialGranted: 2,
    trialRemaining: 2,
    trialConsumed: 0,
    bonusCreditsInr: 0,
    updatedAt: new Date().toISOString()
  };
  store.trialsByEmail[clean] = created;
  writeStore(store);
  return created;
};

export const verifyTrialPhone = (
  email: string,
  phone10: string,
  fingerprintHash?: string
): { ok: boolean; error?: string; trial: TrialAccount } => {
  const digits = phone10.replace(/\D/g, '');
  const trial = getOrCreateTrialAccount(email);
  if (digits.length !== 10) {
    return { ok: false, error: 'Please enter a valid 10-digit Indian mobile number.', trial };
  }
  const e164 = `+91${digits}`;
  const store = readStore();
  const clean = email.trim().toLowerCase();
  
  // Anti-Abuse Check 1: Phone uniqueness
  const phoneOwner = store.phonesUsed[e164];
  if (phoneOwner && phoneOwner !== clean) {
    const frozen: TrialAccount = { ...trial, trialRemaining: 0, updatedAt: new Date().toISOString() };
    store.trialsByEmail[clean] = frozen;
    writeStore(store);
    return {
      ok: false,
      error: 'This mobile number is already linked to free trials on another account. Standard rates apply.',
      trial: frozen
    };
  }

  // Anti-Abuse Check 2: Device Fingerprinting
  if (fingerprintHash) {
    const linkedEmails = store.fingerprintsUsed[fingerprintHash] || [];
    if (!linkedEmails.includes(clean)) {
      if (linkedEmails.length >= 2) {
        const frozen: TrialAccount = { ...trial, trialRemaining: 0, updatedAt: new Date().toISOString() };
        store.trialsByEmail[clean] = frozen;
        writeStore(store);
        return {
          ok: false,
          error: 'Maximum device trial limit reached. Standard rates apply for additional accounts.',
          trial: frozen
        };
      }
      store.fingerprintsUsed[fingerprintHash] = [...linkedEmails, clean];
    }
  }

  store.phonesUsed[e164] = clean;
  const updated: TrialAccount = {
    ...trial,
    verifiedPhoneE164: e164,
    deviceFingerprint: fingerprintHash,
    updatedAt: new Date().toISOString()
  };
  store.trialsByEmail[clean] = updated;
  writeStore(store);
  return { ok: true, trial: updated };
};

export const confirmConsultationBooking = (
  booking: Omit<ConsultationBooking, 'id' | 'createdAt' | 'status' | 'durationMinutes' | 'roomId'> & {
    durationMinutes?: number;
    roomId?: string;
  }
): { booking: ConsultationBooking; trial: TrialAccount } => {
  const store = readStore();
  const cleanEmail = booking.seekerEmail.trim().toLowerCase();
  const trial = getOrCreateTrialAccount(cleanEmail);
  const applyTrial = trial.trialRemaining > 0 && booking.trialApplied;
  const nextRemaining = applyTrial
    ? ((trial.trialRemaining - 1) as 0 | 1 | 2)
    : trial.trialRemaining;

  const roomId = booking.roomId || `room_celestial_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const saved: ConsultationBooking = {
    ...booking,
    id: `bkg_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    roomId,
    durationMinutes: booking.durationMinutes || 15,
    trialApplied: applyTrial,
    amountDueInr: applyTrial ? 0 : booking.listPriceInr,
    attachedArtifacts: booking.attachedArtifacts || []
  };

  if (applyTrial) {
    store.trialsByEmail[cleanEmail] = {
      ...trial,
      trialRemaining: nextRemaining,
      trialConsumed: trial.trialConsumed + 1,
      updatedAt: new Date().toISOString()
    };
  }

  store.bookings.unshift(saved);
  writeStore(store);
  return {
    booking: saved,
    trial: store.trialsByEmail[cleanEmail] || trial
  };
};

export const extendConsultationBooking = (
  bookingId: string,
  additionalMinutes: number = 10,
  extensionFeeInr: number = 499
): { ok: boolean; booking?: ConsultationBooking; error?: string } => {
  const store = readStore();
  const idx = store.bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) return { ok: false, error: 'Booking not found' };

  const curr = store.bookings[idx];
  const updated: ConsultationBooking = {
    ...curr,
    durationMinutes: (curr.durationMinutes || 15) + additionalMinutes,
    extendedMinutes: (curr.extendedMinutes || 0) + additionalMinutes,
    amountDueInr: curr.amountDueInr + extensionFeeInr
  };

  store.bookings[idx] = updated;
  writeStore(store);
  return { ok: true, booking: updated };
};

export const completeConsultationSession = (
  bookingId: string,
  data: {
    notes?: string;
    remedies?: AstrologerRemedy[];
    seekerRating?: number;
    seekerReview?: string;
  }
): { ok: boolean; booking?: ConsultationBooking } => {
  const store = readStore();
  const idx = store.bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) return { ok: false };

  const curr = store.bookings[idx];
  const updated: ConsultationBooking = {
    ...curr,
    status: 'completed',
    completedAt: new Date().toISOString(),
    sessionNotes: data.notes || curr.sessionNotes,
    prescribedRemedies: data.remedies || curr.prescribedRemedies,
    seekerRating: data.seekerRating || curr.seekerRating,
    seekerReview: data.seekerReview || curr.seekerReview
  };

  store.bookings[idx] = updated;
  writeStore(store);
  return { ok: true, booking: updated };
};

export const handleAstrologerNoShow = (
  bookingId: string
): { ok: boolean; restoredTrialRemaining: number; bonusGrantedInr: number } => {
  const store = readStore();
  const idx = store.bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) return { ok: false, restoredTrialRemaining: 0, bonusGrantedInr: 0 };

  const booking = store.bookings[idx];
  const cleanEmail = booking.seekerEmail.trim().toLowerCase();
  const trial = getOrCreateTrialAccount(cleanEmail);

  let restoredRemaining = trial.trialRemaining;
  if (booking.trialApplied && trial.trialRemaining < 2) {
    restoredRemaining = (trial.trialRemaining + 1) as 1 | 2;
  }

  const bonus = 200; // ₹200 compensation credit
  const updatedTrial: TrialAccount = {
    ...trial,
    trialRemaining: restoredRemaining as 0 | 1 | 2,
    trialConsumed: Math.max(0, trial.trialConsumed - 1),
    bonusCreditsInr: (trial.bonusCreditsInr || 0) + bonus,
    updatedAt: new Date().toISOString()
  };

  store.trialsByEmail[cleanEmail] = updatedTrial;
  store.bookings[idx] = {
    ...booking,
    status: 'no_show_expert'
  };

  writeStore(store);
  return { ok: true, restoredTrialRemaining: restoredRemaining, bonusGrantedInr: bonus };
};

export const getBookingsForEmail = (email: string): ConsultationBooking[] => {
  const clean = email.trim().toLowerCase();
  return readStore().bookings.filter(b => b.seekerEmail === clean);
};

export const getBookingById = (bookingId: string): ConsultationBooking | undefined => {
  return readStore().bookings.find(b => b.id === bookingId);
};

export const generateIcsCalendarBlob = (booking: ConsultationBooking): string => {
  const start = new Date(booking.slot.startUtc).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const end = new Date(booking.slot.endUtc).toISOString().replace(/-|:|\.\d\d\d/g, '');
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Palmistry & Tarot Platform//Live Consultation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:consultation-${booking.id}@celestialplatform.internal`,
    `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, '')}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:Live Astrological Reading with ${booking.expertName}`,
    `DESCRIPTION:Live 1-on-1 Consultation on ${booking.topic.toUpperCase()} with ${booking.expertName}.\\nRoom Link: https://celestial.internal/room/${booking.roomId}`,
    `LOCATION:Celestial Live Video Room (${booking.roomId})`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
};
