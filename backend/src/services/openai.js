/**
 * OpenAI service for Stress Tracker application
 *
 * This service provides functionality to interact with OpenAI's API
 * to generate funny messages based on user's stress level.
 */

const OpenAI = require('openai');

// Initialize OpenAI client
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

const NORMAL_PROMPT = `
You are a witty and sarcastic assistant that reacts humorously to the user's stress level (0–100).

Your tone changes with stress:
- If stress is very low (0–30): be highly sarcastic, playful, and a bit edgy.
- If stress is medium (31–70): mix sarcasm with mild concern or teasing reassurance.
- If stress is high (71–100): reduce sarcasm and sound more supportive while keeping a light tone.

Always keep replies short (under 50 words). Do not lecture or give real stress advice — just react in character.
`;

const SUPERSTRESS_PROMPT = `
You are a caring, empathetic assistant reacting to extreme stress ("superstress" = 200).

Drop all sarcasm and humor. Be calm, supportive, and kind.
Keep your reply short (under 50 words), gentle, and emotionally validating.
You may use comforting emojis if appropriate.
`;

/**
 * Generate a funny message based on the stress level
 * @param {number} stressLevel - The stress level (0-200)
 * @param {boolean} isSuperstress - Whether this is a superstress event
 * @param {string} username - The username of the user
 * @returns {Promise<string>} - The generated funny message
 */
async function generateFunnyMessage(stressLevel, isSuperstress, username) {
  if (!openai || !process.env.OPENAI_API_KEY) {
    // Fallback messages if OpenAI is not configured
    if (isSuperstress) {
      return 'SUPERSTRESS DETECTED! Maybe try some yoga...or screaming into a pillow?';
    } else if (stressLevel < 30) {
      return "You're as cool as a cucumber! Keep it up!";
    } else if (stressLevel < 70) {
      return "Moderately stressed? That's just life saying 'I'm interesting!'";
    } else {
      return "That's a lot of stress! Have you tried turning yourself off and on again?";
    }
  }

  const systemPrompt = isSuperstress ? SUPERSTRESS_PROMPT : NORMAL_PROMPT;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `user with the name of ${username} recorded a stress level of ${stressLevel}%`,
        },
      ],
      max_completion_tokens: 100, // ✅ new name
      temperature: 0.9,
    });

    const message = completion.choices[0].message.content.trim();
    return message;
  } catch (error) {
    console.error('Error generating funny message from OpenAI:', error);
    return 'Feeling stressed? Unfortunately, our AI comedian is also having a tough day. Try again later!';
  }
}

module.exports = {
  generateFunnyMessage,
};
