
jest.mock('../models', () => ({
  UserProfile: {
    findOne: jest.fn(), 
  },
}));

const guardProfile = require('../middleware/guardProfile');

describe('guardProfile Middleware', () => {
  
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  it('calls next() if the profile exists', async () => {
    const req = { user: { id: 1 } };
    const res = {};
    const next = jest.fn();

    
    const mockProfile = { id: 1, name: 'Test Profile' };
    require('../models').UserProfile.findOne.mockResolvedValue(mockProfile);

    await guardProfile(req, res, next);

    expect(require('../models').UserProfile.findOne).toHaveBeenCalledWith({ where: { UserId: 1 } });
    expect(req.profile).toEqual(mockProfile);
    expect(next).toHaveBeenCalled();
  });

  it('throws error if profile is not found', async () => {
    const req = { user: { id: 1 } };
    const res = {};
    const next = jest.fn();

    // Mock resolved value as null
    require('../models').UserProfile.findOne.mockResolvedValue(null);

    await guardProfile(req, res, next);

    expect(next).toHaveBeenCalledWith({ name: 'NotFound', message: 'Profile not found' });
  });
});
