import React from "react";
import AppButton from "../../../components/ui/AppButton";
import CareerPlayerProfileModal from "./CareerPlayerProfileModal";
import CareerAnalyticsModals from "./CareerAnalyticsModals";
import useCareerAnalyticsStats from "../hooks/useCareerAnalyticsStats";
import useCareerPlayerSearch from "../hooks/useCareerPlayerSearch";

function CareerAnalyticsDashboard({
  isCareerMode,
  careerTeam,
  careerDomesticCountry,
  careerDomesticTeams,
  careerPlayerStats,
  careerPlayerProfile,
  careerStandings,
  careerGlobalPlayerPool,
}) {
const [showDomesticStats, setShowDomesticStats] = React.useState(false);
const [careerPlayerModal, setCareerPlayerModal] = React.useState(null);
const [domesticStatsFormatTab, setDomesticStatsFormatTab] = React.useState('t20');
const [domesticStatsTeamTab, setDomesticStatsTeamTab] = React.useState('');
const [showLeagueTable, setShowLeagueTable] = React.useState(false);
const [showLeaguePlayerStats, setShowLeaguePlayerStats] = React.useState(false);
const [leagueTableFormatTab, setLeagueTableFormatTab] = React.useState('t20');
const [leaguePlayerFormatTab, setLeaguePlayerFormatTab] = React.useState('t20');
const [selectedLeagueCountry, setSelectedLeagueCountry] = React.useState('');
const [showGlobalPlayerSearch, setShowGlobalPlayerSearch] = React.useState(false);
const [searchName, setSearchName] = React.useState('');
const [searchPlayerType, setSearchPlayerType] = React.useState('');
const [searchCountry, setSearchCountry] = React.useState('');
const [batVsPaceRange, setBatVsPaceRange] = React.useState('');
const [batVsSpinRange, setBatVsSpinRange] = React.useState('');
const [paceAbilityRange, setPaceAbilityRange] = React.useState('');
const [spinAbilityRange, setSpinAbilityRange] = React.useState('');
const [aggressionRange, setAggressionRange] = React.useState('');
const [matchesRange, setMatchesRange] = React.useState('');
const [runsRange, setRunsRange] = React.useState('');
const [runsPerMatchRange, setRunsPerMatchRange] = React.useState('');
const [wicketsRange, setWicketsRange] = React.useState('');
const [globalSearchPage, setGlobalSearchPage] = React.useState(1);

  const statsAnalytics = useCareerAnalyticsStats({
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
  });
  const searchAnalytics = useCareerPlayerSearch({
    careerGlobalPlayerPool: careerGlobalPlayerPool,
    normalizedCareerStats: statsAnalytics.normalizedCareerStats,
    showGlobalPlayerSearch: showGlobalPlayerSearch,
    searchName: searchName,
    searchPlayerType: searchPlayerType,
    searchCountry: searchCountry,
    batVsPaceRange: batVsPaceRange,
    batVsSpinRange: batVsSpinRange,
    paceAbilityRange: paceAbilityRange,
    spinAbilityRange: spinAbilityRange,
    aggressionRange: aggressionRange,
    matchesRange: matchesRange,
    runsRange: runsRange,
    runsPerMatchRange: runsPerMatchRange,
    wicketsRange: wicketsRange,
    globalSearchPage: globalSearchPage,
    setGlobalSearchPage: setGlobalSearchPage,
  });
  const analytics = { ...statsAnalytics, ...searchAnalytics };
  const { currentUserSeasonStats, openCareerPlayerProfile } = analytics;
  const analyticsState = {
    showDomesticStats,
    setShowDomesticStats,
    careerPlayerModal,
    setCareerPlayerModal,
    domesticStatsFormatTab,
    setDomesticStatsFormatTab,
    domesticStatsTeamTab,
    setDomesticStatsTeamTab,
    showLeagueTable,
    setShowLeagueTable,
    showLeaguePlayerStats,
    setShowLeaguePlayerStats,
    leagueTableFormatTab,
    setLeagueTableFormatTab,
    leaguePlayerFormatTab,
    setLeaguePlayerFormatTab,
    selectedLeagueCountry,
    setSelectedLeagueCountry,
    showGlobalPlayerSearch,
    setShowGlobalPlayerSearch,
    searchName,
    setSearchName,
    searchPlayerType,
    setSearchPlayerType,
    searchCountry,
    setSearchCountry,
    batVsPaceRange,
    setBatVsPaceRange,
    batVsSpinRange,
    setBatVsSpinRange,
    paceAbilityRange,
    setPaceAbilityRange,
    spinAbilityRange,
    setSpinAbilityRange,
    aggressionRange,
    setAggressionRange,
    matchesRange,
    setMatchesRange,
    runsRange,
    setRunsRange,
    runsPerMatchRange,
    setRunsPerMatchRange,
    wicketsRange,
    setWicketsRange,
    globalSearchPage,
    setGlobalSearchPage,
  };

  return (
    <>
{isCareerMode ? (
        <div className="sim-career-tools">
          <AppButton
            text="Domestic Teams Season Stats"
            onClick={() => setShowDomesticStats(true)}
            fullWidth={false}
            variant="secondary"
          />
          <AppButton
            text="My Current Stats/Ability"
            onClick={() => openCareerPlayerProfile(currentUserSeasonStats, careerTeam, 'My Current Season Stats and Ability')}
            fullWidth={false}
            variant="secondary"
            disabled={!currentUserSeasonStats}
          />
          <AppButton
            text="See League Table"
            onClick={() => setShowLeagueTable(true)}
            fullWidth={false}
            variant="secondary"
          />
          <AppButton
            text="See League Player Statistics"
            onClick={() => setShowLeaguePlayerStats(true)}
            fullWidth={false}
            variant="secondary"
          />
          <AppButton
            text="Search Players Worldwide"
            onClick={() => setShowGlobalPlayerSearch(true)}
            fullWidth={false}
            variant="secondary"
          />
        </div>
      ) : null}
      <CareerAnalyticsModals analytics={analytics} state={analyticsState} />
<CareerPlayerProfileModal
        isOpen={!!careerPlayerModal?.player}
        title={careerPlayerModal?.title || 'Player Season Stats and Ability'}
        player={careerPlayerModal?.player || null}
        onClose={() => setCareerPlayerModal(null)}
      />
    </>
  );
}

export default CareerAnalyticsDashboard;
