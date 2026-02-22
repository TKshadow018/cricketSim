import { runVoice } from '../gameData/runVoice';
import { outVoice } from '../gameData/outVoice';

const speechDictionary = {
  en: {
    speech: {
      choseToFirst: 'chose to',
      mustScore: 'must score',
      toWin: 'to win',
      lostMatchBy: 'lost match by',
    },
    toss: {
      first: 'first',
    },
    gamePlay: {
      runs: 'runs',
    },
  },
  bn: {
    speech: {
      choseToFirst: 'আগে বেছে নিয়েছে',
      mustScore: 'জিততে করতে হবে',
      toWin: 'রান',
      lostMatchBy: 'হেরেছে',
    },
    toss: {
      first: 'প্রথমে',
    },
    gamePlay: {
      runs: 'রান',
    },
  },
};

const getSavedLanguage = () => {
  try {
    return localStorage.getItem('app_locale') || localStorage.getItem('language') || 'en';
  } catch (error) {
    return 'en';
  }
};

const getLocalizedText = (key, fallbackValue) => {
  const language = getSavedLanguage();
  const dictionary = speechDictionary[language] || speechDictionary.en;

  if (typeof fallbackValue !== 'undefined') {
    return fallbackValue;
  }

  return key.split('.').reduce((acc, part) => (acc && acc[part] ? acc[part] : null), dictionary) || key;
};

class SpeechHandler {
  constructor() {
    this.msg = new SpeechSynthesisUtterance();
    this.preferredVoiceName = '';
  }

  randomNumberGenerator(maxValue) {
    return Math.floor(Math.random() * maxValue);
  }

  speechHandler(data) {
    if (!this.isSpeechAvailable()) {
      return;
    }

    window.speechSynthesis.cancel();
    this.msg.text = data;
    
    // Set language based on current locale
    const currentLang = getSavedLanguage();
    if (currentLang === 'bn') {
      this.msg.lang = 'bn-BD'; // Bangla (Bangladesh)
    } else {
      this.msg.lang = 'en-US'; // English (US)
    }
    
    let voices = window.speechSynthesis.getVoices();
    let random = this.randomNumberGenerator(20) + 1;
    
    if (voices && voices.length > 0) {
      if (this.preferredVoiceName) {
        const selectedVoice = voices.find((voice) => voice.name === this.preferredVoiceName);
        if (selectedVoice) {
          this.msg.voice = selectedVoice;
          window.speechSynthesis.speak(this.msg);
          return;
        }
      }

      // Try to find voice that matches the language
      const preferredVoices = voices.filter(voice => 
        voice.lang.startsWith(currentLang === 'bn' ? 'bn' : 'en')
      );
      
      if (preferredVoices.length > 0) {
        this.msg.voice = preferredVoices[0];
      } else {
        // Fallback to any voice
        switch (random) {
          case 1:
          case 2:
          case 5:
            if (voices[random]) this.msg.voice = voices[random];
            break;
          case 3:
            if (voices[random * 2]) this.msg.voice = voices[random * 2];
            break;
          case 4:
            if (voices[random * 2 + 2]) this.msg.voice = voices[random * 2 + 2];
            break;
          default:
            break;
        }
      }
    }
    
    window.speechSynthesis.speak(this.msg);
  }

  setPreferredVoice(voiceName) {
    this.preferredVoiceName = voiceName || '';
  }

  getAvailableVoices() {
    if (!this.isSpeechAvailable()) {
      return [];
    }

    return window.speechSynthesis
      .getVoices()
      .filter((voice) => !!voice?.name)
      .map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        default: voice.default,
      }));
  }

  ballByBallCommentry(batsman, runOrOutType, isRun, nonStriker = "") {
    let data = isRun && runOrOutType === 6 ? 5 : runOrOutType;
    let message = "";
    getLocalizedText('runVoice', runVoice);

    let listTobeUsed = isRun ? runVoice : outVoice;
    let randomNumber = this.randomNumberGenerator(20);
    
    if (listTobeUsed[data] && listTobeUsed[data][randomNumber]) {
      message = listTobeUsed[data][randomNumber]
        .replace(/\$\$\$\$\$/g, batsman)
        .replace(/#####/g, nonStriker);
      this.speechHandler(message);
    }

    return message;
  }

  announceTeamChoice(teamName, action) {
    const currentLang = getSavedLanguage();
    const message = `${teamName} ${getLocalizedText('speech.choseToFirst', currentLang)} ${action} ${getLocalizedText('toss.first', currentLang)}`;
    this.speechHandler(message);
  }

  announceTarget(teamName, runs) {
    const currentLang = getSavedLanguage();
    const message = `${teamName} ${getLocalizedText('speech.mustScore', currentLang)} ${runs + 1} ${getLocalizedText('speech.toWin', currentLang)}`;
    this.speechHandler(message);
  }

  announceMatchResult(teamName, margin, type = "runs") {
    const currentLang = getSavedLanguage();
    const runsText = getLocalizedText('gamePlay.runs', currentLang);
    const message = `${teamName} ${getLocalizedText('speech.lostMatchBy', currentLang)} ${margin} ${runsText}`;
    this.speechHandler(message);
  }

  // Stop all speech
  stopSpeech() {
    window.speechSynthesis.cancel();
  }

  // Check if speech synthesis is available
  isSpeechAvailable() {
    return 'speechSynthesis' in window;
  }
}

// Create a singleton instance
const speechHandler = new SpeechHandler();

export default speechHandler;

// Export individual methods with proper binding
export const speak = speechHandler.speechHandler.bind(speechHandler);
export const ballByBallCommentry = speechHandler.ballByBallCommentry.bind(speechHandler);
export const announceTeamChoice = speechHandler.announceTeamChoice.bind(speechHandler);
export const announceTarget = speechHandler.announceTarget.bind(speechHandler);
export const announceMatchResult = speechHandler.announceMatchResult.bind(speechHandler);
export const stopSpeech = speechHandler.stopSpeech.bind(speechHandler);
export const isSpeechAvailable = speechHandler.isSpeechAvailable.bind(speechHandler);
export const setPreferredVoice = speechHandler.setPreferredVoice.bind(speechHandler);
export const getAvailableVoices = speechHandler.getAvailableVoices.bind(speechHandler);