jest.mock('../models', () => ({
  Goal: {
    findByPk: jest.fn(), 
  },
}));

const guardGoal = require('../middleware/guardGoal');

describe('guardGoal Middleware', () => {
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  it('calls next() if the goal exists and belongs to the user', async () => {
    const req = {
      params: { id: 1 },
      user: { id: 10 },
    };
    const res = {};
    const next = jest.fn();

    
    const mockGoal = { id: 1, UserId: 10 };
    require('../models').Goal.findByPk.mockResolvedValue(mockGoal);

    await guardGoal(req, res, next);

    expect(require('../models').Goal.findByPk).toHaveBeenCalledWith(1);
    expect(req.goal).toEqual(mockGoal);
    expect(next).toHaveBeenCalled();
  });

  it('calls next() with NotFound error if goal does not exist', async () => {
    const req = {
      params: { id: 1 },
      user: { id: 10 },
    };
    const res = {};
    const next = jest.fn();

    // Mock resolved value as null
    require('../models').Goal.findByPk.mockResolvedValue(null);

    await guardGoal(req, res, next);

    expect(require('../models').Goal.findByPk).toHaveBeenCalledWith(1);
    expect(next).toHaveBeenCalledWith({ name: 'NotFound', message: 'Goal Not Found' });
  });

  it('calls next() with Forbidden error if goal belongs to another user', async () => {
    const req = {
      params: { id: 1 },
      user: { id: 10 },
    };
    const res = {};
    const next = jest.fn();

    // Mock resolved value for findByPk
    const mockGoal = { id: 1, UserId: 20 }; // Goal belongs to another user
    require('../models').Goal.findByPk.mockResolvedValue(mockGoal);

    await guardGoal(req, res, next);

    expect(require('../models').Goal.findByPk).toHaveBeenCalledWith(1);
    expect(next).toHaveBeenCalledWith({ name: 'Forbidden', message: 'You are not authorized' });
  });

  it('calls next() with error if Goal.findByPk throws an error', async () => {
    const req = {
      params: { id: 1 },
      user: { id: 10 },
    };
    const res = {};
    const next = jest.fn();

    // Mock rejected value for findByPk
    const mockError = new Error('Database error');
    require('../models').Goal.findByPk.mockRejectedValue(mockError);

    await guardGoal(req, res, next);

    expect(require('../models').Goal.findByPk).toHaveBeenCalledWith(1);
    expect(next).toHaveBeenCalledWith(mockError);
  });
});
