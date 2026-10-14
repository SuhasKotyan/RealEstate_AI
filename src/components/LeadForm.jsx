import { useState } from 'react';
import { ArrowRight, LoaderCircle, Sparkles, AlertCircle } from 'lucide-react';
import Modal from './Modal.jsx';
import { intakeSchema } from '../../shared/contracts.mjs';

const blank = { name: '', location: '', property: '', budget: '', timeline: '', message: '' };
const example = {
  name: 'Kavya Rao',
  location: 'Sarjapur Road, Bengaluru',
  property: '2 BHK, ready to move, covered parking',
  budget: '₹90 lakh all-in',
  timeline: 'Within 6 weeks',
  message:
    'Hi, I need a ready-to-move 2 BHK on Sarjapur Road, near my office. My total budget including registration is 90 lakh. I want to buy within six weeks. Covered parking is a must. I am worried about water supply and maintenance charges. I can visit this Sunday afternoon. Please call me first to discuss the options.',
};
export default function LeadForm({ onClose, onSave, busy, error, configured, initial = null }) {
  const [form, setForm] = useState(initial || blank);
  const [errors, setErrors] = useState({});
  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const submit = (analyze) => {
    const parsed = intakeSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path[0],
            issue.code === 'too_big' ? 'This field is too long.' : 'Please fill in this field.',
          ]),
        ),
      );
      return;
    }
    setErrors({});
    onSave(parsed.data, analyze);
  };
  const field = (name, label, placeholder, maxLength) => (
    <label className="form-field">
      {label}
      <input
        name={name}
        value={form[name]}
        placeholder={placeholder}
        onChange={change}
        maxLength={maxLength}
        required
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `error-${name}` : undefined}
      />
      {errors[name] && (
        <span id={`error-${name}`} className="field-error">
          {errors[name]}
        </span>
      )}
    </label>
  );
  return (
    <Modal
      title={initial ? 'Edit lead details' : 'A new conversation starts here.'}
      description={
        initial
          ? 'Saving edits clears the previous analysis and chat so they stay aligned with the lead.'
          : 'Capture the essentials. Let AI connect the dots.'
      }
      onClose={busy ? () => {} : onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(true);
        }}
      >
        <div className="form-body">
          {!initial && (
            <button
              className="example-button"
              type="button"
              onClick={() => {
                setForm(example);
                setErrors({});
              }}
              disabled={busy}
            >
              <Sparkles size={14} /> Fill an example lead <ArrowRight size={14} />
            </button>
          )}
          <div className="form-grid">
            {field('name', 'Customer name', 'e.g. Kavya Rao', 100)}
            {field('location', 'Preferred location', 'Area, city', 150)}
            {field('property', 'Property requirement', 'e.g. 2 BHK, ready to move', 350)}
            {field('budget', 'Budget', 'Amount, currency, and inclusions', 150)}
          </div>
          {field('timeline', 'Buying timeline', 'e.g. Within 6 weeks, or not decided yet', 150)}
          <label className="form-field">
            Customer message{' '}
            <textarea
              name="message"
              value={form.message}
              onChange={change}
              placeholder="Paste their inquiry, chat transcript, or your conversation notes…"
              rows={5}
              maxLength={8000}
              required
              aria-invalid={!!errors.message}
            />
            {errors.message && <span className="field-error">{errors.message}</span>}
            <span className="field-hint">
              {form.message.length.toLocaleString()} / 8,000 characters · Include the customer’s own
              words when possible.
            </span>
          </label>
          <p className="form-privacy">
            AI analysis sends these fields to Google Gemini. Use fictional leads for this public
            demo. Records are saved in this browser.
          </p>
          {configured === false && (
            <div className="notice">
              <AlertCircle size={16} />
              <span>
                Gemini isn’t configured yet. Save a draft now and analyze it after connecting the
                API.
              </span>
            </div>
          )}
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
        </div>
        <footer className="modal-footer">
          <button
            className="button secondary"
            type="button"
            onClick={() => submit(false)}
            disabled={busy}
          >
            Save {initial ? 'changes' : 'draft'}
          </button>
          <button className="button primary" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
            {busy ? 'Understanding this lead…' : 'Save & analyze'}
            {!busy && <ArrowRight size={16} />}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
