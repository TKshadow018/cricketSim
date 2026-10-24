import { runVoice } from '../gameData/runVoice';
import { outVoice } from '../gameData/outVoice';

const originalUtterance = global.SpeechSynthesisUtterance;
const originalSpeechSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis');

global.SpeechSynthesisUtterance = class MockSpeechSynthesisUtterance {
  constructor() {
    this.text = '';
    this.lang = '';
    this.voice = null;
  }
};

const speech = require('./speechUtils');
const { default: speechHandler } = speech;

const setSpeechSynthesis = (speechSynthesis) => {
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    writable: true,
    value: speechSynthesis,
  });
};

const makeSpeechSynthesis = (voices = []) => ({
  cancel: jest.fn(),
  speak: jest.fn(),
  getVoices: jest.fn(() => voices),
});

beforeEach(() => {
  localStorage.clear();
  speechHandler.setPreferredVoice('');
  setSpeechSynthesis(makeSpeechSynthesis());
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  if (originalSpeechSynthesis) {
    Object.defineProperty(window, 'speechSynthesis', originalSpeechSynthesis);
  } else {
    delete window.speechSynthesis;
  }

  if (originalUtterance === undefined) {
    delete global.SpeechSynthesisUtterance;
  } else {
    global.SpeechSynthesisUtterance = originalUtterance;
  }
});

test('does not speak when the browser lacks speech synthesis', () => {
  delete window.speechSynthesis;

  expect(speech.isSpeechAvailable()).toBe(false);
  expect(speech.getAvailableVoices()).toEqual([]);
  speech.speak('unavailable');
});

test('uses a preferred voice and sets the English language', () => {
  const voice = { name: 'Preferred', lang: 'en-GB', default: false };
  const speechSynthesis = makeSpeechSynthesis([voice]);
  setSpeechSynthesis(speechSynthesis);
  speech.setPreferredVoice('Preferred');

  speech.speak('Welcome');

  expect(speechSynthesis.cancel).toHaveBeenCalledTimes(1);
  expect(speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({
    text: 'Welcome',
    lang: 'en-US',
    voice,
  }));
});

test('selects the first language-matched voice and localizes the utterance language', () => {
  localStorage.setItem('language', 'bn');
  const englishVoice = { name: 'English', lang: 'en-US' };
  const banglaVoice = { name: 'Bangla', lang: 'bn-BD' };
  const speechSynthesis = makeSpeechSynthesis([englishVoice, banglaVoice]);
  setSpeechSynthesis(speechSynthesis);
  speech.setPreferredVoice('missing voice');

  speech.speak('স্বাগতম');

  expect(speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({
    lang: 'bn-BD',
    voice: banglaVoice,
  }));
});

test.each([
  [0, 1],
  [0.1, 6],
  [0.15, 10],
  [0.2, 5],
])('uses the random voice fallback for random value %s', (randomValue, voiceIndex) => {
  const voices = Array.from({ length: 20 }, (_, index) => ({ name: `Voice ${index}`, lang: 'fr-FR' }));
  const speechSynthesis = makeSpeechSynthesis(voices);
  setSpeechSynthesis(speechSynthesis);
  jest.spyOn(Math, 'random').mockReturnValue(randomValue);

  speech.speak('Fallback voice');

  expect(speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({ voice: voices[voiceIndex] }));
});

test('speaks without a matching voice and leaves the voice unset when no fallback index exists', () => {
  const speechSynthesis = makeSpeechSynthesis([{ name: 'Only voice', lang: 'fr-FR' }]);
  setSpeechSynthesis(speechSynthesis);
  jest.spyOn(Math, 'random').mockReturnValue(0);
  speechHandler.msg.voice = null;

  speech.speak('No indexed voice');

  expect(speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({
    text: 'No indexed voice',
    voice: null,
  }));
});

test.each([
  [0.1, 4],
  [0.15, 8],
])('keeps the voice unset when the random fallback index %s is missing', (randomValue, voiceCount) => {
  const speechSynthesis = makeSpeechSynthesis(
    Array.from({ length: voiceCount }, (_, index) => ({ name: `Voice ${index}`, lang: 'fr-FR' }))
  );
  setSpeechSynthesis(speechSynthesis);
  jest.spyOn(Math, 'random').mockReturnValue(randomValue);
  speechHandler.msg.voice = null;

  speech.speak('Missing fallback voice');

  expect(speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({ voice: null }));
});

