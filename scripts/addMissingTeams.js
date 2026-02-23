const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const playersDir = path.join(root, 'src', 'gameData', 'players');
const connectorPath = path.join(root, 'src', 'gameData', 'playerListForNation.js');

const squads = {
  'New Zealand': [
    ['Kane Williamson', 'batter_anchor'],
    ['Devon Conway', 'wk_batter'],
    ['Finn Allen', 'batter_power'],
    ['Rachin Ravindra', 'allrounder_spin'],
    ['Daryl Mitchell', 'allrounder_pace'],
    ['Glenn Phillips', 'wk_batter'],
    ['Tom Latham', 'wk_batter'],
    ['Mitchell Santner', 'allrounder_spin'],
    ['Michael Bracewell', 'allrounder_spin'],
    ['Jimmy Neesham', 'allrounder_pace'],
    ['Trent Boult', 'bowler_pace'],
    ['Tim Southee', 'bowler_pace'],
    ['Lockie Ferguson', 'bowler_pace'],
    ['Matt Henry', 'bowler_pace'],
    ['Kyle Jamieson', 'allrounder_pace'],
    ['Ish Sodhi', 'bowler_spin'],
    ['Will Young', 'batter_anchor'],
    ['Mark Chapman', 'batter_power'],
    ['Adam Milne', 'bowler_pace'],
    ['Ben Sears', 'bowler_pace'],
  ],
  Pakistan: [
    ['Babar Azam', 'batter_anchor'],
    ['Mohammad Rizwan', 'wk_batter'],
    ['Fakhar Zaman', 'batter_power'],
    ['Imam-ul-Haq', 'batter_anchor'],
    ['Saim Ayub', 'batter_power'],
    ['Saud Shakeel', 'batter_anchor'],
    ['Iftikhar Ahmed', 'allrounder_spin'],
    ['Shadab Khan', 'allrounder_spin'],
    ['Mohammad Nawaz', 'allrounder_spin'],
    ['Agha Salman', 'allrounder_spin'],
    ['Shaheen Shah Afridi', 'bowler_pace'],
    ['Haris Rauf', 'bowler_pace'],
    ['Naseem Shah', 'bowler_pace'],
    ['Hasan Ali', 'bowler_pace'],
    ['Mohammad Wasim Jr', 'bowler_pace'],
    ['Usama Mir', 'bowler_spin'],
    ['Abrar Ahmed', 'bowler_spin'],
    ['Abdullah Shafique', 'batter_anchor'],
    ['Kamran Ghulam', 'batter_anchor'],
    ['Irfan Khan Niazi', 'batter_power'],
  ],
  'South Africa': [
    ['Temba Bavuma', 'batter_anchor'],
    ['Aiden Markram', 'allrounder_spin'],
    ['Quinton de Kock', 'wk_batter'],
    ['Reeza Hendricks', 'batter_anchor'],
    ['Rassie van der Dussen', 'batter_anchor'],
    ['David Miller', 'batter_power'],
    ['Heinrich Klaasen', 'wk_batter'],
    ['Tristan Stubbs', 'batter_power'],
    ['Marco Jansen', 'allrounder_pace'],
    ['Andile Phehlukwayo', 'allrounder_pace'],
    ['Kagiso Rabada', 'bowler_pace'],
    ['Anrich Nortje', 'bowler_pace'],
    ['Lungi Ngidi', 'bowler_pace'],
    ['Gerald Coetzee', 'bowler_pace'],
    ['Keshav Maharaj', 'bowler_spin'],
    ['Tabraiz Shamsi', 'bowler_spin'],
    ['Bjorn Fortuin', 'bowler_spin'],
    ['Wiaan Mulder', 'allrounder_pace'],
    ['Ryan Rickelton', 'wk_batter'],
    ['Nandre Burger', 'bowler_pace'],
  ],
  'West Indies': [
    ['Shai Hope', 'wk_batter'],
    ['Brandon King', 'batter_anchor'],
    ['Johnson Charles', 'wk_batter'],
    ['Alick Athanaze', 'batter_anchor'],
    ['Nicholas Pooran', 'wk_batter'],
    ['Shimron Hetmyer', 'batter_power'],
    ['Rovman Powell', 'batter_power'],
    ['Andre Russell', 'allrounder_pace'],
    ['Jason Holder', 'allrounder_pace'],
    ['Roston Chase', 'allrounder_spin'],
    ['Romario Shepherd', 'allrounder_pace'],
    ['Alzarri Joseph', 'bowler_pace'],
    ['Akeal Hosein', 'bowler_spin'],
    ['Gudakesh Motie', 'bowler_spin'],
    ['Obed McCoy', 'bowler_pace'],
    ['Shamar Joseph', 'bowler_pace'],
    ['Keacy Carty', 'batter_anchor'],
    ['Kavem Hodge', 'allrounder_spin'],
    ['Yannic Cariah', 'bowler_spin'],
    ['Matthew Forde', 'allrounder_pace'],
  ],
  'Sri Lanka': [
    ['Pathum Nissanka', 'batter_anchor'],
    ['Kusal Perera', 'wk_batter'],
    ['Kusal Mendis', 'wk_batter'],
    ['Avishka Fernando', 'batter_power'],
    ['Charith Asalanka', 'allrounder_spin'],
    ['Sadeera Samarawickrama', 'wk_batter'],
    ['Kamindu Mendis', 'allrounder_spin'],
    ['Dasun Shanaka', 'allrounder_pace'],
    ['Wanindu Hasaranga', 'allrounder_spin'],
    ['Maheesh Theekshana', 'bowler_spin'],
    ['Dunith Wellalage', 'allrounder_spin'],
    ['Matheesha Pathirana', 'bowler_pace'],
    ['Dushmantha Chameera', 'bowler_pace'],
    ['Dilshan Madushanka', 'bowler_pace'],
    ['Kasun Rajitha', 'bowler_pace'],
    ['Nuwan Thushara', 'bowler_pace'],
    ['Jeffrey Vandersay', 'bowler_spin'],
    ['Niroshan Dickwella', 'wk_batter'],
    ['Nuwanidu Fernando', 'batter_anchor'],
    ['Chamika Karunaratne', 'allrounder_pace'],
  ],
  Zimbabwe: [
    ['Craig Ervine', 'batter_anchor'],
    ['Joylord Gumbie', 'wk_batter'],
    ['Tadiwanashe Marumani', 'wk_batter'],
    ['Wesley Madhevere', 'allrounder_spin'],
    ['Sikandar Raza', 'allrounder_spin'],
    ['Sean Williams', 'allrounder_spin'],
    ['Ryan Burl', 'allrounder_spin'],
    ['Clive Madande', 'wk_batter'],
    ['Innocent Kaia', 'batter_anchor'],
    ['Brian Bennett', 'allrounder_pace'],
    ['Blessing Muzarabani', 'bowler_pace'],
    ['Richard Ngarava', 'bowler_pace'],
    ['Luke Jongwe', 'allrounder_pace'],
    ['Tendai Chatara', 'bowler_pace'],
    ['Victor Nyauchi', 'bowler_pace'],
    ['Brandon Mavuta', 'bowler_spin'],
    ['Ainsley Ndlovu', 'bowler_spin'],
    ['Faraz Akram', 'allrounder_pace'],
    ['Wellington Masakadza', 'allrounder_spin'],
    ['Takudzwanashe Kaitano', 'batter_anchor'],
  ],
  Netherlands: [
    ['Scott Edwards', 'wk_batter'],
    ['Max ODowd', 'batter_anchor'],
    ['Vikramjit Singh', 'batter_anchor'],
    ['Teja Nidamanuru', 'batter_power'],
    ['Bas de Leede', 'allrounder_pace'],
    ['Colin Ackermann', 'allrounder_spin'],
    ['Sybrand Engelbrecht', 'allrounder_spin'],
    ['Noah Croes', 'wk_batter'],
    ['Roelof van der Merwe', 'allrounder_spin'],
    ['Logan van Beek', 'allrounder_pace'],
    ['Paul van Meekeren', 'bowler_pace'],
    ['Aryan Dutt', 'bowler_spin'],
    ['Vivian Kingma', 'bowler_pace'],
    ['Fred Klaassen', 'bowler_pace'],
    ['Ryan Klein', 'bowler_pace'],
    ['Shariz Ahmad', 'bowler_spin'],
    ['Kyle Klein', 'bowler_pace'],
    ['Michael Levitt', 'batter_power'],
    ['Wesley Barresi', 'wk_batter'],
    ['Saqib Zulfiqar', 'allrounder_spin'],
  ],
  Scotland: [
    ['Richie Berrington', 'batter_anchor'],
    ['George Munsey', 'batter_power'],
    ['Michael Jones', 'batter_power'],
    ['Brandon McMullen', 'allrounder_pace'],
    ['Matthew Cross', 'wk_batter'],
    ['Charlie Tear', 'batter_anchor'],
    ['Tom Mackintosh', 'wk_batter'],
    ['Michael Leask', 'allrounder_spin'],
    ['Chris Greaves', 'allrounder_spin'],
    ['Mark Watt', 'bowler_spin'],
    ['Brad Wheal', 'bowler_pace'],
    ['Safyaan Sharif', 'bowler_pace'],
    ['Chris Sole', 'bowler_pace'],
    ['Hamza Tahir', 'bowler_spin'],
    ['Jasper Davidson', 'allrounder_pace'],
    ['Dylan Budge', 'batter_anchor'],
    ['Oli Hairs', 'batter_power'],
    ['Jack Jarvis', 'allrounder_pace'],
    ['Alasdair Evans', 'bowler_pace'],
    ['Gavin Main', 'bowler_pace'],
  ],
  UAE: [
    ['Muhammad Waseem', 'batter_power'],
    ['Vriitya Aravind', 'wk_batter'],
    ['Asif Khan', 'batter_power'],
    ['Alishan Sharafu', 'batter_anchor'],
    ['Waseem Muhammad', 'batter_power'],
    ['Basil Hameed', 'allrounder_spin'],
    ['Aayan Afzal Khan', 'allrounder_spin'],
    ['Ali Naseer', 'allrounder_pace'],
    ['Aryansh Sharma', 'wk_batter'],
    ['Sanchit Sharma', 'bowler_pace'],
    ['Junaid Siddique', 'bowler_pace'],
    ['Zahoor Khan', 'bowler_pace'],
    ['Karthik Meiyappan', 'bowler_spin'],
    ['Haider Ali', 'allrounder_spin'],
    ['Ammar Badami', 'allrounder_spin'],
    ['Akif Raja', 'allrounder_pace'],
    ['Sabir Ali', 'bowler_pace'],
    ['Dhruv Parashar', 'allrounder_spin'],
    ['Lovepreet Singh', 'batter_anchor'],
    ['Khalid Shah', 'wk_batter'],
  ],
  Oman: [
    ['Jatinder Singh', 'batter_power'],
    ['Kashyap Prajapati', 'batter_anchor'],
    ['Aqib Ilyas', 'allrounder_spin'],
    ['Shoaib Khan', 'batter_anchor'],
    ['Ayaan Khan', 'allrounder_spin'],
    ['Khalid Kail', 'batter_power'],
    ['Naseem Khushi', 'wk_batter'],
    ['Pratik Athavale', 'wk_batter'],
    ['Mehran Khan', 'allrounder_pace'],
    ['Rafiullah', 'allrounder_pace'],
    ['Bilal Khan', 'bowler_pace'],
    ['Fayyaz Butt', 'bowler_pace'],
    ['Kaleemullah', 'bowler_pace'],
    ['Shakeel Ahmed', 'bowler_spin'],
    ['Samay Shrivastava', 'bowler_spin'],
    ['Sufyan Mehmood', 'allrounder_spin'],
    ['Zeeshan Maqsood', 'allrounder_spin'],
    ['Suraj Kumar', 'wk_batter'],
    ['Jay Odedra', 'bowler_spin'],
    ['Aamir Kaleem', 'allrounder_spin'],
  ],
};

