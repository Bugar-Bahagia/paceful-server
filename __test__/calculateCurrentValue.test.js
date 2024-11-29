const calculateCurrentValue = require('../helpers/calculateCurrentValue');
const { Activity } = require('../models/');

// Mock the Activity model
jest.mock('../models/', () => ({
  Activity: {
    findAll: jest.fn(),
  },
}));

describe('calculateCurrentValue', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    Activity.findAll.mockClear();
  });

  it('should calculate current value for steps goal', async () => {
    const goal = {
      UserId: 1,
      typeName: 'steps',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    const activities = [
      { typeName: 'running', distance: 1000 }, // 1312 steps
      { typeName: 'walking', distance: 500 }, // 656 steps
      { typeName: 'hiking', distance: 2000 }, // 2624 steps
    ];

    Activity.findAll.mockResolvedValue(activities);

    const result = await calculateCurrentValue(goal);
    expect(result).toBe(1312 + 656 + 2625); // 4592
  });

  it('should calculate current value for distance goal', async () => {
    const goal = {
      UserId: 1,
      typeName: 'distance',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    const activities = [{ distance: 1000 }, { distance: 500 }, { distance: 2000 }];

    Activity.findAll.mockResolvedValue(activities);

    const result = await calculateCurrentValue(goal);
    expect(result).toBe(1000 + 500 + 2000); // 3500
  });

  it('should calculate current value for calories burned goal', async () => {
    const goal = {
      UserId: 1,
      typeName: 'calories burned',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    const activities = [{ caloriesBurned: 100 }, { caloriesBurned: 200 }, { caloriesBurned: 300 }];

    Activity.findAll.mockResolvedValue(activities);

    const result = await calculateCurrentValue(goal);
    expect(result).toBe(100 + 200 + 300); // 600
  });

  it('should calculate current value for default case (duration)', async () => {
    const goal = {
      UserId: 1,
      typeName: 'duration',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    const activities = [{ duration: 60 }, { duration: 120 }, { duration: 30 }];

    Activity.findAll.mockResolvedValue(activities);

    const result = await calculateCurrentValue(goal);
    expect(result).toBe(60 + 120 + 30); // 210
  });
});
