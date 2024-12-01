const calculateCalories = require('../helpers/calculateCalories');
const { Activity, Goal, sequelize } = require('../models/');
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
  setex: jest.fn(),
  keys: jest.fn(),
}));

describe('ActivityController', () => {
  let req, res, next, transaction;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      body: { typeName: 'running', duration: 30, distance: 5, notes: 'Morning run', activityDate: '2024-01-01' },
      activity: {
        id: 1,
        UserId: 1,
        typeName: 'running',
        duration: 30,
        distance: 5,
        caloriesBurned: 100,
        activityDate: '2024-01-01',
        save: jest.fn(),
        destroy: jest.fn(),
      },
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
    beforeEach(() => {
      req.query = { page: '1', limit: '5' };
    });
    it('should return activities from Redis if available', async () => {
      const cachedActivities = JSON.stringify([{ id: 1, typeName: 'running' }]);
      redis.get.mockResolvedValue(cachedActivities);
      await ActivityController.findAll(req, res, next);
      expect(redis.get).toHaveBeenCalledWith('activities:1:page:1:limit:5');
      expect(res.json).toHaveBeenCalledWith(JSON.parse(cachedActivities));
    });

    it('should fetch activities from the database if not in Redis', async () => {
      redis.get.mockResolvedValue(null);
      Activity.findAll.mockResolvedValue([{ id: 1, typeName: 'running' }]);
      await ActivityController.findAll(req, res, next);
      expect(Activity.findAll).toHaveBeenCalledWith({ where: { UserId: 1 }, limit: 5, offset: 0, order: [['updatedAt', 'DESC']] });
      expect(redis.set).toHaveBeenCalledWith('activities:1:page:1:limit:5', JSON.stringify([{ id: 1, typeName: 'running' }]));
      expect(res.json).toHaveBeenCalledWith([{ id: 1, typeName: 'running' }]);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      Activity.findAll.mockRejectedValue(error);
      await ActivityController.findAll(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('findByPk', () => {
    it('should return the activity', async () => {
      await ActivityController.findByPk(req, res, next);
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });
  });

  describe('create', () => {
    it('should create a new activity and update related goals for steps', async () => {
      calculateCalories.mockReturnValue(100);
      req.body.typeName = 'running';
      Activity.create.mockResolvedValue(req.activity);
      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 0, typeName: 'steps', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.create(req, res, next);
      expect(Activity.create).toHaveBeenCalledWith({ UserId: 1, typeName: 'running', duration: 30, distance: 5, notes: 'Morning run', activityDate: '2024-01-01', caloriesBurned: 100 }, { transaction });
      expect(Goal.update).toHaveBeenCalledWith({ currentValue: Math.round(5 * 1.3123), isAchieved: false, updatedAt: expect.any(Date) }, { where: { id: 1 }, transaction });
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });

    it('should create a new activity and update related goals for distance', async () => {
      req.body.typeName = 'distance';
      calculateCalories.mockReturnValue(100);
      Activity.create.mockResolvedValue(req.activity);
      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 0, typeName: 'distance', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.create(req, res, next);
      expect(Activity.create).toHaveBeenCalledWith({ UserId: 1, typeName: 'distance', duration: 30, distance: 5, notes: 'Morning run', activityDate: '2024-01-01', caloriesBurned: 100 }, { transaction });
      expect(Goal.update).toHaveBeenCalledWith({ currentValue: 5, isAchieved: false, updatedAt: expect.any(Date) }, { where: { id: 1 }, transaction });
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });

    it('should create a new activity and update related goals for calories burned', async () => {
      req.body.typeName = 'calories burned';
      calculateCalories.mockReturnValue(100);
      Activity.create.mockResolvedValue(req.activity);
      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 0, typeName: 'calories burned', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.create(req, res, next);
      expect(Activity.create).toHaveBeenCalledWith({ UserId: 1, typeName: 'calories burned', duration: 30, distance: 5, notes: 'Morning run', activityDate: '2024-01-01', caloriesBurned: 100 }, { transaction });
      expect(Goal.update).toHaveBeenCalledWith({ currentValue: 100, isAchieved: false, updatedAt: expect.any(Date) }, { where: { id: 1 }, transaction });
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });

    it('should create a new activity and update related goals for duration (default case)', async () => {
      req.body.typeName = 'duration';
      calculateCalories.mockReturnValue(100);
      Activity.create.mockResolvedValue(req.activity);
      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 0, typeName: 'duration', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.create(req, res, next);
      expect(Activity.create).toHaveBeenCalledWith({ UserId: 1, typeName: 'duration', duration: 30, distance: 5, notes: 'Morning run', activityDate: '2024-01-01', caloriesBurned: 100 }, { transaction });
      expect(Goal.update).toHaveBeenCalledWith({ currentValue: 30, isAchieved: false, updatedAt: expect.any(Date) }, { where: { id: 1 }, transaction });
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
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
    it('should update an activity and related goals for steps', async () => {
      req.activity.typeName = 'running';
      req.activity.distance = 5; // Old distance
      req.body.distance = 7; // New distance
      calculateCalories.mockReturnValue(100); // New calories burned
      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 0, typeName: 'steps', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.update(req, res, next);

      expect(req.activity.save).toHaveBeenCalledWith({ transaction });
      expect(Goal.update).toHaveBeenCalledWith(
        {
          currentValue: Math.round(0 - Math.round(5 * 1.3123) + Math.round(7 * 1.3123)),
          isAchieved: false,
          updatedAt: expect.any(Date),
        },
        { where: { id: 1 }, transaction }
      );
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });

    it('should update an activity and related goals for distance', async () => {
      req.activity.typeName = 'running';
      req.activity.distance = 5; // Old distance
      req.body.distance = 10; // New distance
      calculateCalories.mockReturnValue(100); // New calories burned
      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 0, typeName: 'distance', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.update(req, res, next);

      expect(req.activity.save).toHaveBeenCalledWith({ transaction });
      expect(Goal.update).toHaveBeenCalledWith(
        {
          currentValue: 0 - 5 + 10,
          isAchieved: false,
          updatedAt: expect.any(Date),
        },
        { where: { id: 1 }, transaction }
      );
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });

    it('should update an activity and related goals for calories burned', async () => {
      req.activity.typeName = 'running';
      req.activity.caloriesBurned = 20; // Old calories burned
      req.body.duration = 30; // New duration
      calculateCalories.mockReturnValue(100); // New calories burned
      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 0, typeName: 'calories burned', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.update(req, res, next);

      expect(req.activity.save).toHaveBeenCalledWith({ transaction });
      expect(Goal.update).toHaveBeenCalledWith(
        {
          currentValue: 0 - 20 + 100,
          isAchieved: false,
          updatedAt: expect.any(Date),
        },
        { where: { id: 1 }, transaction }
      );
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });

    it('should update an activity and related goals for duration (default case)', async () => {
      req.activity.typeName = 'other';
      req.activity.duration = 30; // Old duration
      req.body.duration = 60; // New duration
      calculateCalories.mockReturnValue(100); // New calories burned
      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 0, typeName: 'duration', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.update(req, res, next);

      expect(req.activity.save).toHaveBeenCalledWith({ transaction });
      expect(Goal.update).toHaveBeenCalledWith(
        {
          currentValue: 0 - 30 + 60,
          isAchieved: false,
          updatedAt: expect.any(Date),
        },
        { where: { id: 1 }, transaction }
      );
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.json).toHaveBeenCalledWith(req.activity);
    });

    it('should rollback the transaction on error', async () => {
      calculateCalories.mockReturnValue(120);
      req.activity.save.mockRejectedValue(new Error('Error updating activity'));

      await ActivityController.update(req, res, next);

      expect(transaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(new Error('Error updating activity'));
    });

    it('should handle no changes gracefully', async () => {
      req.body = {}; // Simulating no changes
      await ActivityController.update(req, res, next);
      expect(req.activity.save).toHaveBeenCalledWith({ transaction });
      expect(transaction.commit).toHaveBeenCalled();
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

  describe('destroy', () => {
    it('should delete an activity and update related goals for steps', async () => {
      req.activity.typeName = 'running';
      req.activity.distance = 5; // Old distance

      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 100, typeName: 'steps', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.destroy(req, res, next);

      expect(req.activity.destroy).toHaveBeenCalledWith({ transanction: transaction });
      expect(Goal.update).toHaveBeenCalledWith(
        {
          currentValue: Math.max(0, 100 - Math.round(5 * 1.3123)),
          isAchieved: false,
          updatedAt: expect.any(Date),
        },
        { where: { id: 1 }, transaction }
      );
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity deleted successfully' });
    });

    it('should delete an activity and update related goals for distance', async () => {
      req.activity.typeName = 'running';
      req.activity.distance = 5; // Old distance

      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 100, typeName: 'distance', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.destroy(req, res, next);

      expect(req.activity.destroy).toHaveBeenCalledWith({ transanction: transaction });
      expect(Goal.update).toHaveBeenCalledWith(
        {
          currentValue: Math.max(0, 100 - 5),
          isAchieved: false,
          updatedAt: expect.any(Date),
        },
        { where: { id: 1 }, transaction }
      );
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity deleted successfully' });
    });

    it('should delete an activity and update related goals for calories burned', async () => {
      req.activity.typeName = 'running';
      req.activity.caloriesBurned = 100; // Old calories burned

      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 100, typeName: 'calories burned', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.destroy(req, res, next);

      expect(req.activity.destroy).toHaveBeenCalledWith({ transanction: transaction });
      expect(Goal.update).toHaveBeenCalledWith(
        {
          currentValue: Math.max(0, 100 - 100),
          isAchieved: false,
          updatedAt: expect.any(Date),
        },
        { where: { id: 1 }, transaction }
      );
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity deleted successfully' });
    });

    it('should delete an activity and update related goals for duration (default case)', async () => {
      req.activity.typeName = 'other';
      req.activity.duration = 30; // Old duration

      Goal.findAll.mockResolvedValue([{ id: 1, currentValue: 100, typeName: 'duration', targetValue: 10000 }]);
      redis.keys.mockResolvedValue(['activities:1:page:1', 'activities:1:page:2']);
      await ActivityController.destroy(req, res, next);

      expect(req.activity.destroy).toHaveBeenCalledWith({ transanction: transaction });
      expect(Goal.update).toHaveBeenCalledWith(
        {
          currentValue: Math.max(0, 100 - 30),
          isAchieved: false,
          updatedAt: expect.any(Date),
        },
        { where: { id: 1 }, transaction }
      );
      expect(transaction.commit).toHaveBeenCalled();
      expect(redis.keys).toHaveBeenCalledWith('activities:1:page:*');
      expect(redis.del).toHaveBeenCalledWith(['activities:1:page:1', 'activities:1:page:2']);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity deleted successfully' });
    });

    it('should rollback the transaction on error', async () => {
      const error = new Error('Error deleting activity');
      req.activity.destroy.mockRejectedValue(error);

      await ActivityController.destroy(req, res, next);

      expect(transaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should rollback the transaction on error', async () => {
      req.activity.destroy.mockRejectedValue(new Error('Error deleting activity'));

      await ActivityController.destroy(req, res, next);

      expect(transaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(new Error('Error deleting activity'));
    });
  });
});
