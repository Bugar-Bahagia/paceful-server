const { User, UserProfile } = require('../models');
const { sequelize } = require('../models');
const { queryInterface } = sequelize;

describe('UserProfile Model', () => {
  beforeAll(async () => {
   
    await queryInterface.addColumn('UserProfiles', 'avatar', {
      type: sequelize.Sequelize.STRING,
      allowNull: true,
    });
  });

  afterAll(async () => {
    
    await queryInterface.removeColumn('UserProfiles', 'avatar');
    
    await sequelize.close();
  });

  beforeEach(async () => {
    
    await UserProfile.destroy({ truncate: true, cascade: true, restartIdentity: true });
    await User.destroy({ truncate: true, cascade: true, restartIdentity: true });

    
    await User.create({ id: 1, email: 'user1@example.com', password: 'password123' });
    await User.create({ id: 2, email: 'user2@example.com', password: 'password123' });
    await User.create({ id: 3, email: 'user3@example.com', password: 'password123' });
  });

  afterEach(async () => {
 
    await queryInterface.bulkDelete('UserProfiles', null, {
      truncate: true,
      cascade: true,
      restartIdentity: true,
    });
    await queryInterface.bulkDelete('Users', null, {
      truncate: true,
      cascade: true,
      restartIdentity: true,
    });
  });

  describe('Hook beforeCreate: Avatar Generation', () => {
    it('should generate avatar URL using DiceBear when avatar is not provided', async () => {
      try {
        const testProfile = await UserProfile.create({
          UserId: 1,
          name: 'Test User',
          dateOfBirth: '2000-01-01',
        });

        
        const seed = encodeURIComponent('Test User');
        expect(testProfile.avatar).toContain(`https://api.dicebear.com/6.x/adventurer-neutral/svg?seed=${seed}`);
      } catch (error) {
        console.error('Test failed with error:', error);
        throw error;
      }
    });

    it('should not generate avatar if avatar is already provided', async () => {
      try {
        const customAvatar = 'https://custom.avatar.url/avatar.png';
        const testProfile = await UserProfile.create({
          UserId: 2,
          name: 'Another User',
          dateOfBirth: '1990-01-01',
          avatar: customAvatar,
        });

        
        expect(testProfile.avatar).toBe(customAvatar);
      } catch (error) {
        console.error('Test failed with error:', error);
        throw error;
      }
    });

    it('should generate random seed if name is not provided', async () => {
      try {
        const testProfile = await UserProfile.create({
          UserId: 3,
          name: 'Random User',
          dateOfBirth: '1995-01-01',
        });

        
        const seed = encodeURIComponent('Random User');
        expect(testProfile.avatar).toContain(`https://api.dicebear.com/6.x/adventurer-neutral/svg?seed=${seed}`);
      } catch (error) {
        console.error('Test failed with error:', error);
        throw error;
      }
    });
  });

  describe('Validation', () => {
    it('should throw error if UserId is null', async () => {
      await expect(
        UserProfile.create({
          name: 'Test User',
          dateOfBirth: '2000-01-01',
        })
      ).rejects.toThrow('UserId cannot be null');
    });

    it('should throw error if name is too short', async () => {
      await expect(
        UserProfile.create({
          UserId: 1,
          name: 'T',
          dateOfBirth: '2000-01-01',
        })
      ).rejects.toThrow('Name length must be at least 3 characters');
    });

    it('should throw error if dateOfBirth is null', async () => {
      await expect(
        UserProfile.create({
          UserId: 1,
          name: 'Valid Name',
        })
      ).rejects.toThrow('Date of birth cannot be null');
    });
  });
});
