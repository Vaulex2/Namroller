import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/core/Button';
import { Badge } from '../../components/core/Badge';
import { Input } from '../../components/forms/Input';
import {
  quoteDetail, setQuoteStatus, addQuoteNote, setProjectDeadline, setProjectStatus,
} from '../../lib/admin';
import { STATUS_TONE } from './statusTones';
import { PriceForm } from './PriceForm';
import { AdminModal } from './shared/AdminModal';
import { EventText, EventIcon } from './shared/eventText';

/* Journal's project-detail modal — the same underlying record as QuoteDetail
   (quoteDetail(id): row + project + events), but surfaced around the
   project's own stage (in_progress/completed/cancelled) and deadline rather
   than the inquiry intake pipeline. No delete here — hard-delete stays
   exclusively in the Requests tab so Journal has no destructive actions. */
export function JournalDetail({ id, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [deadline, setDeadline] = React.useState('');

  const load = React.useCallback(() => {
    quoteDetail(id)
      .then((d) => { setData(d); setDeadline(d.project?.deadline || ''); setError(''); setLoading(false); })
      .catch(() => { setError(t('admin.detail.loadError')); setLoading(false); });
  }, [id, t]);

  React.useEffect(() => { load(); }, [load]);

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU'); }
    catch { return iso; }
  };
  const fmtDeadline = (isoDate) => {
    try { return new Date(isoDate + 'T00:00:00').toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU'); }
    catch { return isoDate; }
  };
  const fmtMoney = (value, cur) => {
    try {
      return new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', {
        maximumFractionDigits: 2,
      }).format(value) + ' ' + cur;
    } catch { return `${value} ${cur}`; }
  };

  const run = async (fn, patchAfter) => {
    setBusy(true); setError('');
    try {
      await fn();
      load();
      if (patchAfter) onChanged?.(id, patchAfter());
    } catch (e) {
      const msg = e?.message || t('admin.detail.actionError');
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const row = data?.row;
  const project = data?.project;

  const submitNote = () => {
    const body = note.trim();
    if (!body) return;
    run(() => addQuoteNote(id, body));
    setNote('');
  };

  const saveDeadline = () => {
    run(() => setProjectDeadline(id, deadline || null));
  };

  const cancelProject = () => {
    if (!window.confirm(t('admin.journal.confirmCancel'))) return;
    run(() => setProjectStatus(id, 'cancelled'), () => ({ status: 'cancelled' }));
  };

  const priceMissing = project?.price_amount == null;

  return (
    <AdminModal
      onClose={onClose}
      closeLabel={t('admin.detail.close')}
      title={loading ? undefined : row ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {row.name}
          {project && <Badge tone={STATUS_TONE[project.status] || 'neutral'} soft>{t(`admin.status.${project.status}`)}</Badge>}
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-regular)' }}>
            {fmtDate(row.created_at)}
          </span>
        </span>
      ) : undefined}
    >
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.loading')}</p>
      ) : !row || !project ? (
        <p style={{ color: 'var(--danger)' }}>{error || t('admin.detail.loadError')}</p>
      ) : (
        <>
          {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

          {/* Contact / request data */}
          <div style={{ display: 'grid', gap: 6, fontSize: 'var(--fs-body-sm)', marginBottom: 20 }}>
            <Field label={t('admin.quotes.phone')}><a href={'tel:' + row.phone} style={linkStyle}>{row.phone}</a></Field>
            {row.email && <Field label={t('admin.quotes.email')}><a href={'mailto:' + row.email} style={linkStyle}>{row.email}</a></Field>}
            {row.product_name && <Field label={t('admin.quotes.product')}>{row.product_name}</Field>}
            {row.quantity && <Field label={t('admin.quotes.quantity')}>{row.quantity}</Field>}
            {row.address && <Field label={t('admin.quotes.address')}>{row.address}</Field>}
            {row.assigned_email && <Field label={t('admin.quotes.assignee')}>{row.assigned_email}</Field>}
          </div>

          {/* Deadline */}
          <Section title={t('admin.journal.deadline')}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ width: 180 }}>
                <Input
                  type="date"
                  lang="en-CA"
                  value={deadline}
                  disabled={busy}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <Button variant="outline" size="md" disabled={busy} onClick={saveDeadline}>
                {t('admin.journal.deadlineSet')}
              </Button>
              {project.deadline && (
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)' }}>
                  {t('admin.journal.deadlineCurrent', { date: fmtDeadline(project.deadline) })}
                </span>
              )}
            </div>
          </Section>

          {/* Price */}
          <Section title={t('admin.detail.price')}>
            {project.price_amount != null && (
              <p style={{ margin: '0 0 10px', color: 'var(--text-body)', fontSize: 'var(--fs-body-sm)' }}>
                <strong style={{ color: 'var(--text-strong)', fontSize: 'var(--fs-body-lg)' }}>
                  {fmtMoney(project.price_amount, project.price_currency)}
                </strong>
                {project.priced_by_email && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {' '}· {t('admin.detail.pricedBy', { email: project.priced_by_email, date: fmtDate(project.priced_at) })}
                  </span>
                )}
              </p>
            )}
            <PriceForm
              quoteId={id}
              busy={busy}
              onSubmitted={() => load()}
              onError={setError}
              size="md"
            />
          </Section>

          {/* Project stage actions */}
          <Section title={t('admin.journal.stage')}>
            {project.status === 'in_progress' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={busy || priceMissing}
                  onClick={() => run(() => setQuoteStatus(id, 'completed'), () => ({ status: 'completed' }))}
                >
                  {t('admin.journal.markCompleted')}
                </Button>
                {priceMissing && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>
                    {t('admin.detail.finishNeedsPrice')}
                  </span>
                )}
                <Button variant="danger" size="sm" disabled={busy} onClick={cancelProject}>
                  {t('admin.journal.cancelProject')}
                </Button>
              </div>
            )}
            {project.status === 'cancelled' && (
              <Button
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => run(() => setProjectStatus(id, 'in_progress'), () => ({ status: 'in_progress' }))}
              >
                {t('admin.journal.reactivate')}
              </Button>
            )}
            {project.status === 'completed' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-body)', fontSize: 'var(--fs-body-sm)' }}>
                  {t('admin.journal.completedOn', { date: fmtDate(project.completed_at) })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => run(() => setQuoteStatus(id, 'accepted'), () => ({ status: 'in_progress' }))}
                >
                  {t('admin.detail.moveTo')} {t('admin.status.in_progress')}
                </Button>
              </div>
            )}
          </Section>

          {/* Internal notes composer */}
          <Section title={t('admin.detail.addNote')}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('admin.detail.notePh')}
                  maxLength={2000}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitNote(); }}
                />
              </div>
              <Button variant="outline" size="md" disabled={busy || !note.trim()} onClick={submitNote}>
                {t('admin.detail.noteAdd')}
              </Button>
            </div>
          </Section>

          {/* Audit timeline */}
          <Section title={t('admin.detail.timeline')}>
            {data.events.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)' }}>
                {t('admin.detail.timelineEmpty')}
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {data.events.map((ev) => (
                  <div key={ev.id} style={{ display: 'flex', gap: 10, fontSize: 'var(--fs-body-sm)' }}>
                    <span aria-hidden style={{ width: 18, display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
                      <EventIcon type={ev.type} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ color: 'var(--text-body)' }}>
                        <EventText ev={ev} t={t} fmtMoney={fmtMoney} />
                      </span>
                      <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>
                        {ev.actor_email || '—'} · {fmtDate(ev.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </AdminModal>
  );
}

const linkStyle = { color: 'var(--nr-accent)', textDecoration: 'none' };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
        fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: 8,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 84 }}>{label}:</span>
      <span style={{ color: 'var(--text-body)', wordBreak: 'break-word' }}>{children}</span>
    </div>
  );
}
