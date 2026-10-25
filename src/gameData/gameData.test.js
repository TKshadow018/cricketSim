import { clubRules } from './clubRules';
import { countries } from './countries';
import { getDomesticLocationsForCountry, domesticClubLocations } from './domesticClubLocations';
import { pitchType, outfieldType, weather } from './matchCondition';
import { matchStatusEnum } from './matchStatusEnum';
import { matchTypeList } from './matchTypeList';
import { outVoice } from './outVoice';
import { getPlayersForNations, playerListForNation } from './playerListForNation';
import { runVoice } from './runVoice';
import { getStadiumsForCountry, stadiumListForCountry } from './stadiumListForCountry';
import { stadiums } from './stadiums';
import { teamNamePrefixes, teamNamePostfixes } from './teamNameParts';
import countryCities from './countryCities';
import { battingAction, bowlingAction } from './actionType';

describe('game reference data', () => {
  test('keeps the playable nation catalog aligned with rosters, clubs, stadiums, and locations', () => {
    const nationNames = Object.keys(countries);
    expect(Object.keys(playerListForNation).sort()).toEqual([...nationNames].sort());
    expect(Object.keys(stadiumListForCountry).sort()).toEqual([...nationNames].sort());
    expect(Object.keys(clubRules).sort()).toEqual([...nationNames].sort());
    expect(Object.keys(domesticClubLocations).sort()).toEqual([...nationNames].sort());
    expect(countryCities.map(({ name }) => name).sort()).toEqual([...nationNames].sort());

    nationNames.forEach((nation) => {
      const roster = playerListForNation[nation];
      const grounds = stadiumListForCountry[nation];
      expect(roster.length).toBeGreaterThanOrEqual(11);
      expect(new Set(roster.map(({ id }) => id)).size).toBe(roster.length);
      roster.forEach((player) => {
        expect(player).toMatchObject({
          name: expect.any(String),
          abilityToPlayPaceBall: expect.any(Number),
          abilityToPlaySpinBall: expect.any(Number),
          battingAggresion: expect.any(Number),
          currentMatch: expect.any(Object),
        });
      });
      expect(grounds.length).toBeGreaterThan(0);
      grounds.forEach((ground) => {
        expect(ground).toMatchObject({
          name: expect.any(String),
          capacity: expect.any(Number),
          pitchType: expect.any(String),
          outfieldType: expect.any(String),
        });
        expect(pitchType[ground.pitchType]).toBeDefined();
        expect(outfieldType[ground.outfieldType]).toBeDefined();
      });
      expect(clubRules[nation]).toMatchObject({
        total_teams_in_tournament: expect.any(Number),
        max_foreign_players_allowed_in_team: expect.any(Number),
        max_foreign_players_in_first_eleven: expect.any(Number),
        max_player: expect.any(Number),
        min_player: expect.any(Number),
      });
      expect(getDomesticLocationsForCountry(nation)).toHaveLength(20);
    });
  });

  test('returns safe empty results for unknown team and stadium lookups', () => {
    expect(getPlayersForNations('India', 'Australia')).toMatchObject({
      ownPlayers: playerListForNation.India,
      opponentPlayers: playerListForNation.Australia,
    });
    expect(getPlayersForNations('Unknown', 'India')).toMatchObject({
      ownPlayers: [],
      opponentPlayers: playerListForNation.India,
    });
    expect(getPlayersForNations('Unknown', 'Also Unknown')).toEqual({
      ownPlayers: [],
      opponentPlayers: [],
    });
    expect(getStadiumsForCountry('Unknown')).toEqual([]);
    expect(getStadiumsForCountry('India')).toBe(stadiumListForCountry.India);
    expect(stadiums).toBe(stadiumListForCountry);

    const firstFallback = getDomesticLocationsForCountry('Unknown');
    const secondFallback = getDomesticLocationsForCountry('');
    expect(firstFallback).toHaveLength(20);
    expect(secondFallback).toEqual(firstFallback);
    expect(secondFallback).not.toBe(firstFallback);
    firstFallback.pop();
    expect(getDomesticLocationsForCountry('Unknown')).toHaveLength(20);
  });

  test('provides match options, gameplay states, and action enumerations', () => {
    expect(Object.keys(matchTypeList)).toEqual([
      'micro',
      'mini',
      't10',
      't20',
      'ODI',
      'test',
      'practiceTestMicro',
      'practiceTestMini',
    ]);
    expect(matchTypeList.test).toMatchObject({ innings: 2, day: 5 });
    expect(Object.values(matchStatusEnum)).toEqual(expect.arrayContaining([0, 11, 23]));
    expect(Object.keys(weather)).toEqual(['sunny', 'rainy', 'cloudy', 'windy', 'stormy']);
    expect(Object.values(battingAction)).toEqual([0, 1, 2, 3, 4]);
    expect(Object.values(bowlingAction)).toEqual([0, 1, 2, 3]);
  });

  test('provides complete commentary and team-name pools', () => {
    expect(runVoice).toHaveLength(6);
    expect(outVoice).toHaveLength(7);
    expect(runVoice.every((group) => group.length > 0)).toBe(true);
    expect(outVoice.every((group) => group.length > 0)).toBe(true);
    expect(teamNamePrefixes.length).toBeGreaterThan(0);
    expect(teamNamePostfixes.length).toBeGreaterThan(0);

  });
});
