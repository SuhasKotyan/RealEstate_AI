import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Sparkles,
  MapPin,
  Wallet,
  CalendarDays,
  House,
  Copy,
  Check,
  CalendarClock,
  MessageSquareText,
  CircleAlert,
  ListChecks,
  RefreshCw,
  Pencil,
  Trash2,
  Clock3,
  CheckCheck,
  ChevronDown,
  Plus,
  FileText,
} from 'lucide-react';
import { getScore, getPriority, isDue, scoreDefinitions } from '../../shared/contracts.mjs';
import { initials, formatDateTime } from '../lib/format.js';

export default function LeadDetail({
  lead,
  onAnalyze,
  analyzing,
  onEdit,
  onDelete,
  onStatus,
  onFollowup,
  onCompleteFollowup,
  onNote,
  onNotify,
  onOpenCopilot,
  now,
}) {
  const [tab, setTab] = useState('overview');
  const [reply, setReply] = useState(lead.analysis?.suggestedResponse || '');
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState('');
  useEffect(() => {
    setReply(lead.analysis?.suggestedResponse || '');
    setCopied(false);
  }, [lead.id, lead.analysis?.suggestedResponse]);
  const analysis = lead.analysis,
    priority = getPriority(analysis),
    score = getScore(analysis);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      onNotify('Reply copied. Review it before sending.');
    } catch {
      onNotify('Clipboard unavailable. Select and copy the draft manually.', 'error');
    }
  };
  return (
    <section className="lead-detail" aria-label={`${lead.intake.name} lead details`}>
      <header className="detail-heading">
        <div>
          <div className="eyebrow">
            LEAD WORKSPACE <span>/</span>{' '}
            {lead.source === 'sample' ? 'SAMPLE LEAD' : 'INBOUND LEAD'}
          </div>
          <div className="detail-title">
            <div className={`avatar avatar-large avatar-${priority.toLowerCase()}`}>
              {initials(lead.intake.name)}
            </div>
            <div>
              <h2>{lead.intake.name}</h2>
              <span>
                <MapPin size={13} />
                {lead.intake.location}
              </span>
            </div>
          </div>
        </div>
        <div className="detail-actions">
          <button className="button secondary small" onClick={onOpenCopilot}>
            <Sparkles size={15} />
            Ask copilot
          </button>
          <button
            className="icon-button"
            title="Edit lead"
            aria-label="Edit lead"
            onClick={onEdit}
            disabled={analyzing}
          >
            <Pencil size={16} />
          </button>
          <button
            className="icon-button"
            title="Delete lead"
            aria-label="Delete lead"
            onClick={onDelete}
            disabled={analyzing}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>
      <div className="detail-meta">
        <span className={`pill ${priority.toLowerCase()}`}>
          <i />
          {priority === 'Unscored' ? 'Awaiting analysis' : `${priority} lead`}
        </span>
        <label className="status-select">
          Status{' '}
          <select
            aria-label="Lead status"
            value={lead.status}
            onChange={(e) => onStatus(e.target.value)}
          >
            {['New', 'Contacted', 'Visit booked', 'Won', 'Lost'].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <span className="received">Added {formatDateTime(lead.createdAt)}</span>
      </div>
      <div className="detail-tabs" role="tablist" aria-label="Lead information">
        <button
          role="tab"
          id="tab-overview"
          aria-controls="panel-overview"
          aria-selected={tab === 'overview'}
          className={tab === 'overview' ? 'active' : ''}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          role="tab"
          id="tab-message"
          aria-controls="panel-message"
          aria-selected={tab === 'message'}
          className={tab === 'message' ? 'active' : ''}
          onClick={() => setTab('message')}
        >
          Original inquiry
        </button>
        <button
          role="tab"
          id="tab-activity"
          aria-controls="panel-activity"
          aria-selected={tab === 'activity'}
          className={tab === 'activity' ? 'active' : ''}
          onClick={() => setTab('activity')}
        >
          Activity <span>{lead.activity.length}</span>
        </button>
      </div>
      <div className="detail-content">
        {lead.source === 'sample' && (
          <div className="sample-notice">
            <FileText size={13} />
            Illustrative sample analysis. Re-analyze to generate a real Gemini result.
          </div>
        )}
        {tab === 'overview' && (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
            <div className="fact-grid">
              <Fact icon={House} label="PROPERTY" value={lead.intake.property} />
              <Fact icon={Wallet} label="BUDGET" value={lead.intake.budget} />
              <Fact icon={CalendarDays} label="TIMELINE" value={lead.intake.timeline} />
            </div>
            {analysis ? (
              <>
                <div className="summary-card">
                  <div className="section-label">
                    <Sparkles size={15} />
                    THE QUICK READ<span>AI SUMMARY</span>
                  </div>
                  <p>{analysis.summary}</p>
                  <div className="intent-label">
                    <span>Customer intent</span>
                    {analysis.intent}
                  </div>
                </div>
                <div className="insight-grid">
                  <div className="insight-card">
                    <h3>
                      <ListChecks size={16} />
                      What matters to them
                    </h3>
                    <ul>
                      {analysis.requirements.map((item, i) => (
                        <li key={i}>
                          <Check size={13} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="insight-card concerns-card">
                    <h3>
                      <CircleAlert size={16} />
                      What could hold them back
                    </h3>
                    {analysis.concerns.length ? (
                      <ul>
                        {analysis.concerns.map((item, i) => (
                          <li key={i}>
                            <span className="list-dot" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">No concerns stated. Confirm this on the call.</p>
                    )}
                    {analysis.missingInformation.length > 0 && (
                      <div className="missing-info">
                        <span>STILL TO CLARIFY</span>
                        <ul>
                          {analysis.missingInformation.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="next-action">
                  <div className="action-icon">
                    <ArrowUpRight size={21} />
                  </div>
                  <div>
                    <span className="eyebrow">YOUR NEXT BEST MOVE</span>
                    <p>{analysis.nextAction}</p>
                  </div>
                  <button className="button small" onClick={onFollowup}>
                    <CalendarClock size={15} />
                    Plan it
                  </button>
                </div>
                {lead.followup && (
                  <Followup
                    lead={lead}
                    now={now}
                    onEdit={onFollowup}
                    onComplete={onCompleteFollowup}
                  />
                )}
                <div className="reply-card">
                  <div className="card-heading">
                    <h3>
                      <MessageSquareText size={16} />
                      Start the conversation
                    </h3>
                    <span className="subtle-tag">DRAFT REPLY</span>
                  </div>
                  <textarea
                    aria-label="Suggested response"
                    value={reply}
                    onChange={(e) => {
                      setReply(e.target.value);
                      setCopied(false);
                    }}
                    rows={5}
                    maxLength={1800}
                  />
                  <div className="reply-footer">
                    <span>Edit before you send. No message is sent automatically.</span>
                    <button
                      className="button secondary small"
                      onClick={copy}
                      disabled={!reply.trim()}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy reply'}
                    </button>
                  </div>
                </div>
                <details className="score-explanation">
                  <summary>
                    <div>
                      <span className={`score-number ${priority.toLowerCase()}`}>{score}</span>
                      <span>
                        Why this priority?<small>Four signals. Clear reasons.</small>
                      </span>
                    </div>
                    <ChevronDown size={16} />
                  </summary>
                  <div className="score-parts">
                    {scoreDefinitions.map((part) => (
                      <div className="score-part" key={part.key}>
                        <div>
                          <span>{part.label}</span>
                          <strong>
                            {analysis.scores[part.key].points}
                            <small> / {part.max}</small>
                          </strong>
                        </div>
                        <div className="progress-track">
                          <div
                            style={{
                              width: `${(analysis.scores[part.key].points / part.max) * 100}%`,
                            }}
                          />
                        </div>
                        <p>{analysis.scores[part.key].reason}</p>
                      </div>
                    ))}
                    <p className="field-hint">
                      Hot ≥75 · Warm 45–74 · Cold &lt;45. A prioritization aid, not a prediction of
                      conversion. Budget size doesn’t earn points.
                    </p>
                  </div>
                </details>
                <details className="source-details">
                  <summary>
                    <FileText size={14} />
                    Source evidence
                    <ChevronDown size={14} />
                  </summary>
                  {analysis.evidence.map((source, i) => (
                    <blockquote key={i}>
                      “{source.quote}”
                      <cite>{source.field === 'message' ? 'Customer message' : source.field}</cite>
                    </blockquote>
                  ))}
                </details>
              </>
            ) : (
              <div className="analysis-empty">
                <div className="sparkle-box">
                  <Sparkles size={26} />
                </div>
                <h3>Turn this inquiry into a clear next step.</h3>
                <p>
                  This lead is saved. Analyze it to reveal intent, requirements, objections and an
                  explained priority score.
                </p>
                <button className="button primary" onClick={onAnalyze} disabled={analyzing}>
                  <Sparkles size={16} />
                  {analyzing ? 'Analyzing…' : 'Analyze lead'}
                </button>
                {lead.followup && (
                  <Followup
                    lead={lead}
                    now={now}
                    onEdit={onFollowup}
                    onComplete={onCompleteFollowup}
                  />
                )}
              </div>
            )}
            <div className="analysis-footer">
              <span>
                {lead.source === 'live'
                  ? `${lead.model} · ${formatDateTime(lead.analyzedAt)}`
                  : lead.source === 'sample'
                    ? 'Hand-authored sample · not a live AI result'
                    : 'Draft · not yet analyzed'}
              </span>
              <button className="text-button" onClick={onAnalyze} disabled={analyzing}>
                <RefreshCw size={12} className={analyzing ? 'spin' : ''} />
                {analyzing ? 'Analyzing…' : analysis ? 'Re-analyze' : 'Analyze'}
              </button>
            </div>
          </div>
        )}
        {tab === 'message' && (
          <div
            role="tabpanel"
            id="panel-message"
            aria-labelledby="tab-message"
            className="original-message"
          >
            <div className="section-label">
              <MessageSquareText size={15} />
              IN THE CUSTOMER’S WORDS
            </div>
            <blockquote>{lead.intake.message}</blockquote>
            <p className="field-hint">
              This is the original inquiry used for AI analysis and source citations.
            </p>
          </div>
        )}
        {tab === 'activity' && (
          <div role="tabpanel" id="panel-activity" aria-labelledby="tab-activity">
            <div className="activity-intro">
              <h3>Keep the conversation moving.</h3>
              <p>
                Record what happened on the call. Your copilot uses recent notes to stay in context.
              </p>
            </div>
            {lead.followup && (
              <Followup lead={lead} now={now} onEdit={onFollowup} onComplete={onCompleteFollowup} />
            )}
            <form
              className="note-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                onNote(note.trim());
                setNote('');
              }}
            >
              <label htmlFor="call-note">Call outcome or note</label>
              <textarea
                id="call-note"
                placeholder="e.g. Spoke to the customer. Sunday visit preferred; asked for a maintenance breakdown."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1800}
                rows={3}
                required
              />
              <button className="button secondary small" disabled={!note.trim()}>
                <Plus size={14} />
                Add note
              </button>
            </form>
            <div className="timeline">
              {[...lead.activity].reverse().map((item) => (
                <div className="timeline-item" key={item.id}>
                  <div className={`timeline-dot ${item.type}`} />
                  <div>
                    <span>
                      {item.type === 'note'
                        ? 'Conversation note'
                        : item.type === 'status'
                          ? 'Status updated'
                          : item.type === 'completed'
                            ? 'Follow-up completed'
                            : 'Follow-up planned'}
                      <time>{formatDateTime(item.at)}</time>
                    </span>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
              {!lead.activity.length && (
                <p className="muted">No activity yet. Add your first conversation note.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
function Fact({ icon: Icon, label, value }) {
  return (
    <div className="fact">
      <span>
        <Icon size={13} />
        {label}
      </span>
      <p>{value}</p>
    </div>
  );
}
function Followup({ lead, now, onEdit, onComplete }) {
  const due = isDue(lead, now),
    done = lead.followup.done;
  return (
    <div className={`followup-card ${done ? 'done' : due ? 'due' : ''}`}>
      <div>
        <span className="section-label">
          {done ? <CheckCheck size={14} /> : <Clock3 size={14} />}
          {done ? 'FOLLOW-UP COMPLETED' : due ? 'FOLLOW-UP DUE' : 'FOLLOW-UP PLANNED'}
        </span>
        <p>{lead.followup.task}</p>
        <small>{formatDateTime(lead.followup.dueAt)} · local time</small>
      </div>
      <div className="followup-buttons">
        <button className="text-button" onClick={onEdit}>
          {done ? 'Plan next' : 'Reschedule'}
        </button>
        {!done && (
          <button className="button secondary small" onClick={onComplete}>
            <Check size={14} />
            Done
          </button>
        )}
      </div>
    </div>
  );
}
