import { Search, SlidersHorizontal, ArrowUpRight, Clock3, MapPin, Inbox } from 'lucide-react';
import { getPriority, getScore, isDue, isOpen } from '../../shared/contracts.mjs';
import { initials, formatDateTime } from '../lib/format.js';

export default function LeadQueue({
  leads,
  total,
  selectedId,
  onSelect,
  query,
  setQuery,
  priority,
  setPriority,
  order,
  setOrder,
  now,
}) {
  return (
    <section className="lead-queue" aria-label="Lead queue">
      <div className="queue-heading">
        <h2>
          Your lead queue <span>{leads.length}</span>
        </h2>
        <SlidersHorizontal size={17} />
      </div>
      <div className="search-wrap">
        <Search size={16} />
        <input
          aria-label="Search leads"
          placeholder="Search name, area, requirements…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Clear search">
            ×
          </button>
        )}
      </div>
      <div className="queue-controls">
        <div className="priority-tabs" aria-label="Filter by priority">
          {['All', 'Hot', 'Warm', 'Cold', 'Unscored'].map((value) => (
            <button
              key={value}
              aria-pressed={priority === value}
              className={priority === value ? 'active' : ''}
              onClick={() => setPriority(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="sort">
          Sort leads
        </label>
        <select id="sort" value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="priority">Highest priority</option>
          <option value="followup">Follow-up time</option>
          <option value="newest">Newest first</option>
        </select>
      </div>
      <div className="queue-list">
        {leads.map((lead) => {
          const tier = getPriority(lead.analysis),
            score = getScore(lead.analysis),
            due = isDue(lead, now);
          return (
            <button
              className={`lead-card ${selectedId === lead.id ? 'selected' : ''} ${!isOpen(lead) ? 'closed' : ''}`}
              key={lead.id}
              onClick={() => onSelect(lead.id)}
              aria-pressed={selectedId === lead.id}
            >
              <div className="lead-card-top">
                <div className={`avatar avatar-${tier.toLowerCase()}`}>
                  {initials(lead.intake.name)}
                </div>
                <div className="lead-card-name">
                  <h3>{lead.intake.name}</h3>
                  <span>
                    <MapPin size={11} />
                    {lead.intake.location}
                  </span>
                </div>
                <span className={`score-mini ${tier.toLowerCase()}`}>
                  {score ?? '—'}
                  <small>/100</small>
                </span>
              </div>
              <p className="lead-card-summary">{lead.analysis?.summary || lead.intake.property}</p>
              <div className="lead-card-bottom">
                <span className={`pill ${tier.toLowerCase()}`}>
                  <i />
                  {tier}
                </span>
                <span className="lead-status">{lead.status}</span>
                {lead.source === 'sample' && <span className="sample-mini">Sample</span>}
                <ArrowUpRight size={14} />
              </div>
              {lead.followup && !lead.followup.done && (
                <div className={`followup-mini ${due ? 'overdue' : ''}`}>
                  <Clock3 size={12} />
                  {due ? 'Follow-up due' : 'Follow-up'} · {formatDateTime(lead.followup.dueAt)}
                </div>
              )}
            </button>
          );
        })}
        {!leads.length && (
          <div className="empty-state">
            <Inbox size={30} />
            <h3>{total ? 'No matching leads' : 'Your next opportunity starts here'}</h3>
            <p>
              {total
                ? 'Try a different search or filter.'
                : 'Add a lead to get a summary, priority, and a clear next step.'}
            </p>
            {total > 0 && (
              <button
                className="text-button"
                onClick={() => {
                  setQuery('');
                  setPriority('All');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
      <div className="queue-footnote">
        <span className="small-dot" />
        Ranked by AI score · review the reasons
      </div>
    </section>
  );
}
