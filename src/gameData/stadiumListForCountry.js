import AfghanistanStadiums from './stadiums/Afghanistan';
import AustraliaStadiums from './stadiums/Australia';
import BangladeshStadiums from './stadiums/Bangladesh';
import CanadaStadiums from './stadiums/Canada';
import EnglandStadiums from './stadiums/England';
import IndiaStadiums from './stadiums/India';
import IrelandStadiums from './stadiums/Ireland';
import KenyaStadiums from './stadiums/Kenya';
import NamibiaStadiums from './stadiums/Namibia';
import NepalStadiums from './stadiums/Nepal';
import NetherlandsStadiums from './stadiums/Netherlands';
import NewZealandStadiums from './stadiums/NewZealand';
import OmanStadiums from './stadiums/Oman';
import PakistanStadiums from './stadiums/Pakistan';
import ScotlandStadiums from './stadiums/Scotland';
import SouthAfricaStadiums from './stadiums/SouthAfrica';
import SriLankaStadiums from './stadiums/SriLanka';
import UAEStadiums from './stadiums/UAE';
import ZimbabweStadiums from './stadiums/Zimbabwe';
import WestIndiesStadiums from './stadiums/WestIndies';

const stadiumListForCountry = {
  'Afghanistan': AfghanistanStadiums,
  'Australia': AustraliaStadiums,
  'Bangladesh': BangladeshStadiums,
  'Canada': CanadaStadiums,
  'England': EnglandStadiums,
  'India': IndiaStadiums,
  'Ireland': IrelandStadiums,
  'Kenya': KenyaStadiums,
  'Namibia': NamibiaStadiums,
  'Nepal': NepalStadiums,
  'Netherlands': NetherlandsStadiums,
  'New Zealand': NewZealandStadiums,
  'Oman': OmanStadiums,
  'Pakistan': PakistanStadiums,
  'Scotland': ScotlandStadiums,
  'South Africa': SouthAfricaStadiums,
  'Sri Lanka': SriLankaStadiums,
  'UAE': UAEStadiums,
  'Zimbabwe': ZimbabweStadiums,
  'West Indies': WestIndiesStadiums,
};

const getStadiumsForCountry = (country) => stadiumListForCountry[country] || [];

export { stadiumListForCountry, getStadiumsForCountry };
