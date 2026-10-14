import { useState } from 'react';
import { CalendarClock, Check } from 'lucide-react';
import Modal from './Modal.jsx';
import { localDateInput } from '../lib/format.js';

export default function FollowupModal({ lead, onSave, onClose }) {
  const [task, setTask] = useState(
    lead.followup?.task || lead.analysis?.nextAction || 'Contact customer to clarify requirements.',
  );
  const [due, setDue] = useState(
    localDateInput(
      lead.followup && !lead.followup.done
        ? new Date(lead.followup.dueAt)
        : new Date(Date.now() + 3600000),
    ),
  );
  const [error, setError] = useState('');
  const quickTime = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(days ? 10 : date.getHours() + 1, days ? 0 : date.getMinutes(), 0, 0);
    setDue(localDateInput(date));
  };
  return (
    <Modal
      title="Make the next step happen."
      description={`Plan a follow-up for ${lead.intake.name}.`}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !task.trim() ||
            task.trim().length > 400 ||
            !due ||
            !Number.isFinite(new Date(due).getTime())
          ) {
            setError('Add a task (up to 400 characters) and a valid date.');
            return;
          }
          onSave({ task: task.trim(), dueAt: new Date(due).toISOString(), done: false });
        }}
      >
        <div className="form-body">
          <label className="form-field">
            Next action
            <textarea
              rows={3}
              maxLength={400}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            Follow-up date & time
            <input
              type="datetime-local"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              required
            />
          </label>
          <div className="quick-times">
            <button type="button" onClick={() => quickTime(0)}>
              In one hour
            </button>
            <button type="button" onClick={() => quickTime(1)}>
              Tomorrow, 10 AM
            </button>
            <button type="button" onClick={() => quickTime(3)}>
              In 3 days
            </button>
          </div>
          <p className="field-hint">
            <CalendarClock size={13} />
            Uses your device’s local time. Reminders appear in the app while it’s open; no
            notification is sent.
          </p>
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer className="modal-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">
            <Check size={16} />
            Save follow-up
          </button>
        </footer>
      </form>
    </Modal>
  );
}
