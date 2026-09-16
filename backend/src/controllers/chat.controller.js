const chatService = require('../services/chat.service');

async function sendMessage(req, res) {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'Mensajes invalidos' });
  }

  const sanitized = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-20)
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, 2000),
    }));

  if (sanitized.length === 0 || sanitized[sanitized.length - 1].role !== 'user') {
    return res.status(400).json({ success: false, message: 'El ultimo mensaje debe ser del usuario' });
  }

  const result = await chatService.chat(sanitized, req.user?.usuario);

  return res.json({
    success: true,
    reply: result.reply,
    from: 'Fobi',
  });
}

module.exports = { sendMessage };
