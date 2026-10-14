import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  House,
  LayoutDashboard,
  CalendarClock,
  Settings2,
  ArrowUpRight,
  Plus,
  Sparkles,
  ChevronRight,
  Download,
  Upload,
  CircleHelp,
  Check,
  X,
  AlertTriangle,
  Inbox,
  Flame,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import LeadQueue from './components/LeadQueue.jsx';
import LeadDetail from './components/LeadDetail.jsx';
import Copilot from './components/Copilot.jsx';
import LeadForm from './components/LeadForm.jsx';
import FollowupModal from './components/FollowupModal.jsx';
import Modal from './components/Modal.jsx';
import { createSampleLeads } from './data/samples.js';
import { requestAI } from './lib/api.js';
import { readLeads, writeLeads, exportLeads, downloadFile, STORAGE_KEY } from './lib/storage.js';
import { makeDraft, makeActivity, formatDate } from './lib/format.js';
import { backupSchema, getPriority, isDue, isOpen, sortLeads } from '../shared/contracts.mjs';

export default function App() {
  const [initial] = useState(() => readLeads());
  const [leads, setLeads] = useState(() => initial.leads ?? createSampleLeads());
  const [storageError, setStorageError] = useState(initial.error);
  const [storageBlocked, setStorageBlocked] = useState(!!initial.error);
  const [selectedId, setSelectedId] = useState(
    () => (initial.leads ?? createSampleLeads())[0]?.id || null,
  );
  const [view, setView] = useState('leads');
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('All');
  const [order, setOrder] = useState('priority');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [apiState, setApiState] = useState({
    status: 'checking',
    configured: null,
    model: 'gemini-2.5-flash',
  });
  const [analyzing, setAnalyzing] = useState(new Set());
  const [analysisErrors, setAnalysisErrors] = useState({});
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [confirm, setConfirm] = useState(null);
  const inFlight = useRef(new Set());
  const importer = useRef(null);
  const notify = useCallback(
    (message, type = 'success') => setToast({ message, type, id: Date.now() }),
    [],
  );
  const checkHealth = useCallback(async () => {
    setApiState((prev) => ({ ...prev, status: 'checking' }));
    try {
      const response = await fetch('/api/health', { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setApiState({
        status: data.configured ? 'configured' : 'unconfigured',
        configured: data.configured,
        model: data.model,
      });
    } catch {
      setApiState((prev) => ({ ...prev, status: 'offline', configured: null }));
    }
  }, []);
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    if (storageBlocked) return;
    try {
      writeLeads(leads);
      setStorageError(null);
    } catch {
      setStorageError(
        'Browser storage is unavailable or full. Changes are only in memory. Export a backup to keep your work.',
      );
    }
  }, [leads, storageBlocked]);
  const updateLead = useCallback(
    (id, update) => setLeads((prev) => prev.map((lead) => (lead.id === id ? update(lead) : lead))),
    [],
  );
  const activeLeads = leads.filter(isOpen);
  const hotCount = activeLeads.filter((l) => getPriority(l.analysis) === 'Hot').length;
  const dueCount = leads.filter((l) => isDue(l, now)).length;
  const followupCount = activeLeads.filter((l) => l.followup && !l.followup.done).length;
  const filteredLeads = useMemo(
    () =>
      sortLeads(
        leads.filter((lead) => {
          if (view === 'followups' && (!isOpen(lead) || !lead.followup || lead.followup.done))
            return false;
          if (priority !== 'All' && getPriority(lead.analysis) !== priority) return false;
          const searchable = [
            lead.intake.name,
            lead.intake.location,
            lead.intake.property,
            lead.intake.message,
            lead.analysis?.summary || '',
          ]
            .join(' ')
            .toLowerCase();
          return searchable.includes(query.toLowerCase().trim());
        }),
        order,
        now,
      ),
    [leads, view, priority, query, order, now],
  );
  const selected = filteredLeads.find((lead) => lead.id === selectedId) || filteredLeads[0] || null;
  const addActivity = (lead, type, text) =>
    [...lead.activity, makeActivity(type, text)].slice(-200);
  const analyze = async (lead) => {
    if (inFlight.current.has(lead.id)) return;
    inFlight.current.add(lead.id);
    setAnalyzing((prev) => new Set([...prev, lead.id]));
    setAnalysisErrors((prev) => ({ ...prev, [lead.id]: null }));
    try {
      const result = await requestAI('analyze', { intake: lead.intake });
      const { model, generatedAt, ...analysis } = result;
      updateLead(lead.id, (current) => ({
        ...current,
        analysis,
        source: 'live',
        model,
        analyzedAt: generatedAt,
        chat: [],
      }));
      notify(`${lead.intake.name} analyzed. Priority and next steps are ready.`);
      setApiState((prev) => ({ ...prev, configured: true, status: 'configured' }));
    } catch (error) {
      setAnalysisErrors((prev) => ({ ...prev, [lead.id]: error.message }));
      notify('Analysis failed. The lead and any previous result are preserved.', 'error');
    } finally {
      inFlight.current.delete(lead.id);
      setAnalyzing((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  };
  const saveLead = (intake, shouldAnalyze) => {
    const editing = modal === 'edit' && selected;
    if (!editing && leads.length >= 500) {
      notify(
        'This browser workspace supports 500 leads. Export and remove old leads first.',
        'error',
      );
      return;
    }
    const lead = editing
      ? {
          ...selected,
          intake,
          analysis: null,
          source: 'draft',
          analyzedAt: null,
          model: null,
          chat: [],
          activity: addActivity(
            selected,
            'note',
            'Lead details edited. Previous AI analysis and chat cleared.',
          ),
        }
      : makeDraft(intake);
    if (editing) updateLead(lead.id, () => lead);
    else setLeads((prev) => [lead, ...prev]);
    setSelectedId(lead.id);
    setQuery('');
    setPriority('All');
    setView('leads');
    setModal(null);
    setAnalysisErrors((prev) => ({ ...prev, [lead.id]: null }));
    if (shouldAnalyze) analyze(lead);
    else
      notify(
        editing
          ? 'Details saved. Re-analyze to refresh the AI insights.'
          : 'Lead saved as a draft.',
      );
  };
  const showView = (next) => {
    setView(next);
    setPriority('All');
    setQuery('');
    setOrder(next === 'followups' ? 'followup' : 'priority');
  };
  const importBackup = async (file) => {
    if (!file) return;
    if (analyzing.size) {
      notify('Wait for the current analysis to finish before importing.', 'error');
      return;
    }
    try {
      if (file.size > 8000000) throw new Error('Backup exceeds the 8 MB import limit.');
      const parsed = backupSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success)
        throw new Error('This is not a valid Closewise backup. Nothing was changed.');
      const existing = new Set(leads.map((l) => l.id));
      const newLeads = parsed.data.leads.filter((l) => !existing.has(l.id));
      if (newLeads.length + leads.length > 500)
        throw new Error('Import would exceed the 500-lead workspace limit.');
      setLeads((prev) => [...prev, ...newLeads]);
      notify(
        `Imported ${newLeads.length} leads. ${parsed.data.leads.length - newLeads.length} existing leads skipped.`,
      );
    } catch (error) {
      notify(
        error instanceof SyntaxError
          ? 'Could not read this JSON backup. Nothing was changed.'
          : error.message,
        'error',
      );
    } finally {
      if (importer.current) importer.current.value = '';
    }
  };
  return (
    <div className="app-shell">
      <nav className="sidebar" aria-label="Main navigation">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            showView('leads');
          }}
        >
          <span className="brand-mark">
            <House size={22} />
            <Check size={9} />
          </span>
          <span>
            closewise<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-icon">RE</span>
          <div>
            Real estate workspace<small>YOUR SALES DESK</small>
          </div>
          <ChevronRight size={13} />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <button
          className={`nav-item ${view === 'leads' ? 'active' : ''}`}
          onClick={() => showView('leads')}
        >
          <LayoutDashboard size={18} />
          Lead workspace<span>{leads.length}</span>
        </button>
        <button
          className={`nav-item ${view === 'followups' ? 'active' : ''}`}
          onClick={() => showView('followups')}
        >
          <CalendarClock size={18} />
          Follow-ups{followupCount > 0 && <span>{followupCount}</span>}
        </button>
        <div className="sidebar-tip">
          <div>
            <Sparkles size={17} />
            <span>A LITTLE EDGE, EVERY DAY</span>
          </div>
          <p>
            Less time sorting.
            <br />
            More time connecting.
          </p>
          <span>
            Prioritize with context.
            <br />
            Follow through with purpose.
          </span>
          <div className="tip-line" />
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setModal('guide')}>
            <CircleHelp size={17} />
            Quick guide
            <ArrowUpRight size={14} />
          </button>
          <button className="nav-item" onClick={() => setModal('settings')}>
            <Settings2 size={17} />
            Workspace settings
          </button>
          <div className="local-workspace">
            <div className="avatar">YO</div>
            <div>
              Your workspace
              <small>
                <Database size={10} />
                Saved on this device
              </small>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-shell">
        <header className="topbar">
          <div>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{view === 'followups' ? 'Follow-ups' : 'Leads'}</strong>
          </div>
          <div>
            <span className="today-label">
              {formatDate(now, { weekday: 'short', year: 'numeric' })}
            </span>
            <button className={`api-badge ${apiState.status}`} onClick={() => setModal('settings')}>
              <span className="small-dot" />
              {apiState.status === 'configured'
                ? 'Gemini configured'
                : apiState.status === 'unconfigured'
                  ? 'Connect Gemini'
                  : apiState.status === 'checking'
                    ? 'Checking AI…'
                    : 'API offline'}
            </button>
          </div>
        </header>
        <div className="page-intro">
          <div>
            <div className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</div>
            <h1>
              {view === 'followups' ? (
                <>
                  A good conversation deserves
                  <br className="intro-break" /> a <em>next step.</em>
                </>
              ) : (
                <>
                  Every lead. A <em>clearer next move.</em>
                </>
              )}
            </h1>
            <p>
              {view === 'followups'
                ? 'Your planned next steps, ordered by when they need your attention.'
                : 'Know who to call, what matters to them, and how to move forward.'}
            </p>
          </div>
          <button className="button primary add-lead" onClick={() => setModal('new')}>
            <Plus size={17} />
            Add a lead
          </button>
        </div>
        <div className="metrics">
          <button
            className={view === 'leads' && priority === 'All' ? 'metric chosen' : 'metric'}
            onClick={() => showView('leads')}
          >
            <div>
              <span>IN YOUR WORKSPACE</span>
              <strong>
                {leads.length}
                <small>leads</small>
              </strong>
            </div>
            <span className="metric-icon neutral">
              <Inbox size={20} />
            </span>
            <p>
              Every inquiry, one place
              <ArrowRight size={13} />
            </p>
          </button>
          <button
            className={`metric ${priority === 'Hot' ? 'chosen' : ''}`}
            onClick={() => {
              showView('leads');
              setPriority('Hot');
            }}
          >
            <div>
              <span>WORTH YOUR ATTENTION</span>
              <strong>
                {hotCount}
                <small>hot leads</small>
              </strong>
            </div>
            <span className="metric-icon terracotta">
              <Flame size={20} />
            </span>
            <p>
              Strong intent, sooner timelines
              <ArrowRight size={13} />
            </p>
          </button>
          <button
            className={`metric ${view === 'followups' ? 'chosen' : ''}`}
            onClick={() => showView('followups')}
          >
            <div>
              <span>TIME TO FOLLOW THROUGH</span>
              <strong>
                {dueCount}
                <small>follow-ups due</small>
              </strong>
            </div>
            <span className="metric-icon olive">
              <CalendarClock size={20} />
            </span>
            <p>
              {followupCount} open follow-up{followupCount === 1 ? '' : 's'} planned
              <ArrowRight size={13} />
            </p>
          </button>
        </div>
        {storageError && (
          <div className="storage-warning" role="alert">
            <AlertTriangle size={16} />
            <span>{storageError}</span>
            <button className="text-button" onClick={() => setModal('settings')}>
              Manage data
            </button>
          </div>
        )}
        <div className="workspace-toolbar">
          <div>
            <span className="small-dot" />
            <span>
              {view === 'followups' ? 'No next step left behind.' : 'Your opportunities, in focus.'}
            </span>
          </div>
          <div>
            <span className="sample-caption">
              {leads.some((l) => l.source === 'sample')
                ? 'Sample leads are labeled'
                : 'Browser-local workspace'}
            </span>
            <button
              className="icon-button"
              title="Ask about this lead"
              aria-label="Ask copilot"
              onClick={() => setCopilotOpen(true)}
            >
              <Sparkles size={17} />
              <span>Ask copilot</span>
            </button>
          </div>
        </div>
        <div className="workspace-grid no-copilot">
          <LeadQueue
            leads={filteredLeads}
            total={leads.length}
            selectedId={selected?.id}
            onSelect={setSelectedId}
            query={query}
            setQuery={setQuery}
            priority={priority}
            setPriority={setPriority}
            order={order}
            setOrder={setOrder}
            now={now}
          />
          {selected ? (
            <>
              <div className="detail-column">
                {analysisErrors[selected.id] && (
                  <div className="analysis-error error-box" role="alert">
                    <span>{analysisErrors[selected.id]}</span>
                    <button
                      className="text-button"
                      onClick={() => analyze(selected)}
                      disabled={analyzing.has(selected.id)}
                    >
                      Retry analysis
                    </button>
                  </div>
                )}
                <LeadDetail
                  key={selected.id}
                  lead={selected}
                  now={now}
                  analyzing={analyzing.has(selected.id)}
                  onAnalyze={() => analyze(selected)}
                  onEdit={() => setModal('edit')}
                  onDelete={() =>
                    setConfirm({
                      title: 'Delete this lead?',
                      description: `${selected.intake.name} and their analysis, notes and chat will be removed from this browser.`,
                      action: () => {
                        setLeads((prev) => prev.filter((l) => l.id !== selected.id));
                        setSelectedId(null);
                        notify('Lead deleted.');
                      },
                    })
                  }
                  onNotify={notify}
                  onOpenCopilot={() => setCopilotOpen(true)}
                  onStatus={(status) =>
                    updateLead(selected.id, (lead) => ({
                      ...lead,
                      status,
                      activity: addActivity(
                        lead,
                        'status',
                        `Status changed from ${lead.status} to ${status}.`,
                      ),
                    }))
                  }
                  onFollowup={() => setModal('followup')}
                  onCompleteFollowup={() => {
                    updateLead(selected.id, (lead) => ({
                      ...lead,
                      followup: { ...lead.followup, done: true },
                      activity: addActivity(lead, 'completed', lead.followup.task),
                    }));
                    notify('Follow-up completed. Nice follow-through.');
                  }}
                  onNote={(text) => {
                    updateLead(selected.id, (lead) => ({
                      ...lead,
                      activity: addActivity(lead, 'note', text),
                    }));
                    notify('Conversation note saved. Your copilot can use it.');
                  }}
                />
              </div>
            </>
          ) : (
            <section className="no-selection">
              <span className="sparkle-box">
                <House size={32} />
              </span>
              <h2>
                {view === 'followups'
                  ? 'A little room to plan ahead.'
                  : 'Make room for your next opportunity.'}
              </h2>
              <p>
                {view === 'followups'
                  ? 'Use “Plan it” on any lead to create a dated follow-up. It’ll appear here when it’s time to act.'
                  : 'Add a customer inquiry or adjust the filters to start a conversation.'}
              </p>
              <button
                className="button primary"
                onClick={() => (view === 'followups' ? showView('leads') : setModal('new'))}
              >
                {view === 'followups' ? 'Browse leads' : 'Add your first lead'}
                <ArrowRight size={16} />
              </button>
            </section>
          )}
        </div>
        <footer className="page-footer">
          <span>Made for conversations that move things forward.</span>
          <span>AI assisted. Human decided.</span>
        </footer>
      </main>
      {copilotOpen && selected && (
        <Modal
          title={selected.intake.name}
          description="Your lead’s inquiry and recent notes stay in context."
          className="copilot-modal"
          onClose={() => setCopilotOpen(false)}
        >
          <Copilot
            key={`${selected.id}:${selected.analyzedAt}:${JSON.stringify(selected.intake)}`}
            lead={selected}
            configured={apiState.configured}
            onNotify={notify}
            onMessages={(messages) =>
              updateLead(selected.id, (lead) => ({
                ...lead,
                chat: messages ? [...lead.chat, ...messages].slice(-100) : [],
              }))
            }
          />
        </Modal>
      )}
      {(modal === 'new' || modal === 'edit') && (
        <LeadForm
          initial={modal === 'edit' ? selected?.intake : null}
          onClose={() => setModal(null)}
          onSave={saveLead}
          configured={apiState.configured}
          busy={false}
        />
      )}
      {modal === 'followup' && selected && (
        <FollowupModal
          lead={selected}
          onClose={() => setModal(null)}
          onSave={(followup) => {
            updateLead(selected.id, (lead) => ({
              ...lead,
              followup,
              activity: addActivity(
                lead,
                'followup',
                `${followup.task} Due ${new Date(followup.dueAt).toLocaleString()}.`,
              ),
            }));
            setModal(null);
            notify('Follow-up planned. You’ll find it in the queue.');
          }}
        />
      )}
      {modal === 'settings' && (
        <Modal
          title="Workspace settings"
          description="A simple setup. A clear picture of where your data lives."
          onClose={() => setModal(null)}
        >
          <div className="form-body settings-body">
            <div className="settings-section">
              <h3>
                <Sparkles size={17} />
                AI connection
              </h3>
              <p>
                <strong>
                  {apiState.status === 'configured'
                    ? 'API key configured'
                    : apiState.status === 'unconfigured'
                      ? 'API key not configured'
                      : apiState.status === 'checking'
                        ? 'Checking server…'
                        : 'Server unreachable'}
                </strong>{' '}
                · {apiState.model}
              </p>
              <p>
                Configuration status checks for a key, not whether it is valid. A successful
                analysis confirms the connection. Keep the key in the server environment as{' '}
                <code>GEMINI_API_KEY</code>.
              </p>
              <button className="button secondary small" onClick={checkHealth}>
                <RefreshCw size={14} />
                Refresh connection
              </button>
            </div>
            <div className="settings-section">
              <h3>
                <Database size={17} />
                Your data
              </h3>
              <p>
                Leads, notes and chat are stored in this browser on this device. They are not shared
                with other users. Clearing browser data removes them. Only AI requests send selected
                lead context to Gemini.
              </p>
              <div className="settings-buttons">
                <button
                  className="button secondary small"
                  onClick={() => {
                    exportLeads(leads);
                    notify('Workspace backup downloaded.');
                  }}
                >
                  <Download size={14} />
                  Export backup
                </button>
                <button
                  className="button secondary small"
                  disabled={analyzing.size > 0}
                  onClick={() => importer.current?.click()}
                >
                  <Upload size={14} />
                  Import backup
                </button>
              </div>
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                ref={importer}
                onChange={(e) => importBackup(e.target.files?.[0])}
                aria-label="Import Closewise backup"
              />
              {storageBlocked && (
                <div className="error-box">
                  <p>
                    Existing stored data is unreadable. Export the original bytes before resetting:
                  </p>
                  <button
                    className="button secondary small"
                    onClick={() => {
                      try {
                        downloadFile(
                          'closewise-recovery.json',
                          localStorage.getItem(STORAGE_KEY) || '',
                        );
                      } catch {
                        notify('Browser storage cannot be read.', 'error');
                      }
                    }}
                  >
                    Export original stored data
                  </button>
                </div>
              )}
            </div>
            <div className="settings-section">
              <h3>
                <FileTextIcon />
                Demo workspace
              </h3>
              <p>
                Samples are fictional and their analysis is hand-authored. Re-analyze a sample or
                add a lead to run real AI. Chat always uses Gemini.
              </p>
              <div className="settings-buttons">
                <button
                  className="button secondary small"
                  disabled={analyzing.size > 0}
                  onClick={() => {
                    const samples = createSampleLeads().filter(
                      (s) => !leads.some((l) => l.id === s.id),
                    );
                    if (leads.length + samples.length > 500) {
                      notify('Remove some leads before loading samples.', 'error');
                      return;
                    }
                    setLeads((prev) => [...prev, ...samples]);
                    notify(`${samples.length} sample leads loaded.`);
                  }}
                >
                  Load sample leads
                </button>
                <button
                  className="button danger small"
                  disabled={analyzing.size > 0}
                  onClick={() =>
                    setConfirm({
                      title: 'Clear this workspace?',
                      description:
                        'All leads, notes, follow-ups and chat in this browser will be deleted. Export a backup first if you need them.',
                      action: () => {
                        setLeads([]);
                        setStorageBlocked(false);
                        setStorageError(null);
                        setModal(null);
                        notify('Workspace cleared.');
                      },
                    })
                  }
                >
                  Clear all data
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {modal === 'guide' && (
        <Modal
          title="From inquiry to next step."
          description="Your quick guide to Closewise."
          onClose={() => setModal(null)}
        >
          <div className="form-body guide-body">
            {[
              [
                '01',
                'Capture the conversation',
                'Add the customer’s requirements and paste their message. Save a draft or run AI analysis.',
              ],
              [
                '02',
                'Find the right lead',
                'The queue sorts open leads by score. Click a lead to scan the summary, concerns and next action. Expand “Why this priority?” to inspect the reasons.',
              ],
              [
                '03',
                'Prepare for the call',
                'Ask the copilot what to emphasize or how to rewrite a response. It uses only the selected lead’s context and recent activity.',
              ],
              [
                '04',
                'Follow through',
                'Use “Plan it” to schedule the next action. After your call, add an activity note and update the status. Mark your follow-up done.',
              ],
            ].map(([n, title, text]) => (
              <div className="guide-step" key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
            <p className="form-privacy">
              AI scores support your judgment. Confirm costs, availability and customer intent
              before making commitments. Replies are drafts for you to review.
            </p>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={confirm.title}
          description={confirm.description}
          onClose={() => setConfirm(null)}
        >
          <div className="modal-footer">
            <button className="button secondary" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="button danger"
              onClick={() => {
                confirm.action();
                setConfirm(null);
              }}
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.type === 'error' ? <AlertTriangle size={17} /> : <Check size={17} />}
          <span>{toast.message}</span>
          <button aria-label="Dismiss notification" onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function FileTextIcon() {
  return <Inbox size={17} />;
}
