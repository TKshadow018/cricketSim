const STADIUM_ICON_POOL = [
  '/asset/img/icon/stadium/stadium1.png',
  '/asset/img/icon/stadium/stadium2.png',
  '/asset/img/icon/stadium/stadium3.png',
  '/asset/img/icon/stadium/stadium4.png',
  '/asset/img/icon/stadium/stadium5.png',
];

export const PITCH_ICON_PATH = '/asset/img/icon/conditions/pitch-512.svg';
export const OUTFIELD_ICON_PATH = '/asset/img/icon/conditions/outfield-512.svg';

export const buildStadiumSelectionItems = (venueStadiums = []) =>
  venueStadiums.slice(0, 18).map((item) => {
    const randomIndex = Math.floor(Math.random() * STADIUM_ICON_POOL.length);
    const iconPath = STADIUM_ICON_POOL[randomIndex] || STADIUM_ICON_POOL[0];

    return {
      ...item,
      visualClassName: 'sim-choice-visual-stadium',
      renderVisual: () => <img src={iconPath} alt="stadium" className="sim-stadium-choice-image" />,
    };
  });

export const formatConditionLabel = (value = '') =>
  String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const COMMENTATOR_NAME_BANK = {
  India: {
    male: ['Aakash Chopra', 'Nikhil Verma', 'Rohan Mehta', 'Dev Malhotra', 'Arjun Bhat', 'Karan Iyer'],
    female: ['Meera Joshi', 'Ananya Rao', 'Kavya Menon', 'Riya Sharma', 'Isha Nair', 'Pooja Singh'],
  },
  England: {
    male: ['Oliver Grant', 'George Turner', 'Harry Walton', 'Arthur Blake', 'Noah Carter', 'Leo Hughes'],
    female: ['Sophie Bennett', 'Amelia Clarke', 'Lily Brooks', 'Emily Harper', 'Grace Moore', 'Olivia Hall'],
  },
  Australia: {
    male: ['Liam Cooper', 'Jack Miller', 'Ethan Wright', 'Hudson Grant', 'Aiden Blake', 'Mason Reid'],
    female: ['Charlotte Hayes', 'Mia Collins', 'Zoe Parker', 'Ava Turner', 'Matilda Brooks', 'Chloe Bennett'],
  },
  USA: {
    male: ['James Carter', 'Logan Reed', 'Lucas Hayes', 'Henry Stone', 'Mason Parker', 'Ethan Brooks'],
    female: ['Emma Brooks', 'Sophia Morgan', 'Avery Mitchell', 'Harper Clark', 'Mia Carter', 'Ella Jones'],
  },
  Canada: {
    male: ['Noah Sinclair', 'Evan Clarke', 'Ryan Fraser', 'Owen Martin', 'Liam Adams', 'Jacob Wright'],
    female: ['Olivia Martin', 'Chloe Bennett', 'Mila Adams', 'Emma Fraser', 'Ava Clarke', 'Claire Wilson'],
  },
  Ireland: {
    male: ['Conor Murphy', 'Sean Kelly', 'Ronan Doyle', 'Niall Quinn', 'Cian Walsh', 'Darragh Byrne'],
    female: ['Aoife Nolan', 'Niamh OBrien', 'Ciara Quinn', 'Orla Murphy', 'Saoirse Kelly', 'Clodagh Ryan'],
  },
  NewZealand: {
    male: ['Arlo Mason', 'Finn Walker', 'Theo Hudson', 'Lucas Reid', 'Hunter Blake', 'Mason Cole'],
    female: ['Isla Harper', 'Ruby Bennett', 'Sienna Blake', 'Ella Morgan', 'Willow Carter', 'Ava Mason'],
  },
  SouthAfrica: {
    male: ['Thabo Ndlovu', 'Kagiso Mokoena', 'Aiden Smith', 'Ruan Jacobs', 'Liam Naidoo', 'Ethan Khumalo'],
    female: ['Leah Jacobs', 'Amara Naidoo', 'Naledi Khumalo', 'Zara Mokoena', 'Mia Ndlovu', 'Ava Smith'],
  },
  Pakistan: {
    male: ['Hamza Ali', 'Usman Qureshi', 'Saad Malik', 'Ayaan Khan', 'Zayan Raza', 'Bilal Ahmed'],
    female: ['Aisha Khan', 'Noor Ahmed', 'Hania Raza', 'Mariam Ali', 'Alina Qureshi', 'Zara Malik'],
  },
  Bangladesh: {
    male: ['Rahim Hasan', 'Arif Hossain', 'Rafi Karim', 'Siam Islam', 'Nafis Rahman', 'Hasan Chowdhury'],
    female: ['Nusrat Jahan', 'Sadia Noor', 'Tania Akter', 'Afiya Rahman', 'Mahi Hasan', 'Mim Karim'],
  },
  SriLanka: {
    male: ['Kasun Perera', 'Dilan Silva', 'Ravin Senanayake', 'Ishan Fernando', 'Charith Jayawardene', 'Nimal De Silva'],
    female: ['Ishani Fernando', 'Anuki Jayasuriya', 'Piumi De Silva', 'Nethmi Perera', 'Dilani Silva', 'Madhavi Senanayake'],
  },
  Japan: {
    male: ['Haruto Sato', 'Kaito Suzuki', 'Ren Nakamura', 'Daiki Tanaka', 'Sota Kobayashi', 'Yuki Yamamoto'],
    female: ['Aoi Tanaka', 'Sakura Yamamoto', 'Mio Kobayashi', 'Hina Sato', 'Rin Suzuki', 'Yui Nakamura'],
  },
  France: {
    male: ['Louis Martin', 'Arthur Bernard', 'Jules Petit', 'Hugo Moreau', 'Lucas Laurent', 'Noah Dubois'],
    female: ['Chloe Dubois', 'Lea Moreau', 'Camille Laurent', 'Emma Bernard', 'Ines Petit', 'Jade Martin'],
  },
  Default: {
    male: ['Jordan Brown', 'Alex Taylor', 'Sam Parker', 'Jamie Wilson', 'Chris Carter', 'Ryan Stone'],
    female: ['Casey Morgan', 'Riley Carter', 'Alexis Parker', 'Taylor Brooks', 'Morgan Hayes', 'Jamie Reed'],
  },
};

