const { GoogleGenerativeAI } = require('@google/generative-ai');
const GeminiController = require('../controllers/GeminiController');

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              candidates: [
                {
                  content: {
                    parts: [{ text: `Sample response text` }],
                  },
                },
              ],
            },
          }),
        }),
      };
    }),
  };
});

describe('GeminiController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: { genre: 'yoga' } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a generated prompt when genre is provided', async () => {
    await GeminiController.generatePrompt(req, res, next);
    expect(GoogleGenerativeAI).toHaveBeenCalledWith(process.env.GEMINI_KEY);
    expect(res.json).toHaveBeenCalledWith({ result: '1. Sample response text' });
  });

  it('should handle missing genre error', async () => {
    req.body.genre = null;
    await GeminiController.generatePrompt(req, res, next);
    expect(next).toHaveBeenCalledWith({ name: 'BadRequest', message: 'Type of activity is required' });
  });

  it('should handle errors from the generative model', async () => {
    const error = new Error('API Error');
    GoogleGenerativeAI.mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(error),
        }),
      };
    });
    await GeminiController.generatePrompt(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
