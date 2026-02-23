import IndiaPlayers from './players/India';
import AustraliaPlayers from './players/Australia';
import EnglandPlayers from './players/England';
import NewZealandPlayers from './players/NewZealand';
import PakistanPlayers from './players/Pakistan';
import SouthAfricaPlayers from './players/SouthAfrica';
import WestIndiesPlayers from './players/WestIndies';
import SriLankaPlayers from './players/SriLanka';
import BangladeshPlayers from './players/Bangladesh';
import AfghanistanPlayers from './players/Afghanistan';
import IrelandPlayers from './players/Ireland';
import ZimbabwePlayers from './players/Zimbabwe';
import NetherlandsPlayers from './players/Netherlands';
import ScotlandPlayers from './players/Scotland';
import NepalPlayers from './players/Nepal';
import UAEPlayers from './players/UAE';
import OmanPlayers from './players/Oman';
import NamibiaPlayers from './players/Namibia';
import CanadaPlayers from './players/Canada';
import KenyaPlayers from './players/Kenya';

const playerListForNation = {
  'India': IndiaPlayers,
  'Australia': AustraliaPlayers,
  'England': EnglandPlayers,
  'New Zealand': NewZealandPlayers,
  'Pakistan': PakistanPlayers,
  'South Africa': SouthAfricaPlayers,
  'West Indies': WestIndiesPlayers,
  'Sri Lanka': SriLankaPlayers,
  'Bangladesh': BangladeshPlayers,
  'Afghanistan': AfghanistanPlayers,
  'Ireland': IrelandPlayers,
  'Zimbabwe': ZimbabwePlayers,
  'Netherlands': NetherlandsPlayers,
  'Scotland': ScotlandPlayers,
  'Nepal': NepalPlayers,
  'UAE': UAEPlayers,
  'Oman': OmanPlayers,
  'Namibia': NamibiaPlayers,
  'Canada': CanadaPlayers,
  'Kenya': KenyaPlayers,
};

const getPlayersForNations = (ownTeam, opponentTeam) => ({
  ownPlayers: playerListForNation[ownTeam] || [],
  opponentPlayers: playerListForNation[opponentTeam] || [],
});

export { playerListForNation, getPlayersForNations };
