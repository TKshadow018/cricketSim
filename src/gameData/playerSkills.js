import { skillList } from './skillList';

const nationalPlayerSkills = {
  'Rahmanullah Gurbaz': ['PowerplaySpecialist', 'HardHitter'],
  'Ibrahim Zadran': ['Anchor', 'CoverDriveArtist'],
  'Hazratullah Zazai': ['HardHitter', 'PowerplaySpecialist'],
  'Azmatullah Omarzai': ['SeamSpecialist', 'Finisher'],
  'Mohammad Nabi': ['MagicHand', 'CaptainCalm'],
  'Rashid Khan': ['SpinWizard', 'GooglyGenius', 'ClutchPerformer'],
  'Mujeeb Ur Rahman': ['DoosraArtist', 'MagicHand', 'FlightMaster'],
  'Noor Ahmad': ['SpinWizard', 'FlightMaster'],
  'Gulbadin Naib': ['Finisher'],
  'Fazalhaq Farooqi': ['SwingMaster', 'YorkerKing'],
  'David Warner': ['PowerplaySpecialist', 'HardHitter'],
  'Travis Head': ['PowerplaySpecialist', 'HardHitter', 'ClutchPerformer'],
  'Steve Smith': ['Anchor', 'SweepSpecialist'],
  'Marnus Labuschagne': ['Anchor', 'CoverDriveArtist'],
  'Mitchell Marsh': ['HardHitter', 'Finisher'],
  'Glenn Maxwell': ['HardHitter', 'Finisher', 'ClutchPerformer'],
  'Marcus Stoinis': ['HardHitter', 'Finisher'],
  'Cameron Green': ['CoverDriveArtist', 'SeamSpecialist'],
  'Josh Inglis': ['PowerplaySpecialist', 'SafeHands'],
  'Alex Carey': ['WicketWall', 'SafeHands'],
  'Pat Cummins': ['SeamSpecialist', 'SwingMaster', 'CaptainCalm'],
  'Mitchell Starc': ['YorkerKing', 'SwingMaster'],
  'Josh Hazlewood': ['SeamSpecialist', 'SwingMaster'],
  'Adam Zampa': ['SpinWizard', 'GooglyGenius'],
  'Liton Das': ['PowerplaySpecialist', 'CoverDriveArtist'],
  'Soumya Sarkar': ['PowerplaySpecialist', 'HardHitter'],
  'Najmul Hossain Shanto': ['Anchor', 'CoverDriveArtist'],
  'Mushfiqur Rahim': ['Anchor', 'WicketWall', 'SafeHands'],
  'Shakib Al Hasan': ['SpinWizard', 'Anchor', 'CaptainCalm'],
  'Mahmudullah': ['Finisher', 'ClutchPerformer'],
  'Mehidy Hasan Miraz': ['FlightMaster', 'SafeHands'],
  'Taskin Ahmed': ['SeamSpecialist', 'SwingMaster'],
  'Mustafizur Rahman': ['YorkerKing', 'ReverseSwingArtist'],
  'Rishad Hossain': ['GooglyGenius', 'SpinWizard'],
  'Jos Buttler': ['PowerplaySpecialist', 'HardHitter', 'Finisher'],
  'Jonny Bairstow': ['PowerplaySpecialist', 'HardHitter'],
  'Phil Salt': ['PowerplaySpecialist', 'HardHitter'],
  'Joe Root': ['Anchor', 'CoverDriveArtist', 'SweepSpecialist'],
  'Harry Brook': ['HardHitter', 'Finisher'],
  'Ben Stokes': ['Finisher', 'ClutchPerformer', 'CaptainCalm'],
  'Liam Livingstone': ['HardHitter', 'Finisher'],
  'Moeen Ali': ['SweepSpecialist', 'SpinWizard'],
  'Sam Curran': ['Finisher', 'SwingMaster'],
  'Jofra Archer': ['YorkerKing', 'SeamSpecialist'],
  'Mark Wood': ['SeamSpecialist', 'YorkerKing'],
  'Adil Rashid': ['GooglyGenius', 'FlightMaster'],
  'Rohit Sharma': ['PowerplaySpecialist', 'HardHitter', 'CaptainCalm'],
  'Shubman Gill': ['CoverDriveArtist', 'Anchor'],
  'Virat Kohli': ['CoverDriveArtist', 'Anchor', 'ClutchPerformer'],
  'KL Rahul': ['CoverDriveArtist', 'WicketWall'],
  'Rishabh Pant': ['HardHitter', 'Finisher', 'WicketWall'],
  'Suryakumar Yadav': ['SlowMotionVision', 'HardHitter', 'Finisher'],
  'Hardik Pandya': ['HardHitter', 'Finisher'],
  'Ravindra Jadeja': ['SafeHands', 'ClutchPerformer'],
  'Kuldeep Yadav': ['SpinWizard', 'GooglyGenius', 'MagicHand'],
  'Jasprit Bumrah': ['YorkerKing', 'ReverseSwingArtist', 'ClutchPerformer'],
  'Mohammed Shami': ['SwingMaster', 'SeamSpecialist'],
  'Mohammed Siraj': ['SwingMaster', 'SeamSpecialist'],
  'Rinku Singh': ['Finisher', 'ClutchPerformer'],
  'Yashasvi Jaiswal': ['PowerplaySpecialist', 'HardHitter'],
  'Paul Stirling': ['PowerplaySpecialist', 'HardHitter'],
  'Andrew Balbirnie': ['Anchor', 'CoverDriveArtist'],
  'Lorcan Tucker': ['WicketWall', 'SafeHands'],
  'Curtis Campher': ['SeamSpecialist', 'Finisher'],
  'Josh Little': ['YorkerKing', 'SwingMaster'],
  'Steve Tikolo': ['Anchor', 'ClutchPerformer', 'CaptainCalm'],
  'Collins Obuya': ['SpinWizard', 'Anchor'],
  'Thomas Odoyo': ['SeamSpecialist', 'Finisher'],
  'Gerhard Erasmus': ['Anchor', 'SafeHands', 'CaptainCalm'],
  'David Wiese': ['Finisher', 'SeamSpecialist'],
  'JJ Smit': ['HardHitter', 'SeamSpecialist'],
  'Ruben Trumpelmann': ['SwingMaster', 'YorkerKing'],
  'Bernard Scholtz': ['FlightMaster', 'SpinWizard'],
  'Rohit Paudel': ['Anchor', 'CoverDriveArtist'],
  'Kushal Bhurtel': ['PowerplaySpecialist', 'HardHitter'],
  'Aasif Sheikh': ['WicketWall', 'SafeHands'],
  'Dipendra Singh Airee': ['Finisher', 'ClutchPerformer'],
  'Sandeep Lamichhane': ['GooglyGenius', 'SpinWizard'],
  'Karan KC': ['SeamSpecialist', 'SwingMaster'],
  'Scott Edwards': ['WicketWall', 'SafeHands', 'CaptainCalm'],
  'Max ODowd': ['Anchor', 'CoverDriveArtist'],
  'Bas de Leede': ['Finisher', 'SeamSpecialist'],
  'Roelof van der Merwe': ['FlightMaster', 'SpinWizard'],
  'Logan van Beek': ['SeamSpecialist', 'Finisher'],
  'Kane Williamson': ['Anchor', 'CoverDriveArtist', 'ClutchPerformer'],
  'Devon Conway': ['Anchor', 'CoverDriveArtist'],
  'Finn Allen': ['PowerplaySpecialist', 'HardHitter'],
  'Rachin Ravindra': ['CoverDriveArtist', 'SweepSpecialist'],
  'Glenn Phillips': ['HardHitter', 'Finisher', 'SafeHands'],
  'Mitchell Santner': ['FlightMaster', 'SpinWizard'],
  'Trent Boult': ['SwingMaster', 'YorkerKing'],
  'Tim Southee': ['SwingMaster', 'SeamSpecialist'],
  'Jatinder Singh': ['Anchor', 'CoverDriveArtist'],
  'Aqib Ilyas': ['HardHitter', 'Finisher'],
  'Zeeshan Maqsood': ['SpinWizard', 'Anchor', 'CaptainCalm'],
  'Bilal Khan': ['SwingMaster', 'YorkerKing'],
  'Babar Azam': ['Anchor', 'CoverDriveArtist', 'ClutchPerformer'],
  'Mohammad Rizwan': ['Anchor', 'WicketWall', 'SafeHands'],
  'Fakhar Zaman': ['PowerplaySpecialist', 'HardHitter'],
  'Shadab Khan': ['GooglyGenius', 'SafeHands'],
  'Shaheen Shah Afridi': ['SwingMaster', 'YorkerKing'],
  'Haris Rauf': ['SeamSpecialist', 'YorkerKing'],
  'Naseem Shah': ['SwingMaster', 'SeamSpecialist'],
  'Abrar Ahmed': ['GooglyGenius', 'MagicHand'],
  'Richie Berrington': ['Anchor', 'HardHitter', 'CaptainCalm'],
  'George Munsey': ['PowerplaySpecialist', 'HardHitter'],
  'Matthew Cross': ['WicketWall', 'SafeHands'],
  'Michael Leask': ['HardHitter', 'Finisher'],
  'Mark Watt': ['FlightMaster', 'SpinWizard'],
  'Temba Bavuma': ['Anchor', 'CaptainCalm'],
  'Aiden Markram': ['CoverDriveArtist', 'PowerplaySpecialist'],
  'Quinton de Kock': ['PowerplaySpecialist', 'WicketWall', 'SafeHands'],
  'David Miller': ['Finisher', 'ClutchPerformer', 'HardHitter'],
  'Heinrich Klaasen': ['HardHitter', 'Finisher'],
  'Kagiso Rabada': ['SeamSpecialist', 'SwingMaster'],
  'Anrich Nortje': ['SeamSpecialist', 'YorkerKing'],
  'Keshav Maharaj': ['FlightMaster', 'SpinWizard'],
  'Pathum Nissanka': ['Anchor', 'CoverDriveArtist'],
  'Kusal Perera': ['PowerplaySpecialist', 'HardHitter'],
  'Kusal Mendis': ['HardHitter', 'CoverDriveArtist'],
  'Charith Asalanka': ['Anchor', 'Finisher'],
  'Dasun Shanaka': ['Finisher', 'ClutchPerformer'],
  'Wanindu Hasaranga': ['GooglyGenius', 'SpinWizard', 'Finisher'],
  'Maheesh Theekshana': ['MagicHand', 'DoosraArtist'],
  'Matheesha Pathirana': ['YorkerKing', 'SeamSpecialist'],
  'Niroshan Dickwella': ['WicketWall', 'HardHitter'],
  'Shai Hope': ['Anchor', 'CoverDriveArtist', 'CaptainCalm'],
  'Brandon King': ['PowerplaySpecialist', 'CoverDriveArtist'],
  'Nicholas Pooran': ['HardHitter', 'Finisher', 'WicketWall'],
  'Shimron Hetmyer': ['HardHitter', 'Finisher'],
  'Rovman Powell': ['HardHitter', 'Finisher', 'ClutchPerformer'],
  'Andre Russell': ['HardHitter', 'Finisher', 'ClutchPerformer'],
  'Jason Holder': ['SeamSpecialist', 'CaptainCalm'],
  'Roston Chase': ['Anchor', 'FlightMaster'],
  'Akeal Hosein': ['FlightMaster', 'SpinWizard'],
  'Craig Ervine': ['Anchor', 'CoverDriveArtist'],
  'Sikandar Raza': ['Finisher', 'SpinWizard', 'ClutchPerformer'],
  'Sean Williams': ['Anchor', 'SweepSpecialist'],
  'Ryan Burl': ['HardHitter', 'Finisher'],
  'Clive Madande': ['WicketWall', 'SafeHands'],
  'Blessing Muzarabani': ['SeamSpecialist', 'YorkerKing'],
  'Richard Ngarava': ['SwingMaster', 'SeamSpecialist'],
  'Muhammad Waseem': ['PowerplaySpecialist', 'HardHitter'],
  'Vriitya Aravind': ['WicketWall', 'Anchor'],
  'Aayan Afzal Khan': ['FlightMaster', 'SpinWizard'],
  'Junaid Siddique': ['SwingMaster', 'YorkerKing'],
  'Aaron Johnson': ['PowerplaySpecialist', 'HardHitter'],
  'Saad Bin Zafar': ['FlightMaster', 'CaptainCalm'],
  'Kaleem Sana': ['YorkerKing', 'SwingMaster'],
};

