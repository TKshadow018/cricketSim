import React from "react";
import { CAREER_FORMATS, getCareerFormatStandings, sortStandings } from "../utils/controllerCareerScheduleUtils";

const resolvePlayerStatValue = (seasonValue, playerValue) => {
  if (seasonValue) {
    return seasonValue;
  }
  if (playerValue) {
    return playerValue;
  }
  return 0;
};

function useCareerAnalyticsStats({
    careerPlayerStats,
    careerDomesticCountry,
    careerDomesticTeams,
    domesticStatsFormatTab,
    domesticStatsTeamTab,
    setDomesticStatsTeamTab,
    setCareerPlayerModal,
    careerPlayerProfile,
    careerTeam,
    careerStandings,
    leagueTableFormatTab,
    selectedLeagueCountry,
    setSelectedLeagueCountry,
}) {
const normalizedCareerStats = React.useMemo(() => {
    const entries = Object.values(careerPlayerStats || {});
    const byTeamAndPlayerId = new Map();
    const byTeamAndName = new Map();

    entries.forEach((entry) => {
      const keyParts = String(entry?.key || '').split('::');
      const team = entry?.team || keyParts[0] || '';
      const playerId = keyParts[1] || '';
      const playerName = entry?.name || keyParts[2] || '';

      if (team && playerId) {
        byTeamAndPlayerId.set(`${team}::${playerId}`, entry);
      }
      if (team && playerName) {
        byTeamAndName.set(`${team}::${playerName}`, entry);
      }
    });

    return { byTeamAndPlayerId, byTeamAndName };
  }, [careerPlayerStats]);

const domesticTeamStatsByFormat = React.useMemo(() => {
    const domesticTeams = (careerDomesticTeams || []).filter(
      (team) => !careerDomesticCountry || team.country === careerDomesticCountry
    );

    return CAREER_FORMATS.reduce((acc, format) => {
      acc[format] = domesticTeams.map((team) => {
        const rows = (team.players || []).map((player) => {
          const fromId = normalizedCareerStats.byTeamAndPlayerId.get(`${team.name}::${player.id}`);
          const fromName = normalizedCareerStats.byTeamAndName.get(`${team.name}::${player.name}`);
          const entry = fromId || fromName || {};
          const formatStats = entry.formatStats?.[format] || {};
          const ballsBowled = Number(formatStats.ballsBowled || 0);
          const wickets = Number(formatStats.wickets || 0);
          const runsConceded = Number(formatStats.runsConceded || 0);
          const outs = Number(formatStats.outs || 0);
          const runs = Number(formatStats.runs || 0);
          const balls = Number(formatStats.balls || 0);
          return {
            ...player,
            runs,
            balls,
            outs,
            wickets,
            matches: Number(formatStats.matches || 0),
            ballsBowled,
            runsConceded,
            overs: `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`,
            strikeRate: balls > 0 ? ((runs * 100) / balls).toFixed(2) : '0.00',
            battingAverage: outs > 0 ? (runs / outs).toFixed(2) : 'NA',
            economy: ballsBowled > 0 ? ((runsConceded * 6) / ballsBowled).toFixed(2) : '0.00',
            bowlingAverage: wickets > 0 ? (runsConceded / wickets).toFixed(2) : 'NA',
          };
        });

        rows.sort((left, right) => right.runs - left.runs || right.wickets - left.wickets || left.name.localeCompare(right.name));
        return {
          teamName: team.name,
          rows,
        };
      });
      return acc;
    }, {});
  }, [careerDomesticCountry, careerDomesticTeams, normalizedCareerStats]);

const domesticTeamsForSelectedFormat = React.useMemo(
    () => domesticTeamStatsByFormat[domesticStatsFormatTab],
    [domesticTeamStatsByFormat, domesticStatsFormatTab]
  );

const selectedDomesticTeamStats = React.useMemo(
    () => domesticTeamsForSelectedFormat.find((entry) => entry.teamName === domesticStatsTeamTab) || null,
    [domesticTeamsForSelectedFormat, domesticStatsTeamTab]
  );

React.useEffect(() => {
    if (!domesticTeamsForSelectedFormat.length) {
      if (domesticStatsTeamTab !== '') {
        setDomesticStatsTeamTab('');
      }
      return;
    }

    const hasCurrentTeam = domesticTeamsForSelectedFormat.some((entry) => entry.teamName === domesticStatsTeamTab);
    if (!hasCurrentTeam) {
      setDomesticStatsTeamTab(domesticTeamsForSelectedFormat[0].teamName);
    }
  }, [domesticTeamsForSelectedFormat, domesticStatsTeamTab, setDomesticStatsTeamTab]);

const currentUserSeasonStats = React.useMemo(() => {
    if (!careerPlayerProfile?.name) {
      return null;
    }

    const byId = careerPlayerProfile.playerId
      ? normalizedCareerStats.byTeamAndPlayerId.get(`${careerTeam}::${careerPlayerProfile.playerId}`)
      : null;
    const byName = normalizedCareerStats.byTeamAndName.get(`${careerTeam}::${careerPlayerProfile.name}`);
    const stats = byId || byName || null;
    const ballsBowled = Number(stats?.ballsBowled || 0);

    return {
      ...careerPlayerProfile,
      runs: Number(stats?.runs || 0),
      balls: Number(stats?.balls || 0),
      wickets: Number(stats?.wickets || 0),
      matches: Number(stats?.matches || 0),
      outs: Number(stats?.outs || 0),
      overs: `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`,
      runsConceded: Number(stats?.runsConceded || 0),
    };
  }, [careerPlayerProfile, careerTeam, normalizedCareerStats]);

const buildCareerPlayerProfileData = React.useCallback((player, teamNameHint) => {
    if (!player?.name) {
      return null;
    }

    const teamName = teamNameHint || player.team || '';
    const fromId = player.id ? normalizedCareerStats.byTeamAndPlayerId.get(`${teamName}::${player.id}`) : null;
    const fromName = normalizedCareerStats.byTeamAndName.get(`${teamName}::${player.name}`);
    const stats = fromId || fromName || {};
    const teamRoster = (careerDomesticTeams || []).find((team) => team.name === teamName)?.players || [];
    const rosterPlayer = player.id
      ? teamRoster.find((entry) => String(entry.id) === String(player.id))
      : teamRoster.find((entry) => entry.name === player.name);
    const base = rosterPlayer || player;
    const ballsBowled = Number(resolvePlayerStatValue(stats.ballsBowled, player.ballsBowled));
    const runsConceded = Number(resolvePlayerStatValue(stats.runsConceded, player.runsConceded));
    const runs = Number(resolvePlayerStatValue(stats.runs, player.runs));
    const balls = Number(resolvePlayerStatValue(stats.balls, player.balls));
    const wickets = Number(resolvePlayerStatValue(stats.wickets, player.wickets));
    const matches = Number(resolvePlayerStatValue(stats.matches, player.matches));
    const outs = Number(resolvePlayerStatValue(stats.outs, player.outs));

    return {
      ...base,
      team: teamName,
      runs,
      balls,
      wickets,
      matches,
      outs,
      ballsBowled,
      overs: `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`,
      runsConceded,
      economy: ballsBowled > 0 ? ((runsConceded * 6) / ballsBowled).toFixed(2) : '0.00',
      strikeRate: balls > 0
        ? ((runs * 100) / balls).toFixed(2)
        : '0.00',
      battingAverage: outs > 0
        ? (runs / outs).toFixed(2)
        : 'NA',
      bowlingAverage: wickets > 0
        ? (runsConceded / wickets).toFixed(2)
        : 'NA',
    };
  }, [careerDomesticTeams, normalizedCareerStats]);

const openCareerPlayerProfile = React.useCallback((player, teamNameHint, title = 'Player Season Stats and Ability') => {
    const profile = buildCareerPlayerProfileData(player, teamNameHint);
    if (!profile) {
      return;
    }

    setCareerPlayerModal({
      title,
      player: profile,
    });
  }, [buildCareerPlayerProfileData, setCareerPlayerModal]);

const leagueTableStandingsForSelectedFormat = React.useMemo(
    () => getCareerFormatStandings(careerStandings || {}, leagueTableFormatTab),
    [careerStandings, leagueTableFormatTab]
  );

const leagueTableRowsForSelectedCountry = React.useMemo(() => {
    const currentRows = sortStandings(leagueTableStandingsForSelectedFormat);

    if (!selectedLeagueCountry) {
      return currentRows;
    }

    const selectedTeams = (careerDomesticTeams || []).filter((team) => team.country === selectedLeagueCountry);
    const standingsByTeam = new Map(currentRows.map((row) => [row.team, row]));

    const selectedCountryStandings = selectedTeams.reduce((acc, team) => {
      const row = standingsByTeam.get(team.name) || {};
      acc[team.name] = {
        wins: Number(row.wins || 0),
        losses: Number(row.losses || 0),
        ties: Number(row.ties || 0),
        points: Number(row.points || 0),
        played: Number(row.played || 0),
      };
      return acc;
    }, {});

    return sortStandings(selectedCountryStandings);
  }, [careerDomesticTeams, leagueTableStandingsForSelectedFormat, selectedLeagueCountry]);

const leaguePlayerStatsByFormat = React.useMemo(() => {
    const teamCountryMap = new Map();
    (careerDomesticTeams || []).forEach((team) => {
      if (team?.name) {
        teamCountryMap.set(team.name, team.country || '');
      }
    });

    const entries = Object.values(careerPlayerStats || {}).filter((entry) => entry && entry.name);
    const byFormat = CAREER_FORMATS.reduce((acc, format) => {
      const players = entries
        .filter((entry) => !selectedLeagueCountry || teamCountryMap.get(entry.team) === selectedLeagueCountry)
        .map((entry) => {
        const formatEntry = entry.formatStats?.[format];
        if (!formatEntry) {
          return {
            ...entry,
            runs: 0,
            wickets: 0,
            balls: 0,
            ballsBowled: 0,
            runsConceded: 0,
            matches: 0,
            outs: 0,
          };
        }

        return {
          ...entry,
          runs: Number(formatEntry.runs || 0),
          wickets: Number(formatEntry.wickets || 0),
          balls: Number(formatEntry.balls || 0),
          ballsBowled: Number(formatEntry.ballsBowled || 0),
          runsConceded: Number(formatEntry.runsConceded || 0),
          matches: Number(formatEntry.matches || 0),
          outs: Number(formatEntry.outs || 0),
        };
      }).filter((entry) => entry.matches > 0 || entry.runs > 0 || entry.wickets > 0);

      const topScorers = [...players]
        .sort((left, right) => right.runs - left.runs || left.balls - right.balls || left.name.localeCompare(right.name))
        .slice(0, 20);

      const topWicketTakers = [...players]
        .sort((left, right) => right.wickets - left.wickets || left.runsConceded - right.runsConceded || left.name.localeCompare(right.name))
        .slice(0, 20);

      acc[format] = { topScorers, topWicketTakers };
      return acc;
    }, {});

    return byFormat;
  }, [careerDomesticTeams, careerPlayerStats, selectedLeagueCountry]);

const availableLeagueCountries = React.useMemo(() => {
    const countrySet = new Set((careerDomesticTeams || []).map((team) => team.country).filter(Boolean));
    return [...countrySet].sort((left, right) => left.localeCompare(right));
  }, [careerDomesticTeams]);

React.useEffect(() => {
    if (!availableLeagueCountries.length) {
      if (selectedLeagueCountry !== '') {
        setSelectedLeagueCountry('');
      }
      return;
    }

    if (!selectedLeagueCountry || !availableLeagueCountries.includes(selectedLeagueCountry)) {
      const preferred = availableLeagueCountries.includes(careerDomesticCountry)
        ? careerDomesticCountry
        : availableLeagueCountries[0];
      setSelectedLeagueCountry(preferred);
    }
  }, [
    availableLeagueCountries,
    selectedLeagueCountry,
    careerDomesticCountry,
    setSelectedLeagueCountry,
  ]);

  return {
    normalizedCareerStats,
    domesticTeamStatsByFormat,
    domesticTeamsForSelectedFormat,
    selectedDomesticTeamStats,
    currentUserSeasonStats,
    buildCareerPlayerProfileData,
    openCareerPlayerProfile,
    leagueTableStandingsForSelectedFormat,
    leagueTableRowsForSelectedCountry,
    leaguePlayerStatsByFormat,
    availableLeagueCountries,
  };
}

export default useCareerAnalyticsStats;
