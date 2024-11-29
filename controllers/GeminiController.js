const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiController {
  static async generatePrompt(req, res, next) {
    const { genre } = req.body;
    try {
      if (!genre) {
        throw { name: 'BadRequest', message: 'Type of activity is required' };
      }
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are playing the role of a sports coach. If the question is not in the context of sports, say that you can't help. You should leave a message at the end that the user should still consult a professional coach. The question: Give me the proper way to do ${genre} exercises, answer briefly, concisely, and clearly.`;
      const { response } = await model.generateContent(prompt);
      return res.json({ result: response.candidates[0].content.parts[0].text });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}

module.exports = GeminiController;
