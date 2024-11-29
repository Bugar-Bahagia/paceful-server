const calculateCurrentValue = require('../helpers/calculateCurrentValue');
const { Goal, Activity } = require('../models/');
const redis = require('../config/redis');
const GoalController = require('../controllers/GoalController');

jest.mock('../helpers/calculateCurrentValue');
jest.mock('../models/', () => ({
  Goal: {
    findAll: jest.fn(),
    create: jest.fn(),
  },
  Activity: {
    findAll: jest.fn(),
  },
}));
jest.mock('../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

describe('GoalController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      body: { typeName: 'steps', targetValue: 10000, startDate: '2024-01-01', endDate: '2024-12-31' },
      goal: {
        id: 1,
        UserId: 1,
        typeName: 'steps',
        targetValue: 10000,
        currentValue: 0,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        save: jest.fn(),
        destroy: jest.fn(),
      },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return goals from Redis if available', async () => {
      redis.get.mockResolvedValue(JSON.stringify([{ id: 1, typeName: 'steps' }]));
      await GoalController.findAll(req, res, next);
      expect(redis.get).toHaveBeenCalledWith('goals:1');
      expect(res.json).toHaveBeenCalledWith([{ id: 1, typeName: 'steps' }]);
    });

    it('should fetch goals from the database if not in Redis', async () => {
      redis.get.mockResolvedValue(null);
      Goal.findAll.mockResolvedValue([{ id: 1, typeName: 'steps' }]);
      await GoalController.findAll(req, res, next);
      expect(Goal.findAll).toHaveBeenCalledWith({ where: { UserId: 1 }, order: [['updatedAt', 'DESC']] });
      expect(redis.set).toHaveBeenCalledWith('goals:1', JSON.stringify([{ id: 1, typeName: 'steps' }]));
      expect(res.json).toHaveBeenCalledWith([{ id: 1, typeName: 'steps' }]);
    });
  });

  describe('findAchieved', () => {
    it('should return achieved goals', async () => {
      Goal.findAll.mockResolvedValue([{ id: 1, typeName: 'steps', isAchieved: true }]);
      await GoalController.findAchieved(req, res, next);
      expect(Goal.findAll).toHaveBeenCalledWith({ where: { UserId: 1, isAchieved: true } });
      expect(res.json).toHaveBeenCalledWith([{ id: 1, typeName: 'steps', isAchieved: true }]);
    });
  });

  describe('findByPk', () => {
    it('should return the goal', async () => {
      await GoalController.findByPk(req, res, next);
      expect(res.json).toHaveBeenCalledWith(req.goal);
    });
  });

  describe('destroy', () => {
    it('should delete the goal and update Redis', async () => {
      await GoalController.destroy(req, res, next);
      expect(req.goal.destroy).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith('goals:1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Goal deleted successfully' });
    });

    it('should call next with error on failure', async () => {
      req.goal.destroy.mockRejectedValue(new Error('Error deleting goal'));
      await GoalController.destroy(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('Error deleting goal'));
    });
  });

  describe('update', () => {
    it('should update the goal and current value', async () => {
      calculateCurrentValue.mockResolvedValue(5000);
      req.body = { targetValue: 10000, startDate: '2024-01-01', endDate: '2024-12-31' };
      await GoalController.update(req, res, next);
      expect(req.goal.save).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith('goals:1');
      expect(res.json).toHaveBeenCalledWith(req.goal);
    });

    it('should call next with error on failure', async () => {
      req.goal.save.mockRejectedValue(new Error('Error updating goal'));
      await GoalController.update(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('Error updating goal'));
    });
  });

  describe('create', () => {
    it('should create a new goal and update Redis', async () => {
      Activity.findAll.mockResolvedValue([{ typeName: 'running', distance: 1000 }]);
      Goal.create.mockResolvedValue(req.goal);
      await GoalController.create(req, res, next);
      expect(Goal.create).toHaveBeenCalledWith({
        UserId: 1,
        typeName: 'steps',
        targetValue: 10000,
        currentValue: expect.any(Number),
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        isAchieved: expect.any(Boolean),
      });
      expect(redis.del).toHaveBeenCalledWith('goals:1');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(req.goal);
    });

    it('should call next with error on failure', async () => {
      Goal.create.mockRejectedValue(new Error('Error creating goal'));
      await GoalController.create(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('Error creating goal'));
    });
  });
});
