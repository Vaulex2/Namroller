import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/core/Button';
import { Badge } from '../../components/core/Badge';
import { Input } from '../../components/forms/Input';
import {
  quoteDetail, setQuoteStatus, addQuoteNote, assignQuote, listAdmins, deleteQuote,
  QUOTE_TRANSITIONS,
} from '../../lib/admin';
import { STATUS_TONE } from './statusTones';
import { PriceForm } from './PriceForm';
import { AdminModal } from './shared/AdminModal';
import { AdminSelect } from './shared/AdminSelect';
import { EventText, EventIcon } from './shared/eventText';

/* Full-record modal for one inquiry: contact data, pipeline action buttons
   (only the transitions the server will accept — "completed" is disabled
   with a hint until a price exists), the price form (settable any time once
   accepted), assignee picker, internal notes composer, the quote_events
   audit timeline, other inquiries from the same phone, and delete (the
   replacement for "cancel").

   Every mutation goes through the admin-quotes edge function, then the detail
   is re-fetched so the timeline always reflects the server's record. Changes
   that affect the list (status / assignment / delete) are pushed up via
   onChanged (onChanged(id, null) signals deletion). */
export function QuoteDetail({ id, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const [data, setData] = React.useState(null);
  const [admins, setAdmins] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState('');

  const load = React.useCallback(() => {
    quoteDetail(id)
      .then((d) => { setData(d); setError(''); setLoading(false); })
      .catch(() => { setError(t('admin.detail.loadError')); setLoading(false); });
  }, [id, t]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    listAdmins().then((r) => setAdmins(r.admins)).catch(() => {});
  }, []);

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

  // Wraps a mutation: run, re-fetch the record, surface list-level changes.
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
  const transitions = row ? (QUOTE_TRANSITIONS[row.status] || []) : [];

  const submitNote = () => {
    const body = note.trim();
    if (!body) return;
    run(() => addQuoteNote(id, body));
    setNote('');
  };

  const remove = async () => {
    if (!window.confirm(t('admin.quotes.confirmDelete'))) return;
    setBusy(true); setError('');
    try {
      await deleteQuote(id);
      onChanged?.(id, null);
      toast.success(t('admin.quotes.delete'));
      onClose();
    } catch (e) {
      const msg = e?.message || t('admin.detail.actionError');
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  };

  return (
    <AdminModal
      onClose={onClose}
      closeLabel={t('admin.detail.close')}
      title={loading ? undefined : row ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {row.name}
          <Badge tone={STATUS_TONE[row.status] || 'neutral'} soft>{t(`admin.status.${row.status}`)}</Badge>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-regular)' }}>
            {fmtDate(row.created_at)}
          </span>
        </span>
      ) : undefined}
      footer={!loading && row ? (
        <Button variant="danger" size="sm" disabled={busy} onClick={remove}>
          {t('admin.quotes.delete')}
        </Button>
      ) : undefined}
    >
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.loading')}</p>
      ) : !row ? (
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
            {row.preferred_deadline && (
              <Field label={t('admin.quotes.preferredDeadline')}>{fmtDeadline(row.preferred_deadline)}</Field>
            )}
            {row.note && <Field label={t('admin.quotes.note')}>{row.note}</Field>}
            {row.source && <Field label={t('admin.quotes.source')}>{row.source}</Field>}
          </div>

          {/* Pipeline actions — only the transitions the server will accept.
              "completed" additionally needs a price set first (the 3rd stage
              of the funnel); shown disabled with a hint rather than hidden,
              so it's clear why it's not clickable yet. */}
          {transitions.length > 0 && (
            <Section title={t('admin.detail.pipeline')}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {transitions.map((s) => {
                  const priceMissing = s === 'completed' && project?.price_amount == null;
                  return (
                    <React.Fragment key={s}>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={busy || priceMissing}
                        onClick={() => run(() => setQuoteStatus(id, s), () => ({ status: s }))}
                      >
                        {t(`admin.detail.moveTo`)} {t(`admin.status.${s}`)}
                      </Button>
                      {priceMissing && (
                        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>
                          {t('admin.detail.finishNeedsPrice')}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Price: current value + the form, settable any time once accepted */}
          <Section title={t('admin.detail.price')}>
            {project?.price_amount != null && (
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
            {row.status !== 'new' ? (
              <PriceForm
                quoteId={id}
                busy={busy}
                onSubmitted={(priceAmount, priceCurrency) => {
                  load();
                  // Patch the parent list immediately so its pipeline stepper
                  // shows the new price without waiting for a full refresh.
                  onChanged?.(id, { price_amount: priceAmount, price_currency: priceCurrency });
                }}
                onError={setError}
                size="md"
              />
            ) : (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)' }}>
                {t('admin.detail.priceLocked')}
              </p>
            )}
          </Section>

          {/* Assignment */}
          <Section title={t('admin.detail.assignee')}>
            <AdminSelect
              value={row.assigned_to || ''}
              disabled={busy}
              placeholder={t('admin.detail.unassigned')}
              onChange={(e) => {
                const adminId = e.target.value || null;
                const email = admins.find((a) => a.id === adminId)?.email ?? null;
                run(() => assignQuote(id, adminId), () => ({ assigned_to: adminId, assigned_email: email }));
              }}
              options={admins.map((a) => ({ value: a.id, label: a.email || a.id }))}
            />
          </Section>

          {/* Repeat customer: other inquiries from the same phone */}
          {data.related.length > 0 && (
            <Section title={t('admin.detail.related', { n: data.related.length })}>
              <div style={{ display: 'grid', gap: 6 }}>
                {data.related.map((r) => (
                  <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 'var(--fs-body-sm)' }}>
                    <Badge tone={STATUS_TONE[r.status] || 'neutral'} soft>{t(`admin.status.${r.status}`)}</Badge>
                    <span style={{ color: 'var(--text-body)' }}>{r.product_name || r.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>{fmtDate(r.created_at)}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

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
