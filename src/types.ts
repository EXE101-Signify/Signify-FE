/**
 * SignBridge TypeScript Type Definitions
 */

export type Screen = 'landing' | 'login' | 'dashboard' | 'call' | 'languages';

export interface Contact {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
  avatar: string;
  lastCall: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'other' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  isAISignRecognition?: boolean;
  isTranscribedSignSeq?: boolean;
}

export interface LanguagePack {
  id: string;
  name: string;
  description: string;
  status: 'installed' | 'not_installed' | 'updating';
  size: string;
  accuracy: string;
  vocabCount: number;
}

export interface CallLog {
  id: string;
  contactName: string;
  avatar: string;
  duration: string;
  date: string;
  type: 'incoming' | 'outgoing' | 'missed';
}
