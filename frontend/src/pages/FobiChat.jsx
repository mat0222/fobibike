import { useEffect, useRef, useState } from 'react';
import { FiSend, FiRefreshCw } from 'react-icons/fi';
import { MdPedalBike } from 'react-icons/md';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { HiddenDataPanel } from '../components/DemoBanner';
import { api } from '../api/client';
import { IS_DEMO } from '../config/demo';

const SUGGESTIONS = [
  '¿Que productos tienen stock bajo?',
  '¿Cuanto vendimos este mes?',
  'Buscar cascos en accesorios',
  'Actualiza el stock del producto X a 10 unidades',
];

const WELCOME = {
  role: 'assistant',
  content:
    'Hola, soy **Fobi**, tu asistente con inteligencia artificial para FOBI Bike. Puedo consultar inventario, registrar ventas, crear o editar productos y analizar ingresos. ¿En que te ayudo hoy?',
};

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
}

export default function FobiChat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError('');
    const userMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const payload = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map(({ role, content }) => ({ role, content }));

      const data = await api.sendChatMessage(payload);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message || 'Fobi no pudo responder');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const resetChat = () => {
    setMessages([WELCOME]);
    setError('');
  };

  const sidebar = (
    <div className="p-4 space-y-4">
      <div className="bg-white/10 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center shadow-lg">
            <MdPedalBike className="text-white text-xl" />
          </div>
          <div>
            <p className="font-semibold text-white">Fobi</p>
            <p className="text-slate-500 text-xs">Asistente IA</p>
          </div>
        </div>
        <p className="text-slate-500 text-xs leading-relaxed">
          {IS_DEMO
            ? 'El chat no está conectado en la demo. Recorré Facturación para ver el módulo comercial completo.'
            : 'Consultá inventario, ventas, facturación e ingresos con IA.'}
        </p>
      </div>

      {!IS_DEMO && (
        <>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2 px-1">
              Sugerencias
            </p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={resetChat}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-500 hover:text-white transition-colors"
          >
            <FiRefreshCw size={14} />
            Nueva conversacion
          </button>
        </>
      )}
    </div>
  );

  if (IS_DEMO) {
    return (
      <Layout sidebar={sidebar}>
        <div className="max-w-4xl mx-auto space-y-4">
          <PageHeader
            eyebrow="Asistente"
            title="Chat con Fobi"
            description="Vista previa — el chat con datos reales no se exhibe en la demo."
          />
          <HiddenDataPanel section="el chat con IA y consultas al inventario real" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout sidebar={sidebar}>
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
        <div className="mb-4">
          <PageHeader
            eyebrow="Asistente"
            title="Chat con Fobi"
            description="Consultá inventario, ventas, facturación e ingresos desde un solo lugar."
          />
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1e40af] flex items-center justify-center shrink-0 shadow-md">
                    <MdPedalBike className="text-white text-lg" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#2563eb] text-white rounded-br-md whitespace-pre-wrap'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}
                  {...(msg.role === 'assistant'
                    ? { dangerouslySetInnerHTML: { __html: formatMessage(msg.content) } }
                    : { children: msg.content })}
                />
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1e40af] flex items-center justify-center shrink-0">
                  <MdPedalBike className="text-white text-lg" />
                </div>
                <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-4 mb-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-100 p-4 flex gap-3 bg-slate-50/50"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribile a Fobi..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              <FiSend size={18} />
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
