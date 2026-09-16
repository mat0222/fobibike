const OpenAI = require('openai');
const { TOOLS, executeTool, buildSystemPrompt } = require('./chat.shared');
const { prefetchInventoryContext, isGenericDenial, getUserText } = require('./chatPrefetch.service');

async function formatPrefetchedReply(client, model, userQuestion, prefetchBlock) {
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'Sos Fobi de FOBI Bike. Formatea los datos del inventario en espanol rioplatense, claro y con precios ARS. No digas que no tenes acceso: los datos ya estan consultados.',
      },
      {
        role: 'user',
        content: `Pregunta del usuario: ${userQuestion}\n\nDatos actuales:\n${prefetchBlock}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.2,
  });

  return response.choices[0].message.content;
}

async function runChatWithTools(client, model, conversation, prefetchBlock, userQuestion) {
  let response = await client.chat.completions.create({
    model,
    messages: conversation,
    tools: TOOLS,
    tool_choice: 'auto',
    max_tokens: 800,
    temperature: 0.2,
  });
  let assistantMessage = response.choices[0].message;
  let iterations = 0;
  const maxIterations = 8;

  while (assistantMessage.tool_calls?.length && iterations < maxIterations) {
    iterations += 1;
    conversation.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(toolCall.function.arguments || '{}');
      } catch {
        args = {};
      }

      const result = await executeTool(toolCall.function.name, args);

      conversation.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    response = await client.chat.completions.create({
      model,
      messages: conversation,
      tools: TOOLS,
      tool_choice: 'auto',
      max_tokens: 800,
      temperature: 0.2,
    });

    assistantMessage = response.choices[0].message;
  }

  if (assistantMessage.content && prefetchBlock && isGenericDenial(assistantMessage.content)) {
    assistantMessage.content = await formatPrefetchedReply(
      client,
      model,
      userQuestion,
      prefetchBlock
    );
  }

  if (!assistantMessage.content) {
    const err = new Error('Fobi no pudo generar una respuesta. Intenta de nuevo.');
    err.status = 500;
    err.expose = true;
    throw err;
  }

  return {
    reply: assistantMessage.content,
    model,
  };
}

async function chatWithClient({ client, model, messages, userName }) {
  const prefetchBlock = await prefetchInventoryContext(messages);
  let systemContent = buildSystemPrompt(userName);
  if (prefetchBlock) {
    systemContent += prefetchBlock;
  }

  const conversation = [
    { role: 'system', content: systemContent },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  return runChatWithTools(
    client,
    model,
    conversation,
    prefetchBlock,
    getUserText(messages)
  );
}
function mapProviderError(error, providerLabel) {
  if (error?.status === 401) {
    const err = new Error(`API key de ${providerLabel} invalida. Verifica tu configuracion en backend/.env`);
    err.status = 503;
    err.expose = true;
    throw err;
  }
  if (error?.code === 'insufficient_quota') {
    const err = new Error(`${providerLabel} sin credito disponible. Usa Groq gratis (CHAT_PROVIDER=groq) en backend/.env`);
    err.status = 503;
    err.expose = true;
    throw err;
  }
  if (error?.status === 429) {
    const err = new Error(`Limite de ${providerLabel} alcanzado. Espera un momento e intenta de nuevo.`);
    err.status = 503;
    err.expose = true;
    throw err;
  }
  throw error;
}

async function chatOpenAI(messages, userName) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error('OpenAI no configurado. Agrega OPENAI_API_KEY en backend/.env o usa CHAT_PROVIDER=groq (gratis)');
    err.status = 503;
    err.expose = true;
    throw err;
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    return await chatWithClient({ client, model, messages, userName });
  } catch (error) {
    mapProviderError(error, 'OpenAI');
  }
}

async function chatGroq(messages, userName) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error('Groq no configurado. Creá una API key gratis en https://console.groq.com/keys y agregala como GROQ_API_KEY en backend/.env');
    err.status = 503;
    err.expose = true;
    throw err;
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  try {
    return await chatWithClient({ client, model, messages, userName });
  } catch (error) {
    mapProviderError(error, 'Groq');
  }
}

module.exports = { chatOpenAI, chatGroq };
