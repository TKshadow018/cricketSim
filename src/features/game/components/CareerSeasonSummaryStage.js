import React from 'react';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';
import {
  CAREER_FORMATS,
  formatCareerMatchLabel,
  getCareerFormatStandings,
  sortStandings,
  applyEndOfSeasonPlayerAbilityUpdates,
} from '../utils/controllerCareerScheduleUtils';
import { buildSeasonProgressionNotes } from '../utils/controllerCareerPlayerUtils';
import PlayerNameWithType from './PlayerNameWithType';
import TeamNameWithLogo from './TeamNameWithLogo';

const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString('en-US')}`;

const buildSeasonPlayerIndex = ({ careerDomesticTeams, careerPlayerStats, careerPlayerProfile, currentAge }) => {
  const rosterByTeamAndId = new Map();
  const rosterByTeamAndName = new Map();

  (careerDomesticTeams || []).forEach((team) => {
    (team.players || []).forEach((player) => {
      if (player?.id !== undefined && player?.id !== null) {
        rosterByTeamAndId.set(`${team.name}::${String(player.id)}`, player);
      }
      if (player?.name) {
        rosterByTeamAndName.set(`${team.name}::${player.name}`, player);
      }
    });
  });

  return Object.values(careerPlayerStats || {})
    .filter((entry) => entry && entry.name && entry.team)
    .map((entry) => {
      const rosterPlayer =
        (entry.playerId !== undefined && entry.playerId !== null
          ? rosterByTeamAndId.get(`${entry.team}::${String(entry.playerId)}`)
          : null) ||
        rosterByTeamAndName.get(`${entry.team}::${entry.name}`) ||
        null;

      const battingAverage = Number(entry.outs || 0) > 0 ? Number(entry.runs || 0) / Number(entry.outs || 1) : Number(entry.runs || 0);
      const strikeRate = Number(entry.balls || 0) > 0 ? (Number(entry.runs || 0) * 100) / Number(entry.balls || 1) : 0;
      const bowlingAverage = Number(entry.wickets || 0) > 0 ? Number(entry.runsConceded || 0) / Number(entry.wickets || 1) : 999;
      const economy = Number(entry.ballsBowled || 0) > 0 ? (Number(entry.runsConceded || 0) * 6) / Number(entry.ballsBowled || 1) : 99;
      const resolvedAge =
        careerPlayerProfile?.playerId !== undefined &&
        careerPlayerProfile?.playerId !== null &&
        String(entry.playerId) === String(careerPlayerProfile.playerId)
          ? currentAge
          : Number(rosterPlayer?.age || 25);

      return {
        ...entry,
        player: rosterPlayer || {
          id: entry.playerId,
          name: entry.name,
          playerType: entry.playerType,
          isWicketKeeper: entry.isWicketKeeper,
        },
        battingAverage,
        strikeRate,
        bowlingAverage,
        economy,
        age: resolvedAge,
      };
    });
};

const buildMomAwardsMap = (careerSchedule = []) => {
  const counts = new Map();

  (careerSchedule || []).forEach((fixture) => {
    if (!fixture?.isComplete) {
      return;
    }

    const awarded = fixture.result?.momAward || fixture.result?.momShortlist?.[0] || null;
    if (!awarded?.team || !awarded?.name) {
      return;
    }

    const key = `${awarded.team}::${awarded.playerId ?? ''}::${awarded.name}`;
    counts.set(key, {
      key,
      team: awarded.team,
      playerId: awarded.playerId,
      name: awarded.name,
      count: Number(counts.get(key)?.count || 0) + 1,
    });
  });

  return counts;
};

const resolveSeasonAwards = (players = [], momAwardsMap = new Map()) => {
  const withMomCounts = players.map((entry) => {
    const momKey = `${entry.team}::${entry.playerId ?? ''}::${entry.name}`;
    const momAwards = Number(momAwardsMap.get(momKey)?.count || 0);
    const allRoundScore =
      Number(entry.runs || 0) * 1.25 +
      Number(entry.wickets || 0) * 28 +
      Number(entry.matches || 0) * 2 +
      momAwards * 22;

    return {
      ...entry,
      momAwards,
      allRoundScore,
    };
  });

  const bestBatsman = [...withMomCounts].sort(
    (left, right) =>
      Number(right.runs || 0) - Number(left.runs || 0) ||
      right.battingAverage - left.battingAverage ||
      right.strikeRate - left.strikeRate ||
      String(left.name || '').localeCompare(String(right.name || ''))
  )[0] || null;

  const bestBowler = [...withMomCounts].sort(
    (left, right) =>
      Number(right.wickets || 0) - Number(left.wickets || 0) ||
      left.bowlingAverage - right.bowlingAverage ||
      left.economy - right.economy ||
      String(left.name || '').localeCompare(String(right.name || ''))
  )[0] || null;

  const youngPlayer = [...withMomCounts]
    .filter((entry) => Number(entry.age || 99) < 23)
    .sort(
      (left, right) =>
        right.allRoundScore - left.allRoundScore ||
        Number(right.runs || 0) - Number(left.runs || 0) ||
        Number(right.wickets || 0) - Number(left.wickets || 0)
    )[0] || null;

  const playerOfYear = [...withMomCounts].sort(
    (left, right) =>
      right.allRoundScore - left.allRoundScore ||
      Number(right.runs || 0) - Number(left.runs || 0) ||
      Number(right.wickets || 0) - Number(left.wickets || 0)
  )[0] || null;

  const mostMom = [...withMomCounts].sort(
    (left, right) => right.momAwards - left.momAwards || right.allRoundScore - left.allRoundScore
  )[0] || null;

  return [
    {
      id: 'best-batsman',
      title: 'Best Batsman',
      winner: bestBatsman,
      summary: bestBatsman ? `${bestBatsman.runs} runs (avg ${bestBatsman.battingAverage.toFixed(2)})` : 'No winner',
    },
    {
      id: 'best-bowler',
      title: 'Best Bowler',
      winner: bestBowler,
      summary: bestBowler ? `${bestBowler.wickets} wickets (avg ${bestBowler.bowlingAverage.toFixed(2)})` : 'No winner',
    },
    {
      id: 'young-player',
      title: 'Young Player of the Year (U23)',
      winner: youngPlayer,
      summary: youngPlayer
        ? `${youngPlayer.runs} runs, ${youngPlayer.wickets} wickets, age ${youngPlayer.age}`
        : 'No eligible under-23 player',
    },
    {
      id: 'player-of-year',
      title: 'Player of the Year',
      winner: playerOfYear,
      summary: playerOfYear ? `Impact score ${Math.round(playerOfYear.allRoundScore)}` : 'No winner',
    },
    {
      id: 'most-mom',
      title: 'Most Man of the Match Awards',
      winner: mostMom,
      summary: mostMom ? `${mostMom.momAwards} awards` : 'No MOM awards recorded',
    },
  ];
};

function CareerSeasonSummaryStage({
  stageCommonProps,
  careerTeam,
  careerSeason,
  careerSchedule,
  careerStandings,
  careerPlayerStats,
  careerTopRunScorers,
  careerTopWicketTakers,
  careerPlayerProfile,
  careerDomesticCountry,
  careerDomesticTeams,
  careerOffers,
  careerRetired,
  handleStartNextCareerSeason,
  handleEndCareer,
  handleRetireCareer,
}) {
  const standingsByFormat = CAREER_FORMATS.map((format) => ({
    format,
    rows: sortStandings(getCareerFormatStandings(careerStandings || {}, format)),
  }));
  const t20Standings = standingsByFormat.find((entry) => entry.format === 't20')?.rows || [];
  const topTeam = t20Standings[0];
  const userStanding = t20Standings.find((row) => row.team === careerTeam);
  const progressionNotes = buildSeasonProgressionNotes(careerPlayerStats);
  const userWon = standingsByFormat.some((entry) => entry.rows[0]?.team === careerTeam);
  const currentAge = (careerPlayerProfile?.age || 18) + Math.max((careerSeason || 1) - 1, 0);
  const canRetire = currentAge >= 30 && !careerRetired;
  const [showSeasonReport, setShowSeasonReport] = React.useState(false);

  const normalizedOffers = React.useMemo(() => {
    const offers = Array.isArray(careerOffers) ? [...careerOffers] : [];
    if (!offers.some((offer) => offer?.team === careerTeam)) {
      offers.unshift({
        team: careerTeam,
        amount: Number(careerPlayerProfile?.currentValue || 0),
        amountLabel: formatMoney(careerPlayerProfile?.currentValue || 0),
        valuation: Number(careerPlayerProfile?.currentValue || 0),
        valuationLabel: formatMoney(careerPlayerProfile?.currentValue || 0),
        isCurrentTeam: true,
        offerType: 'stay',
      });
    }

    const uniqueByTeam = new Map();
    offers.forEach((offer) => {
      if (offer?.team && !uniqueByTeam.has(offer.team)) {
        uniqueByTeam.set(offer.team, {
          ...offer,
          amountLabel: offer.amountLabel || formatMoney(offer.amount),
          valuationLabel: offer.valuationLabel || formatMoney(offer.valuation || offer.amount),
        });
      }
    });

    return Array.from(uniqueByTeam.values());
  }, [careerOffers, careerPlayerProfile?.currentValue, careerTeam]);

  const [selectedOfferTeam, setSelectedOfferTeam] = React.useState(careerTeam);

  React.useEffect(() => {
    if (!normalizedOffers.length) {
      setSelectedOfferTeam(careerTeam);
      return;
    }

    const hasSelected = normalizedOffers.some((offer) => offer.team === selectedOfferTeam);
    if (hasSelected) {
      return;
    }

    const preferred = normalizedOffers.find((offer) => offer.team === careerTeam) || normalizedOffers[0];
    setSelectedOfferTeam(preferred.team);
  }, [careerTeam, normalizedOffers, selectedOfferTeam]);

  const seasonAwards = React.useMemo(() => {
    const indexed = buildSeasonPlayerIndex({
      careerDomesticTeams,
      careerPlayerStats,
      careerPlayerProfile,
      currentAge,
    });
    const momMap = buildMomAwardsMap(careerSchedule);
    return resolveSeasonAwards(indexed, momMap);
  }, [careerDomesticTeams, careerPlayerProfile, careerPlayerStats, careerSchedule, currentAge]);

  const abilityChangePreview = React.useMemo(() => {
    const previewTeams = applyEndOfSeasonPlayerAbilityUpdates({
      domesticTeams: careerDomesticTeams,
      careerPlayerStats,
      currentAge,
      careerTeam,
      careerPlayerProfile,
    });

    const currentByTeamAndId = new Map();
    (careerDomesticTeams || []).forEach((team) => {
      (team.players || []).forEach((player) => {
        currentByTeamAndId.set(`${team.name}::${player.id}`, player);
      });
    });

    const changes = [];
    previewTeams.forEach((team) => {
      (team.players || []).forEach((player) => {
        const previous = currentByTeamAndId.get(`${team.name}::${player.id}`);
        if (!previous) {
          return;
        }

        const before = {
          abilityToPlayPaceBall: Number(previous.abilityToPlayPaceBall || 0),
          abilityToPlaySpinBall: Number(previous.abilityToPlaySpinBall || 0),
          battingAggresion: Number(previous.battingAggresion || 0),
          paceAbility: Number(previous.paceAbility || 0),
          spinAbility: Number(previous.spinAbility || 0),
        };
        const after = {
          abilityToPlayPaceBall: Number(player.abilityToPlayPaceBall || 0),
          abilityToPlaySpinBall: Number(player.abilityToPlaySpinBall || 0),
          battingAggresion: Number(player.battingAggresion || 0),
          paceAbility: Number(player.paceAbility || 0),
          spinAbility: Number(player.spinAbility || 0),
        };
        const delta =
          (after.abilityToPlayPaceBall - before.abilityToPlayPaceBall) +
          (after.abilityToPlaySpinBall - before.abilityToPlaySpinBall) +
          (after.battingAggresion - before.battingAggresion) +
          (after.paceAbility - before.paceAbility) +
          (after.spinAbility - before.spinAbility);

        if (delta !== 0) {
          changes.push({
            team: team.name,
            player: previous,
            before,
            after,
            delta,
          });
        }
      });
    });

    return changes.sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta) || left.player.name.localeCompare(right.player.name));
  }, [careerDomesticTeams, careerPlayerProfile, careerPlayerStats, careerTeam, currentAge]);

  return (
    <StageShell
      {...stageCommonProps}
      title={`Season ${careerSeason} Complete`}
      subtitle={
        userWon
          ? `🏆 ${careerTeam} topped at least one format table.`
          : `Season finished${topTeam?.team ? ` - ${topTeam.team} leads T20 table.` : '.'}`
      }
    >
      <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title"><PlayerNameWithType player={careerPlayerProfile} name={careerPlayerProfile?.name || 'Created Player'} /> Career Status</h4>
        <p>Age: {currentAge} • Nationality: {careerPlayerProfile?.nationality || 'N/A'}</p>
        <p>Domestic League: {careerDomesticCountry || 'N/A'} • Clubs: {(careerDomesticTeams || []).length}</p>
        <p>Estimated Value: {formatMoney(careerPlayerProfile?.currentValue || 0)}</p>
        {careerRetired ? <p>🏁 Career ended by retirement.</p> : null}
      </div>

      <div className="sim-scoreboard-panel">
        <h4 className="sim-section-title">Season Awards</h4>
        {seasonAwards.map((award) => (
          <p key={award.id}>
            <strong>{award.title}:</strong>{' '}
            {award.winner ? (
              <>
                <PlayerNameWithType player={award.winner.player} name={award.winner.name} /> ({award.winner.team}) - {award.summary}
              </>
            ) : (
              award.summary
            )}
          </p>
        ))}
      </div>

      <div className="sim-scoreboard-panel">
        <h4 className="sim-section-title">Transfer Market</h4>
        <p>Choose to stay with your current club or accept another domestic offer for next season.</p>
        <div style={{ display: 'grid', gap: '8px' }}>
          {normalizedOffers.map((offer) => (
            <button
              key={`career-offer-${offer.team}`}
              type="button"
              className={`sim-career-format-tab ${selectedOfferTeam === offer.team ? 'active' : ''}`}
              style={{
                textAlign: 'left',
                border: selectedOfferTeam === offer.team ? '1px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.2)',
                padding: '10px 12px',
              }}
              onClick={() => setSelectedOfferTeam(offer.team)}
            >
              <strong>{offer.isCurrentTeam ? `Stay at ${offer.team}` : `${offer.team} Offer`}</strong>
              <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
                Contract: {offer.amountLabel} • Valuation: {offer.valuationLabel}
              </div>
            </button>
          ))}
        </div>
      </div>

      {standingsByFormat.map((entry) => {
        if (!entry.rows.length) {
          return null;
        }

        return (
          <div key={`summary-${entry.format}`} className="sim-scoreboard-panel">
            <h4 className="sim-section-title">{formatCareerMatchLabel(entry.format)} Standings</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Team</th>
                  <th style={{ textAlign: 'center', padding: '4px' }}>P</th>
                  <th style={{ textAlign: 'center', padding: '4px' }}>W</th>
                  <th style={{ textAlign: 'center', padding: '4px' }}>L</th>
                  <th style={{ textAlign: 'center', padding: '4px' }}>T</th>
                  <th style={{ textAlign: 'center', padding: '4px', fontWeight: 'bold' }}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {entry.rows.map((row, i) => (
                  <tr
                    key={`${entry.format}-${row.team}`}
                    style={{ background: row.team === careerTeam ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                  >
                    <td style={{ padding: '4px 8px' }}>{i + 1}</td>
                    <td style={{ padding: '4px 8px' }}><TeamNameWithLogo teamName={row.team} size={18} /></td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{row.played}</td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{row.wins}</td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{row.losses}</td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{row.ties}</td>
                    <td style={{ textAlign: 'center', padding: '4px', fontWeight: 'bold' }}>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="sim-scoreboard-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <h4 className="sim-section-title" style={{ margin: 0 }}>End Season Report</h4>
          <AppButton
            text={showSeasonReport ? 'Hide Season Report' : 'End Season'}
            onClick={() => setShowSeasonReport((previous) => !previous)}
            variant="secondary"
            fullWidth={false}
          />
        </div>
        {showSeasonReport ? (
          <div className="sim-career-stats-scroll" style={{ marginTop: '12px' }}>
            <p>
              This report highlights the season’s leading performers and previews ability changes that will be applied at
              season rollover.
            </p>
            {abilityChangePreview.length > 0 ? (
              <div className="sim-scoreboard-panel">
                <h4 className="sim-section-title">Ability Change Preview</h4>
                <table className="sim-scoreboard-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Pace Bat</th>
                      <th>Spin Bat</th>
                      <th>Agg</th>
                      <th>Pace Bowl</th>
                      <th>Spin Bowl</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abilityChangePreview.slice(0, 20).map((row) => (
                      <tr key={`ability-${row.team}-${row.player.id}`}>
                        <td><PlayerNameWithType player={row.player} /></td>
                        <td><TeamNameWithLogo teamName={row.team} size={18} /></td>
                        <td>{row.before.abilityToPlayPaceBall} → {row.after.abilityToPlayPaceBall}</td>
                        <td>{row.before.abilityToPlaySpinBall} → {row.after.abilityToPlaySpinBall}</td>
                        <td>{row.before.battingAggresion} → {row.after.battingAggresion}</td>
                        <td>{row.before.paceAbility} → {row.after.paceAbility}</td>
                        <td>{row.before.spinAbility} → {row.after.spinAbility}</td>
                        <td><strong>{row.delta >= 0 ? `+${row.delta}` : row.delta}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No ability changes calculated for this season.</p>
            )}

            {careerTopRunScorers?.length > 0 ? (
              <div className="sim-scoreboard-panel">
                <h4 className="sim-section-title">Top 10 Run Scorers</h4>
                {careerTopRunScorers.slice(0, 10).map((entry, index) => (
                  <p key={`season-top-run-${entry.key}`}><strong>#{index + 1} <PlayerNameWithType player={entry} /></strong> ({entry.team}) — {entry.runs} runs</p>
                ))}
              </div>
            ) : null}

            {careerTopWicketTakers?.length > 0 ? (
              <div className="sim-scoreboard-panel">
                <h4 className="sim-section-title">Top 10 Wicket Takers</h4>
                {careerTopWicketTakers.slice(0, 10).map((entry, index) => (
                  <p key={`season-top-wicket-${entry.key}`}><strong>#{index + 1} <PlayerNameWithType player={entry} /></strong> ({entry.team}) — {entry.wickets} wickets</p>
                ))}
              </div>
            ) : null}

            {progressionNotes.length > 0 ? (
              <div className="sim-scoreboard-panel">
                <h4 className="sim-section-title">Highlighted Performances</h4>
                {progressionNotes.slice(0, 12).map((note, index) => (
                  <p key={`season-note-${index}`}><strong><PlayerNameWithType player={note} name={note.player} /></strong> ({note.team}) — {note.note}</p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {userStanding && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">{careerTeam} Season Record</h4>
          <p>{userStanding.wins}W / {userStanding.losses}L / {userStanding.ties}T — {userStanding.points} points</p>
        </div>
      )}

      {careerTopRunScorers?.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">Top Run Scorers</h4>
          {careerTopRunScorers.slice(0, 5).map((entry) => (
            <p key={entry.key}><PlayerNameWithType player={entry} /> ({entry.team}) — {entry.runs} runs (avg {entry.battingAverage})</p>
          ))}
        </div>
      )}

      {careerTopWicketTakers?.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">Top Wicket Takers</h4>
          {careerTopWicketTakers.slice(0, 5).map((entry) => (
            <p key={entry.key}><PlayerNameWithType player={entry} /> ({entry.team}) — {entry.wickets} wkts (avg {entry.bowlingAverage})</p>
          ))}
        </div>
      )}

      {progressionNotes.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">Season Highlights</h4>
          {progressionNotes.slice(0, 8).map((note, i) => (
            <p key={i}><strong><PlayerNameWithType player={note} name={note.player} /></strong> ({note.team}): {note.note}</p>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <AppButton
          text={selectedOfferTeam === careerTeam ? 'Start Next Season (Stay)' : `Accept ${selectedOfferTeam} Offer & Start`}
          onClick={() => handleStartNextCareerSeason({ selectedTeam: selectedOfferTeam })}
          fullWidth
          disabled={careerRetired}
        />
        {canRetire ? (
          <AppButton text="Retire Now" onClick={handleRetireCareer} variant="secondary" fullWidth={false} />
        ) : (
          <AppButton text="End Career View" onClick={handleEndCareer} variant="secondary" fullWidth={false} />
        )}
      </div>
    </StageShell>
  );
}

export default CareerSeasonSummaryStage;
