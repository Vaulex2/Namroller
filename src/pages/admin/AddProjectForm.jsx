import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/core/Button';
import { Input } from '../../components/forms/Input';
import { createManualProject } from '../../lib/admin';
import { AdminSelect } from './shared/AdminSelect';

/* Create form for a lead sourced from another platform (Instagram, Telegram,
   OLX, a phone call, …), rendered inside AdminModal from JournalPanel. Unlike
   ProductForm this has no edit mode — a logged lead is edited afterward
   through JournalDetail (deadline/price/stage/notes), same as any other
   project. */
export function AddProjectForm({ onSaved, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [productName, setProductName] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [source, setSource] = React.useState('');
  const [note, setNote] = React.useState('');
  const [priceAmount, setPriceAmount] = React.useState('');
  const [priceCurrency, setPriceCurrency] = React.useState('UZS');
  const [deadline, setDeadline] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const canSave = name.trim().length > 0 && phone.trim().length >= 3 && !saving;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        productName: productName.trim() || undefined,
        quantity: quantity.trim() || undefined,
        address: address.trim() || undefined,
        source: source.trim() || undefined,
        note: note.trim() || undefined,
        deadline: deadline || undefined,
      };
      const amount = Number(String(priceAmount).replace(',', '.'));
      if (priceAmount.trim() && Number.isFinite(amount) && amount > 0) {
        payload.priceAmount = amount;
        payload.priceCurrency = priceCurrency;
      }
      await createManualProject(payload);
      toast.success(t('admin.journal.created'));
      onSaved();
    } catch (err) {
      toast.error(err?.message || t('admin.journal.createError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)' }}>
        {t('admin.journal.addProjectIntro')}
      </p>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Input label={t('admin.journal.form.name')} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <Input label={t('admin.quotes.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" required />
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Input label={t('admin.quotes.email')} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <Input
            label={t('admin.quotes.source')}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={t('admin.journal.form.sourcePh')}
          />
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Input label={t('admin.quotes.product')} value={productName} onChange={(e) => setProductName(e.target.value)} />
          <Input label={t('admin.quotes.quantity')} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>

        <Input label={t('admin.quotes.address')} value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label={t('admin.quotes.note')} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
            <span style={{
              display: 'block', marginBottom: 5,
              fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
              fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              {t('admin.detail.price')}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Input value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} placeholder={t('admin.detail.amountPh')} inputMode="decimal" />
              </div>
              <AdminSelect
                value={priceCurrency}
                onChange={(e) => setPriceCurrency(e.target.value)}
                options={[{ value: 'UZS', label: 'UZS' }, { value: 'USD', label: 'USD' }]}
              />
            </div>
          </div>
          <Input
            label={t('admin.journal.deadline')}
            type="date"
            lang="en-CA"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Button type="submit" variant="primary" disabled={!canSave}>
          {saving ? t('admin.products.saving') : t('admin.products.save')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('admin.detail.close')}
        </Button>
      </div>
    </form>
  );
}
