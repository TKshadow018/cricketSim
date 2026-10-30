import { domesticTeams, makeFlow, resetCareerFlowMocks } from './controllerCareerTestSupport';

describe('Career Mode player skills', () => {
  beforeEach(resetCareerFlowMocks);
  afterEach(() => jest.restoreAllMocks());

  test('includes no more than two skills in the created player profile', () => {
    const run = makeFlow();
    run.flow.beginCareer({
      playerProfile: { name: 'Career Player', playerType: 'batsman' },
      domesticCountry: 'Country A',
      domesticTeams,
    });

    const profileAction = run.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerPlayerProfileAction');

    expect(profileAction.payload.skills).toEqual(expect.any(Array));
    expect(profileAction.payload.skills.length).toBeLessThanOrEqual(2);
  });
});