const hashText = (text = '') => {
  let value = 0;
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) >>> 0;
  }
  return value;
};

const regionToCountry = {
  IN: 'India',
  GB: 'England',
  UK: 'England',
  US: 'USA',
  AU: 'Australia',
  CA: 'Canada',
  IE: 'Ireland',
  NZ: 'NewZealand',
  ZA: 'SouthAfrica',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  LK: 'SriLanka',
  JP: 'Japan',
  FR: 'France',
};

const inferCountryKey = (lang = '', voiceName = '') => {
  const parts = String(lang).split('-');
  const region = (parts[1] || '').toUpperCase();
  if (regionToCountry[region]) {
    return regionToCountry[region];
  }

  const countryInName = String(voiceName).match(/\(([^)]+)\)/)?.[1]?.trim();
  if (countryInName) {
    const normalized = countryInName.replace(/\s+/g, '').toLowerCase();
    const matched = Object.keys(COMMENTATOR_NAME_BANK).find(
      (key) => key.toLowerCase() === normalized
    );
    if (matched) {
      return matched;
    }
  }

  return 'Default';
};

const inferGender = (voice = {}) => {
  const explicit = String(voice.gender || '').toLowerCase();
  if (explicit === 'male' || explicit === 'female') {
    return explicit;
  }

  const text = String(voice.name || '').toLowerCase();
  const femaleTokens = ['female', 'heera', 'zira', 'aria', 'jenny', 'sara', 'maya', 'priya', 'mia', 'olivia'];
  const maleTokens = ['male', 'david', 'mark', 'james', 'ryan', 'guy', 'adam', 'liam', 'oliver', 'haruto'];

  if (femaleTokens.some((token) => text.includes(token))) {
    return 'female';
  }
  if (maleTokens.some((token) => text.includes(token))) {
    return 'male';
  }

  return hashText(`${voice.name || ''}::${voice.lang || ''}`) % 2 === 0 ? 'male' : 'female';
};

export const setCommentatorName = (voiceInput = {}) => {
  const voice =
    typeof voiceInput === 'string'
      ? {
          name: voiceInput,
          lang: '',
        }
      : (voiceInput || {});

  const countryKey = inferCountryKey(voice.lang, voice.name);
  const bank = COMMENTATOR_NAME_BANK[countryKey] || COMMENTATOR_NAME_BANK.Default;
  const gender = inferGender(voice);
  const pool = bank[gender] || bank.male || bank.female || COMMENTATOR_NAME_BANK.Default.male;
  const seed = hashText(`${voice.name || ''}::${voice.lang || ''}`);
  return pool[seed % pool.length] || COMMENTATOR_NAME_BANK.Default.male[0];
};

export const buildSaveSummary = (save, matchStatusEnum) => {
  const gameState = save?.gameState || {};
  const stage = gameState.stage;
  const first = gameState.firstInnings || {};
  const second = gameState.secondInnings || {};
  const seriesResults = Array.isArray(gameState.seriesResults) ? gameState.seriesResults : [];
  const tournamentResults = Array.isArray(gameState.tournamentMatches)
    ? gameState.tournamentMatches.filter((match) => match?.isComplete)
    : [];
  const isSeries = gameState.gameMode === 'series';
  const isTournament = gameState.gameMode === 'tournament';
  const overs = (balls) => `${Math.floor((balls || 0) / 6)}.${(balls || 0) % 6}`;

  const standing = seriesResults.reduce(
    (acc, result) => {
      if (result.winnerTeam === gameState.ownTeam) {
        acc.ownWins += 1;
      } else if (result.winnerTeam === gameState.opponentTeam) {
        acc.opponentWins += 1;
      } else {
        acc.ties += 1;
      }
      return acc;
    },
    { ownWins: 0, opponentWins: 0, ties: 0 }
  );

  const prefix = isSeries
    ? `${gameState.seriesLength || 1}-match series • ${gameState.ownTeam || 'Own'} ${standing.ownWins}-${standing.opponentWins} ${gameState.opponentTeam || 'Opponent'} • Match ${gameState.seriesCurrentMatch || 1}: `
    : isTournament
      ? `${(gameState.tournamentOpponentTeams || []).length + 1}-team knockout • ${gameState.tournamentUserTeam || gameState.ownTeam} • Completed ${tournamentResults.length}: `
      : '';

  if (stage === matchStatusEnum.TeamOneBat) {
    return `${prefix}${gameState.firstBattingSide === 'own' ? gameState.ownTeam : gameState.opponentTeam}: ${
      first.score || 0
    }/${first.wickets || 0} (${overs(first.balls)})`;
  }

  if (stage === matchStatusEnum.TeamTwoBat || stage === matchStatusEnum.MatchEnd) {
    const secondBattingTeam = gameState.firstBattingSide === 'own' ? gameState.opponentTeam : gameState.ownTeam;
    return `${prefix}${secondBattingTeam}: ${second.score || 0}/${second.wickets || 0} (${overs(second.balls)})`;
  }

  if (stage === matchStatusEnum.SeriesSummary) {
    return `${prefix}Series completed • Final ${standing.ownWins}-${standing.opponentWins}`;
  }

  return `${prefix}Stage ${stage ?? '-'} setup in progress`;
};