test('uses the default branch when no random fallback case matches', () => {
  const speechSynthesis = makeSpeechSynthesis([{ name: 'French', lang: 'fr-FR' }]);
  setSpeechSynthesis(speechSynthesis);
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  speechHandler.msg.voice = null;

  speech.speak('Default fallback');

  expect(speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({ voice: null }));
});

test('speaks when no voices are available', () => {
  const speechSynthesis = makeSpeechSynthesis([]);
  setSpeechSynthesis(speechSynthesis);

  speech.speak('No voices');

  expect(speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({
    text: 'No voices',
    voice: null,
  }));
});

test('lists only named voices with their public metadata', () => {
  setSpeechSynthesis(makeSpeechSynthesis([
    { name: 'English', lang: 'en-US', default: true },
    { name: '', lang: 'en-GB', default: false },
    null,
  ]));

  expect(speech.getAvailableVoices()).toEqual([
    { name: 'English', lang: 'en-US', default: true },
  ]);
});

test('uses run and dismissal commentary and returns an empty string for unsupported outcomes', () => {
  const speechSynthesis = makeSpeechSynthesis([{ name: 'English', lang: 'en-US' }]);
  setSpeechSynthesis(speechSynthesis);
  jest.spyOn(Math, 'random').mockReturnValue(0);

  const sixMessage = speech.ballByBallCommentry('Batter', 6, true);
  const outMessage = speech.ballByBallCommentry('Batter', 0, false, 'Runner');

  expect(sixMessage).toBe(runVoice[5][0].replace(/\$\$\$\$\$/g, 'Batter'));
  expect(outMessage).toBe(outVoice[0][0].replace(/\$\$\$\$\$/g, 'Batter').replace(/#####/g, 'Runner'));
  expect(speech.ballByBallCommentry('Batter', 99, true)).toBe('');
  expect(speechSynthesis.speak).toHaveBeenCalledTimes(2);
});

test('announces choices, targets and results and supports canceling speech', () => {
  const speechSynthesis = makeSpeechSynthesis([{ name: 'English', lang: 'en-US' }]);
  setSpeechSynthesis(speechSynthesis);
  const spokenTexts = [];
  speechSynthesis.speak.mockImplementation((message) => spokenTexts.push(message.text));

  speech.announceTeamChoice('India', 'bat');
  speech.announceTarget('Australia', 150);
  speech.announceMatchResult('England', 12);
  speech.announceMatchResult('England', 3, 'wickets');
  speech.stopSpeech();

  expect(speechSynthesis.speak).toHaveBeenCalledTimes(4);
  expect(spokenTexts).toEqual([
    'India chose to bat first',
    'Australia must score 151 to win',
    'England lost match by 12 runs',
    'England lost match by 3 runs',
  ]);
  expect(speechSynthesis.cancel).toHaveBeenCalledTimes(5);
});

test('localizes spoken announcements and falls back to English for unknown locales', () => {
  const speechSynthesis = makeSpeechSynthesis([
    { name: 'English', lang: 'en-US' },
    { name: 'Bangla', lang: 'bn-BD' },
  ]);
  const spokenTexts = [];
  speechSynthesis.speak.mockImplementation((message) => spokenTexts.push(message.text));
  setSpeechSynthesis(speechSynthesis);

  localStorage.setItem('app_locale', 'bn');
  speech.announceTeamChoice('India', 'bat');
  localStorage.setItem('app_locale', 'fr');
  speech.announceTeamChoice('Australia', 'bowl');

  expect(spokenTexts).toEqual([
    'India আগে বেছে নিয়েছে bat প্রথমে',
    'Australia chose to bowl first',
  ]);
});

test('uses the English fallback when local storage access throws', () => {
  const speechSynthesis = makeSpeechSynthesis([{ name: 'English', lang: 'en-US' }]);
  setSpeechSynthesis(speechSynthesis);
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('storage unavailable');
  });

  speech.speak('Fallback locale');

  expect(speechSynthesis.speak).toHaveBeenCalledWith(expect.objectContaining({ lang: 'en-US' }));
});