const base = {
  batter_anchor: { abilityToPlayPaceBall: 81, abilityToPlaySpinBall: 80, battingAggresion: 72, spinAbility: 8, paceAbility: 8, isWicketKeeper: false },
  batter_power: { abilityToPlayPaceBall: 84, abilityToPlaySpinBall: 76, battingAggresion: 88, spinAbility: 6, paceAbility: 10, isWicketKeeper: false },
  wk_batter: { abilityToPlayPaceBall: 79, abilityToPlaySpinBall: 75, battingAggresion: 78, spinAbility: 4, paceAbility: 4, isWicketKeeper: true },
  allrounder_pace: { abilityToPlayPaceBall: 76, abilityToPlaySpinBall: 70, battingAggresion: 74, spinAbility: 14, paceAbility: 70, isWicketKeeper: false },
  allrounder_spin: { abilityToPlayPaceBall: 74, abilityToPlaySpinBall: 78, battingAggresion: 72, spinAbility: 72, paceAbility: 14, isWicketKeeper: false },
  bowler_pace: { abilityToPlayPaceBall: 54, abilityToPlaySpinBall: 44, battingAggresion: 40, spinAbility: 8, paceAbility: 85, isWicketKeeper: false },
  bowler_spin: { abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 58, battingAggresion: 38, spinAbility: 85, paceAbility: 8, isWicketKeeper: false },
};

