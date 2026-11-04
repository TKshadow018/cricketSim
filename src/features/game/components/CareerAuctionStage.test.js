import React, { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CareerAuctionStage from './CareerAuctionStage';

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick, disabled }) => <button onClick={onClick} disabled={disabled}>{text}</button>,
}));

jest.mock('./StageShell', () => ({
  __esModule: true,
  default: ({ title, subtitle, children }) => <section><h2>{title}</h2><div>{subtitle}</div>{children}</section>,
}));

const makeProps = (overrides = {}) => ({
  stageCommonProps: {},
  careerSeason: 2,
  careerPlayerProfile: { name: 'Career Player', playerType: 'batsman' },
  careerDomesticCountry: 'India',
  careerTeam: 'Falcons',
  careerAuctionSummary: {
    totalPlayersAuctioned: 3,
    teamCount: 2,
    playerPoolComposition: { domesticRatio: 0.8, foreignRatio: 0.2 },
    teamRules: {
      equalBudget: 1000000,
      domesticPerTeam: [1, 3],
      foreignPerTeam: [0, 2],
      minimumRoleLimits: { wicketkeepers: 1, bowlingProfiles: 1, battingProfiles: 1 },
    },
    careerPlayerEvent: { amountLabel: '$300,000' },
    marqueeBids: [
      { playerId: 'm1', playerName: 'Marquee Player', winnerTeam: 'Falcons', playerCountry: 'India', role: 'Batsman', abilityScore: 340, amountLabel: '$500,000' },
    ],
    budgetTable: [
      {
        team: 'Falcons',
        country: 'India',
        budgetStart: 1000000,
        signings: 2,
        spent: 300000,
        domesticPlayers: 1,
        foreignPlayers: 1,
        roleCounts: { wicketkeepers: 1, bowling: 1, batting: 1 },
        budgetLeft: 700000,
        budgetLeftLabel: '$700,000',
        spentLabel: '$300,000',
      },
      {
        team: 'Ravens',
        country: 'England',
        budgetStart: 1000000,
        signings: 1,
        spent: 100000,
        domesticPlayers: 0,
        foreignPlayers: 1,
        roleCounts: { wicketkeepers: 0, bowling: 1, batting: 0 },
        budgetLeft: 900000,
        budgetLeftLabel: '$900,000',
        spentLabel: '$100,000',
      },
    ],
    auctionTimeline: [
      {
        index: 1,
        playerId: 'p1',
        playerName: 'First Nominee',
        playerCountry: 'India',
        abilityScore: 300,
        basePriceLabel: '$50,000',
        isSold: true,
        winnerTeam: 'Falcons',
        amount: 100000,
        amountLabel: '$100,000',
        bids: [
          { team: 'Falcons', amount: 100000 },
          { team: 'Ravens', amount: 90000 },
        ],
        isWicketkeeperProfile: true,
        isBowlingProfile: true,
        isBattingProfile: true,
      },
      {
        index: 2,
        playerId: 'p2',
        playerName: 'Overseas Nominee',
        playerCountry: 'Bangladesh',
        abilityScore: 260,
        basePriceLabel: '$40,000',
        isSold: true,
        winnerTeam: 'Ravens',
        amount: 75000,
        amountLabel: '$75,000',
        bids: [],
      },
      {
        index: 3,
        playerId: 'career',
        playerName: 'Career Player',
        playerCountry: 'India',
        abilityScore: 320,
        basePriceLabel: '$150,000',
        isCareerPlayer: true,
        isSold: false,
        winnerTeam: '',
        amount: 0,
        amountLabel: '',
        bids: [
          { team: 'Falcons', amount: 200000 },
          { team: 'Ravens', amount: 250000 },
        ],
      },
      {
        index: 4,
        playerId: 'p3',
        playerName: 'Final Nominee',
        playerCountry: 'England',
        abilityScore: 280,
        basePriceLabel: '$80,000',
        isSold: true,
        winnerTeam: 'Ravens',
        amount: 400000,
        amountLabel: '$400,000',
        bids: [],
        isWicketkeeperProfile: false,
        isBowlingProfile: false,
        isBattingProfile: true,
      },
    ],
  },
  handleCareerContinueAfterAuction: jest.fn(),
  ...overrides,
});

