const fobiLocal = require('./fobiLocal.service');
const { chatOpenAI, chatGroq } = require('./chatLlm.service');

function getProvider() {
  return (process.env.CHAT_PROVIDER || 'groq').trim().toLowerCase();
}

async function chat(messages, userName) {
  const provider = getProvider();

  switch (provider) {
    case 'openai':
      return chatOpenAI(messages, userName);
    case 'groq':
      return chatGroq(messages, userName);
    case 'local':
    default:
      return fobiLocal.chat(messages, userName);
  }
}

module.exports = { chat, getProvider };
