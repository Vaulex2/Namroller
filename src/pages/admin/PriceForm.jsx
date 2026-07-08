import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/core/Button';
import { Input } from '../../components/forms/Input';
import { setQuotePrice } from '../../lib/admin';
import { AdminSelect } from './shared/AdminSelect';

/* Shared price-entry widget: amount + currency + submit, with the same
   validation the detail modal always used. Used both inline in a list row
   (size="sm") and inside the QuoteDetail modal (size="md") so there's one
   implementation of "how a price gets set", not two. Owns its own busy state
   for its own submit click; a parent-level `busy` flag (e.g. another
   in-flight mutation on the same row) can additionally disable it. */
export function PriceForm({ quoteId, onSubmitted, onError, busy = false, size = 'md', autoFocus = false }) {
  const { t } = useTranslation();
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState('UZS');
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    const value = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      onError?.(t('admin.detail.priceInvalid'));
      return;
    }
    setSubmitting(true);
    try {
      await setQuotePrice(quoteId, value, currency);
      setAmount('');
      // Round the same way the server does (numeric(14,2)) so callers that
      // patch local state with these values match what actually got stored.
      onSubmitted?.(Math.round(value * 100) / 100, currency);
    } catch (e) {
      onError?.(e?.message || t('admin.detail.actionError'));
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = busy || submitting;
  const amountWidth = size === 'sm' ? 140 : 180;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ width: amountWidth }}>
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t('admin.detail.amountPh')}
          inputMode="decimal"
          autoFocus={autoFocus}
          onKeyDown={(e) => { if (e.key === 'Enter' && amount.trim()) submit(); }}
        />
      </div>
      <AdminSelect
        size={size}
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        options={[{ value: 'UZS', label: 'UZS' }, { value: 'USD', label: 'USD' }]}
      />
      <Button variant="primary" size={size === 'sm' ? 'sm' : 'md'} disabled={disabled || !amount.trim()} onClick={submit}>
        {t('admin.detail.setPrice')}
      </Button>
    </div>
  );
}
