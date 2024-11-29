const redis = require('../config/redis');
const deleteAllRedis = require('../helpers/deleteAllRedis');

// Mock the redis module
jest.mock('../config/redis', () => ({
  keys: jest.fn(),
  del: jest.fn(),
}));

describe('deleteAllRedis', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete all keys in Redis when keys are found', async () => {
    // Mock redis.keys to return some keys
    redis.keys.mockResolvedValue(['key1', 'key2']);

    await deleteAllRedis();

    // Expect redis.keys to be called
    expect(redis.keys).toHaveBeenCalledWith('*');

    // Expect redis.del to be called with the keys
    expect(redis.del).toHaveBeenCalledWith(['key1', 'key2']);
  });

  it('should not call redis.del when no keys are found', async () => {
    // Mock redis.keys to return an empty array
    redis.keys.mockResolvedValue([]);

    await deleteAllRedis();

    // Expect redis.keys to be called
    expect(redis.keys).toHaveBeenCalledWith('*');

    // Expect redis.del not to be called
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Mock redis.keys to throw an error
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    redis.keys.mockRejectedValue(new Error('Redis error'));

    await deleteAllRedis();

    // Expect the error to be logged
    expect(consoleSpy).toHaveBeenCalledWith(new Error('Redis error'));

    // Restore console.log
    consoleSpy.mockRestore();
  });
});
