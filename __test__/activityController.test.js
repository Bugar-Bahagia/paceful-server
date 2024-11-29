const calculateCalories = require('../helpers/calculateCalories');
const { Activity, Goal, sequelize } = require('../models');
const redis = require('../config/redis');
const ActivityController = require('../controllers/ActivityController');

jest.mock('../helpers/calculateCalories');
jest.mock('../models/', () => ({
  Activity: {
    findAll: jest.fn(),
    create: jest.fn(),
  },
  Goal: {
    findAll: jest.fn(),
    update: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));
jest.mock('../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

describe('ActivityController', () => {
  let req, res, next, transaction;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      body: { typeName: 'running', duration: 30, distance: 5, notes: 'Morning run', activityDate: '2024-01-01' },
      activity: { id: 1, UserId: 1, typeName: 'running', duration: 30, distance: 5, caloriesBurned: 100, activityDate: '2024-01-01', save: jest.fn(), destroy: jest.fn },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    transaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return activities from Redis if available', async () => {
      redis.get.mockResolvedValue(JSON.stringify([{ id: 1, typeName: 'running' }]));
      await ActivityController.findAll(req, res, next);
      expect(redis.get).toHaveBeenCalledWith('activities:1');
      expect(res.json).toHaveBeenCalledWith([{ id: 1, typeName: 'running' }]);
    });

    it('should fetch activities from the database if not in Redis', async () => {
      redis.get.mockResolvedValue(null);
      Activity.findAll.mockResolvedValue([{ id: 1, typeName: 'running' }]);
      await ActivityController.findAll(req, res, next);
      expect(Activity.findAll).toHaveBeenCalledWith({ where: { UserId: 1 }, order: [['updatedAt', 'DESC']] });
      expect(redis.set).toHaveBeenCalledWith('activities:1', JSON.stringify([{ id: 1, typeName: 'running' }]));
      expect(res.json).toHaveBeenCalledWith([{ id: 1, typeName: 'running' }]);
    });
  });

  describe('findByPk', () => {
    it('should return the activity', async () => {
      await ActivityController.findByPk(req, res, next);
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });
  });

  describe('create', () => {
    it('should create a new activity and update related goals', async () => {
      calculateCalories.mockReturnValue(100);
      Activity.create.mockResolvedValue(req.activity);
      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 0, typeName: 'steps', targetValue: 10000 }]);
      await ActivityController.create(req, res, next);
      expect(Activity.create).toHaveBeenCalledWith({ UserId: 1, typeName: 'running', duration: 30, distance: 5, notes: 'Morning run', activityDate: '2024-01-01', caloriesBurned: 100 }, { transaction });
      expect(Goal.update).toHaveBeenCalledWith({ currentValue: 7, isAchieved: false, updatedAt: expect.any(Date) }, { where: { id: 1 }, transaction });
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith('activities:1');
      expect(redis.del).toHaveBeenCalledWith('goals:1');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });

    it('should rollback the transaction on error', async () => {
      calculateCalories.mockReturnValue(100);
      Activity.create.mockRejectedValue(new Error('Error creating activity'));
      await ActivityController.create(req, res, next);
      expect(transaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(new Error('Error creating activity'));
    });
  });

  describe('update', () => {
    it('should update an activity and related goals', async () => {
      calculateCalories.mockReturnValue(120);
      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 0, typeName: 'steps', targetValue: 10000 }]);
      await ActivityController.update(req, res, next);
      expect(req.activity.save).toHaveBeenCalledWith({ transaction });
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith('goals:1');
      expect(redis.del).toHaveBeenCalledWith('activities:1');
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });
    it('should rollback the transaction on error', async () => {
      calculateCalories.mockReturnValue(120);
      req.activity.save.mockRejectedValue(new Error('Error updating activity'));
      await ActivityController.update(req, res, next);
      expect(transaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(new Error('Error updating activity'));
    });
  });
});