const BATTING_ROLES = new Set([
  'batsman',
  'batter',
  'wicketkeeper',
  'pace allrounder',
  'spin allrounder',
]);

const BOWLING_ROLES = new Set([
  'pacer',
  'spiner',
  'spinner',
  'bowler',
  'bowler pacer',
  'bowler spinner',
  'pace allrounder',
  'spin allrounder',
]);

export const getNationalPlayerSkills = (player = {}) =>
  nationalPlayerSkills[player.name] || [];

export const assignCareerSkills = (player = {}, maximumSkills = 2) => {
  const maxSkills = Math.min(2, Math.max(0, Math.floor(Number(maximumSkills) || 0)));
  if (!maxSkills) {
    return [];
  }

  const role = String(player.playerType || '').trim().toLowerCase();
  const eligibleSkills = skillList.filter(({ affects }) => {
    if (affects === 'batting') {
      return BATTING_ROLES.has(role);
    }
    if (affects === 'bowling') {
      return BOWLING_ROLES.has(role);
    }
    return true;
  });
  const rolledSkills = eligibleSkills.filter(
    ({ frequency }) => Math.random() * 100 < frequency
  );

  for (let index = rolledSkills.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [rolledSkills[index], rolledSkills[swapIndex]] = [
      rolledSkills[swapIndex],
      rolledSkills[index],
    ];
  }

  return rolledSkills.slice(0, maxSkills).map(({ name }) => name);
};

export const limitPlayerSkills = (player = {}, maximumSkills = 3) => {
  const maxSkills = Math.max(0, Math.floor(Number(maximumSkills) || 0));
  const knownSkills = new Set(skillList.map(({ name }) => name));
  return Array.isArray(player.skills)
    ? player.skills.filter((name) => knownSkills.has(name)).slice(0, maxSkills)
    : [];
};

export const addSkillsToPlayers = (players = [], maximumSkills = 3) =>
  players.map((player) => ({
    ...player,
    skills: getNationalPlayerSkills(player).slice(0, Math.min(3, Math.max(0, maximumSkills))),
  }));