const eliteBatters = new Set([
  'Kane Williamson', 'Babar Azam', 'Mohammad Rizwan', 'Quinton de Kock', 'David Miller',
  'Shai Hope', 'Nicholas Pooran', 'Pathum Nissanka', 'Kusal Mendis', 'Sikandar Raza',
  'Scott Edwards', 'Richie Berrington', 'Muhammad Waseem', 'Jatinder Singh'
]);

const eliteAllRounders = new Set([
  'Rachin Ravindra', 'Mitchell Santner', 'Shadab Khan', 'Aiden Markram', 'Marco Jansen',
  'Andre Russell', 'Jason Holder', 'Wanindu Hasaranga', 'Sikandar Raza', 'Bas de Leede',
  'Brandon McMullen', 'Aqib Ilyas', 'Ayaan Khan'
]);

const elitePace = new Set([
  'Trent Boult', 'Tim Southee', 'Lockie Ferguson', 'Shaheen Shah Afridi', 'Haris Rauf',
  'Naseem Shah', 'Kagiso Rabada', 'Anrich Nortje', 'Alzarri Joseph', 'Matheesha Pathirana',
  'Dushmantha Chameera', 'Blessing Muzarabani', 'Paul van Meekeren', 'Bilal Khan'
]);

const eliteSpin = new Set([
  'Mitchell Santner', 'Shadab Khan', 'Keshav Maharaj', 'Akeal Hosein', 'Wanindu Hasaranga',
  'Maheesh Theekshana', 'Roston Chase', 'Sikandar Raza', 'Aryan Dutt', 'Mark Watt',
  'Karthik Meiyappan', 'Ayaan Khan', 'Aamir Kaleem'
]);

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const hash = (name) => [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
const fileToken = (nation) => nation.replace(/\s+/g, '');

const tunedPlayer = (id, name, archetype) => {
  const b = base[archetype];
  const offset = (hash(name) % 5) - 2;

  const batterBoost = eliteBatters.has(name) ? 8 : 0;
  const allroundBoost = eliteAllRounders.has(name) ? 5 : 0;
  const paceBoost = elitePace.has(name) ? 8 : 0;
  const spinBoost = eliteSpin.has(name) ? 8 : 0;

  return {
    id,
    name,
    abilityToPlayPaceBall: clamp(b.abilityToPlayPaceBall + offset + batterBoost + allroundBoost, 35, 96),
    abilityToPlaySpinBall: clamp(b.abilityToPlaySpinBall + Math.floor(offset / 2) + batterBoost + allroundBoost, 35, 96),
    battingAggresion: clamp(b.battingAggresion + offset + Math.floor(batterBoost / 2), 25, 95),
    isWicketKeeper: b.isWicketKeeper,
    spinAbility: clamp(b.spinAbility + Math.floor(offset / 2) + spinBoost + Math.floor(allroundBoost / 2), 0, 98),
    paceAbility: clamp(b.paceAbility + Math.floor(offset / 2) + paceBoost + Math.floor(allroundBoost / 2), 0, 98),
    currentMatch: {
      run: 0,
      ball: 0,
      isBatting: id <= 2 ? 1 : 0,
      b_run: 0,
      b_ball: 0,
      b_wkt: 0,
    },
  };
};

for (const [nation, list] of Object.entries(squads)) {
  const moduleName = `${fileToken(nation)}Players`;
  const data = list.slice(0, 20).map(([name, role], index) => tunedPlayer(index + 1, name, role));
  const content = `const ${moduleName} = ${JSON.stringify(data, null, 2)};\n\nexport default ${moduleName};\n`;
  fs.writeFileSync(path.join(playersDir, `${fileToken(nation)}.js`), content, 'utf8');
}

const countrySource = fs.readFileSync(path.join(root, 'src', 'gameData', 'countries.js'), 'utf8');
const countryMatches = [...countrySource.matchAll(/"([^"]+)"\s*:\s*\{/g)].map((m) => m[1]);
const nationNames = countryMatches;

const importLines = nationNames
  .map((name) => `import ${fileToken(name)}Players from './players/${fileToken(name)}';`)
  .join('\n');

const mapLines = nationNames
  .map((name) => `  '${name}': ${fileToken(name)}Players,`)
  .join('\n');

const connector = `${importLines}\n\nconst playerListForNation = {\n${mapLines}\n};\n\nconst getPlayersForNations = (ownTeam, opponentTeam) => ({\n  ownPlayers: playerListForNation[ownTeam] || [],\n  opponentPlayers: playerListForNation[opponentTeam] || [],\n});\n\nexport { playerListForNation, getPlayersForNations };\n`;

fs.writeFileSync(connectorPath, connector, 'utf8');
console.log(`Added/updated ${Object.keys(squads).length} missing team files and rebuilt connector.`);