describe('CareerAuctionStage', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders auction rules, live budget quotas, bids, and manual timeline navigation', () => {
    jest.useFakeTimers();
    const props = makeProps();
    render(<CareerAuctionStage {...props} />);
    expect(screen.getByRole('heading', { name: 'Season 2 Auction' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Live auction room' })).toBeInTheDocument();
    expect(screen.getByText('Auctioneer')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Bidding teams' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Falcons bid board, lowered' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Live auction floor' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Live Auction Feed/ })).not.toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Auction speed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Purchase history' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Purchased players' })).not.toBeInTheDocument();
    expect(screen.getByText('Player pool: 80% domestic, 20% foreign')).toBeInTheDocument();
    expect(screen.getByText(/Team size: 1-3 domestic, 0-2 foreign/)).toBeInTheDocument();
    expect(screen.getByText('Live Quota Summary')).toBeInTheDocument();
    expect(screen.getByText(/Clubs passing all roster rules right now/)).toBeInTheDocument();
    expect(document.body.textContent).toContain('First Nominee');
    expect(screen.getByText('SOLD')).toBeInTheDocument();
    expect(screen.getByText('Team Momentum')).toBeInTheDocument();
    expect(screen.getByLabelText('Auction ticker')).toBeInTheDocument();
    expect(screen.queryByText('Marquee Bids')).not.toBeInTheDocument();
    expect(screen.queryByText(/Marquee Player/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(900);
    });
    expect(screen.getByText('Nomination 2: Overseas Nominee')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Nomination 3: Career Player')).toBeInTheDocument();
    expect(screen.getAllByText(/Career Player is nominated, but no club closes the deal/)).toHaveLength(2);
    expect(screen.getByText('Spotlight: Your Auction Moment')).toBeInTheDocument();
    expect(screen.getByText('Live Bidding')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume Auto Play' })).toBeEnabled();
    act(() => {
      jest.advanceTimersByTime(340);
    });
    expect(screen.getByRole('img', { name: 'Falcons bid board, raised' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ravens bid board, raised' })).toBeInTheDocument();
    expect(screen.getByText('$200,000')).toBeInTheDocument();
    expect(screen.getByText('$250,000')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume Auto Play' }));
    expect(screen.getByRole('button', { name: 'Pause Auto Play' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Pause Auto Play' }));
    expect(screen.getByRole('button', { name: 'Resume Auto Play' })).toBeEnabled();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '1200' } });
    expect(screen.getByText('Speed: 1200 ms')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Nomination 4: Final Nominee')).toBeInTheDocument();
    expect(screen.getByText('SOLD')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText('Nomination 3: Career Player')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Jump to Final' }));
    expect(screen.getByText('Nomination 4: Final Nominee')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume Auto Play' })).toBeDisabled();
    expect(screen.getByText('Continue to Season Schedule')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Season Schedule' }));
    expect(props.handleCareerContinueAfterAuction).toHaveBeenCalled();
  });

  test('opens bought players in a team-filterable modal', () => {
    render(<CareerAuctionStage {...makeProps()} />);

    expect(screen.queryByRole('table', { name: 'Purchased players' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Purchase history' }));

    expect(screen.getByRole('dialog', { name: 'Purchased players' })).toBeInTheDocument();
    const teamFilter = screen.getByLabelText('Filter by team');
    expect(screen.getByRole('row', { name: /First Nominee.*Falcons/ })).toBeInTheDocument();

    fireEvent.change(teamFilter, { target: { value: 'Ravens' } });
    expect(screen.getByText('No purchases by Ravens yet.')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /First Nominee.*Falcons/ })).not.toBeInTheDocument();

    fireEvent.change(teamFilter, { target: { value: 'Falcons' } });
    expect(screen.getByRole('row', { name: /First Nominee.*Falcons/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close auction history' }));
    expect(screen.queryByRole('dialog', { name: 'Purchased players' })).not.toBeInTheDocument();
  });

  test('supports empty timelines, default rules, and unsold auction phases', () => {
    const props = makeProps({
      careerSeason: 0,
      careerPlayerProfile: null,
      careerDomesticCountry: '',
      careerTeam: '',
      careerAuctionSummary: null,
    });
    const { rerender } = render(<CareerAuctionStage {...props} />);
    expect(screen.getByRole('heading', { name: 'Season 1 Auction' })).toBeInTheDocument();
    expect(screen.getByText('Auction loading')).toBeInTheDocument();
    expect(screen.getByText('Preparing auction timeline...')).toBeInTheDocument();

    rerender(<CareerAuctionStage {...props} careerAuctionSummary={{
      auctionTimeline: [],
      marqueeBids: [{
        playerId: 'marquee-only',
        playerName: 'Marquee Player',
        winnerTeam: 'Falcons',
        playerCountry: 'India',
        amountLabel: '$500,000',
        isSold: true,
      }],
    }} />);
    expect(screen.getByRole('button', { name: 'Purchase history' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.queryByText('Marquee Player')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Purchase history' }));
    expect(screen.getByText('Marquee Player', { selector: '.sim-auction-history-player' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close auction history' }));

    rerender(<CareerAuctionStage {...props} careerAuctionSummary={{
      auctionTimeline: [
        { index: 1, playerId: 'u1', playerName: 'Unsold Player', basePriceLabel: '$10,000', isSold: false, bids: [] },
        { index: 2, playerId: 'u2', playerName: 'One Bid Player', basePriceLabel: '$20,000', isSold: false, bids: [{ team: 'Falcons', amount: 20000 }] },
        { index: 3, playerId: 'u3', playerName: 'Multi Bid Player', basePriceLabel: '$30,000', isSold: false, bids: [{ team: 'Falcons', amount: 30000 }, { team: 'Ravens', amount: 35000 }] },
      ],
    }} />);
    expect(screen.getByText('Going Once')).toBeInTheDocument();
    expect(screen.getByText('Unsold Player goes unsold at base $10,000.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Going Twice')).toBeInTheDocument();
    expect(screen.getByText(/One bid in. Going once for One Bid Player/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Live Bidding')).toBeInTheDocument();
    expect(screen.getByText(/2 clubs in the race for Multi Bid Player/)).toBeInTheDocument();
  });

  test('renders sparse final auction data and falls back for zero-valued metadata', () => {
    jest.useFakeTimers();
    const props = makeProps({
      careerSeason: 0,
      careerPlayerProfile: null,
      careerDomesticCountry: '',
      careerTeam: '',
      careerAuctionSummary: {
        totalPlayersAuctioned: 1,
        teamCount: 0,
        playerPoolComposition: { domesticRatio: 0, foreignRatio: 0 },
        teamRules: {
          equalBudget: 0,
          domesticPerTeam: [0, 0],
          foreignPerTeam: [0, 0],
          minimumRoleLimits: null,
        },
        careerPlayerEvent: {},
        budgetTable: [
          {
            team: 'Falcons',
            country: 'India',
            domesticPlayers: 15,
            foreignPlayers: 5,
            roleCounts: { wicketkeepers: 2, bowling: 10, batting: 12 },
          },
          {
            team: 'Ravens',
            country: 'England',
            domesticPlayers: 21,
            foreignPlayers: 9,
            roleCounts: { wicketkeepers: 0, bowling: 0, batting: 0 },
          },
          { team: 'Hawks', country: 'New Zealand' },
        ],
        auctionTimeline: [
          {
            index: 1,
            playerId: 'unsold',
            playerName: '',
            isSold: false,
            bids: [],
          },
          {
            index: 2,
            playerId: 'sold',
            playerName: 'Low Bid',
            isSold: true,
            winnerTeam: 'Falcons',
            playerCountry: '',
            amount: 0,
            bids: [{ team: 'Falcons', amount: 0 }],
          },
          {
            index: 3,
            playerId: 'career',
            playerName: 'Career Player',
            isCareerPlayer: true,
            isSold: true,
            winnerTeam: 'Falcons',
            amountLabel: '$1',
            bids: [],
          },
        ],
      },
    });
    render(<CareerAuctionStage {...props} />);

    expect(screen.getByRole('heading', { name: 'Season 1 Auction' })).toBeInTheDocument();
    expect(screen.getByText('Player pool: 85% domestic, 15% foreign')).toBeInTheDocument();
    expect(screen.getByText(/Team size: 0-0 domestic, 0-0 foreign/)).toBeInTheDocument();
    expect(screen.getByText('Minimum roles: 2 wicketkeepers, 10 bowling profile, 12 batting profile')).toBeInTheDocument();
    expect(screen.getByText('1 players auctioned across 0 clubs.')).toBeInTheDocument();
    expect(screen.queryByText('Marquee Bids')).not.toBeInTheDocument();
    expect(document.body.textContent).toContain('Auctioneer:  at base undefined. Any bidder?');
    expect(screen.getByText(/Player goes unsold at base -/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider'), { target: { value: '250' } });
    expect(screen.getByText('Speed: 250 ms')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    act(() => {
      jest.advanceTimersByTime(170);
    });
    expect(screen.getAllByText('$0').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Jump to Final' }));
    expect(screen.getByText('SOLD')).toBeInTheDocument();
    expect(screen.getAllByText(/Career Player enters the room/)).toHaveLength(2);
    expect(screen.getByText('Spotlight: Your Auction Moment')).toBeInTheDocument();
    expect(screen.getAllByText('-')).not.toHaveLength(0);

    const fallbackQuota = render(<CareerAuctionStage {...makeProps({
      careerAuctionSummary: {
        teamRules: { domesticPerTeam: [-1, -1], foreignPerTeam: [-1, -1] },
        budgetTable: [{ team: 'Owls' }],
        auctionTimeline: [{ index: 1, playerId: 'single', playerName: 'Single', isSold: false, bids: [] }],
      },
    })} />);
    expect(fallbackQuota.container.textContent).toContain('Clubs passing all roster rules right now');
  });
});
