import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  ArrowUp,
  MessageSquare,
  FileText,
  LoaderCircle,
  Copy,
  Check,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { requestAI } from '../lib/api.js';

const prompts = [
  'What should I emphasize on the call?',
  'Make my reply more assertive',
  'What do I still need to ask?',
];
export default function Copilot({ lead, onMessages, onNotify, configured }) {
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastAttempt, setLastAttempt] = useState('');
  const controller = useRef(null);
  const bottom = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [lead.chat.length, busy]);
  const ask = async (value) => {
    const text = value.trim();
    if (!text || busy) return;
    if (text.length > 1500) {
      setError('Keep the question under 1,500 characters.');
      return;
    }
    if (lead.chat.length > 97) {
      setError('This conversation is full. Clear it before continuing.');
      return;
    }
    setBusy(true);
    setError('');
    setLastAttempt(text);
    controller.current = new AbortController();
    try {
      const result = await requestAI(
        'chat',
        {
          intake: lead.intake,
          analysis: lead.analysis,
          activity: lead.activity.slice(-20),
          history: lead.chat.slice(-12).map(({ role, content }) => ({ role, content })),
          question: text,
        },
        controller.current.signal,
      );
      const at = new Date().toISOString();
      onMessages([
        { id: crypto.randomUUID(), at, role: 'user', content: text },
        {
          id: crypto.randomUUID(),
          at,
          role: 'assistant',
          content: result.answer,
          evidence: result.evidence,
          suggestedResponse: result.suggestedResponse,
        },
      ]);
      setQuestion('');
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <aside className="copilot" aria-label="Lead copilot">
      <header className="copilot-heading">
        <div className="copilot-icon">
          <Sparkles size={18} />
        </div>
        <div>
          <h2>Your lead copilot</h2>
          <p>One lead. A clearer conversation.</p>
        </div>
        <span className="small-dot" />
      </header>
      <div className="copilot-context">
        <FileText size={13} />
        <span>
          In context <strong>{lead.intake.name}</strong>
        </span>
        <ShieldCheck size={14} />
      </div>
      <div className="chat-scroll" role="log" aria-label="Lead conversation" aria-live="polite">
        {!lead.chat.length && (
          <div className="chat-welcome">
            <div className="welcome-orbit">
              <MessageSquare size={23} />
              <span>
                <Sparkles size={10} />
              </span>
            </div>
            <h3>
              Go into your next call
              <br />
              with a little more clarity.
            </h3>
            <p>Ask about this customer’s needs, prepare for objections, or find the right words.</p>
            <div className="starter-prompts">
              {prompts.map((prompt) => (
                <button key={prompt} onClick={() => ask(prompt)} disabled={busy}>
                  {prompt}
                  <ArrowUp size={13} />
                </button>
              ))}
            </div>
            <p className="context-caption">
              Answers use this lead’s inquiry, analysis, and recent notes.
            </p>
          </div>
        )}
        {lead.chat.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <span className="chat-author">
              {message.role === 'user' ? (
                'YOU'
              ) : (
                <>
                  <Sparkles size={11} />
                  CLOSEWISE
                </>
              )}
            </span>
            <p>{message.content}</p>
            {message.suggestedResponse && (
              <ReplyDraft text={message.suggestedResponse} onNotify={onNotify} />
            )}
            {message.evidence?.length > 0 && (
              <details className="chat-evidence">
                <summary>
                  <FileText size={11} />
                  {message.evidence.length} source{message.evidence.length > 1 ? 's' : ''} from this
                  lead
                  <ChevronDown size={12} />
                </summary>
                {message.evidence.map((source, index) => (
                  <blockquote key={index}>
                    “{source.quote}”<cite>{source.field}</cite>
                  </blockquote>
                ))}
              </details>
            )}
          </div>
        ))}
        {busy && (
          <div className="chat-thinking">
            <LoaderCircle size={14} className="spin" />
            Reading this lead’s context…
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div className="chat-compose">
        {error && (
          <div className="error-box" role="alert">
            {error}
            <button className="text-button" onClick={() => ask(lastAttempt)} disabled={busy}>
              Retry
            </button>
          </div>
        )}
        {configured === false && (
          <p className="chat-setup-note">Connect Gemini on the server to use the copilot.</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <textarea
            aria-label="Ask about this lead"
            placeholder="Ask about this lead…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            maxLength={1500}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                ask(question);
              }
            }}
          />
          <button aria-label="Send question" disabled={busy || !question.trim()}>
            {busy ? <LoaderCircle size={16} className="spin" /> : <ArrowUp size={18} />}
          </button>
        </form>
        <div className="compose-foot">
          <span>Enter to send · Shift + Enter for a new line</span>
          {lead.chat.length > 0 && (
            <button className="text-button" disabled={busy} onClick={() => onMessages(null)}>
              Clear chat
            </button>
          )}
        </div>
        <p className="ai-caption">AI can make mistakes. Verify details before acting.</p>
      </div>
    </aside>
  );
}
function ReplyDraft({ text, onNotify }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="chat-reply-draft">
      <span>DRAFT REPLY</span>
      <p>{text}</p>
      <button
        className="text-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            onNotify('Rewritten reply copied.');
          } catch {
            onNotify('Select and copy the reply manually.', 'error');
          }
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy draft'}
      </button>
    </div>
  );
}
