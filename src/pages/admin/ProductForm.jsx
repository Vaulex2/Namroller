import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/core/Button';
import { Input } from '../../components/forms/Input';
import { Icon } from '../Icon';
import { AdminSelect } from './shared/AdminSelect';
import { createProduct, updateProduct, uploadProductImage, productRowImageUrl, ProductIdTakenError } from '../../lib/products';

const CATEGORIES = ['Idlers', 'Pulleys', 'Systems'];

// Curated subset of the shared Icon set relevant to product catalog imagery
// (full set lives in src/pages/Icon.jsx).
const ICON_OPTIONS = [
  'package', 'cog', 'shield', 'ruler', 'gauge', 'factory', 'truck', 'wrench',
  'flame', 'check', 'cube', 'layers', 'grid',
];

const emptySpec = () => ({ label: '', value: '', unit: '' });

function textareaStyle(hasError) {
  return {
    padding: '10px 12px', minHeight: 84, resize: 'vertical',
    border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)',
    color: 'var(--text-strong)', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)',
  };
}

function fieldLabelStyle() {
  return {
    display: 'block', marginBottom: 5,
    fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
    fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)',
  };
}

/* Create/edit form for a catalog product, rendered inside AdminModal.
   `id` is immutable once created (it doubles as the i18n key `pd.<id>.*` and
   as the free-text, non-FK `product_id` snapshot on historic quotes).
   Specs are edited as a repeatable label/value/unit row list; process/feature
   icons as a comma-separated list of icon names (kept simple deliberately —
   see the inline hint about matching i18n prose array lengths). */
export function ProductForm({ initial, onSaved, onCancel }) {
  const { t } = useTranslation();
  const isEdit = !!initial;
  const [id, setId] = React.useState(initial?.id ?? '');
  const [name, setName] = React.useState(initial?.name ?? '');
  const [blurb, setBlurb] = React.useState(initial?.blurb ?? '');
  const [icon, setIcon] = React.useState(initial?.icon ?? ICON_OPTIONS[0]);
  const [cat, setCat] = React.useState(initial?.cat ?? CATEGORIES[0]);
  const [diameter, setDiameter] = React.useState(initial?.diameter ?? '');
  const [load, setLoad] = React.useState(initial?.load ?? '');
  const [published, setPublished] = React.useState(initial?.published ?? true);
  const [specs, setSpecs] = React.useState(initial?.specs?.length ? initial.specs : [emptySpec()]);
  const [processIcons, setProcessIcons] = React.useState((initial?.process_icons ?? []).join(', '));
  const [featureIcons, setFeatureIcons] = React.useState((initial?.feature_icons ?? []).join(', '));
  const [imagePath, setImagePath] = React.useState(initial?.image ?? null);
  const [imageFile, setImageFile] = React.useState(null);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [idTaken, setIdTaken] = React.useState(false);
  const fileRef = React.useRef(null);

  const idValid = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
  const canSave = idValid && name.trim() && blurb.trim() && !uploadingImage && !saving;

  const pickImage = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const path = await uploadProductImage(file);
      setImagePath(path);
      setImageFile(file);
    } catch (err) {
      toast.error(err?.message || t('admin.products.imageError'));
    } finally {
      setUploadingImage(false);
    }
  };

  const updateSpec = (i, patch) => {
    setSpecs((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addSpec = () => setSpecs((rows) => [...rows, emptySpec()]);
  const removeSpec = (i) => setSpecs((rows) => rows.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        blurb: blurb.trim(),
        icon,
        image: imagePath,
        cat,
        diameter: diameter.trim() || null,
        load: load.trim() || null,
        specs: specs
          .filter((s) => s.label.trim() && s.value.trim())
          .map((s) => ({ label: s.label.trim(), value: s.value.trim(), ...(s.unit?.trim() ? { unit: s.unit.trim() } : {}) })),
        process_icons: processIcons.split(',').map((s) => s.trim()).filter(Boolean),
        feature_icons: featureIcons.split(',').map((s) => s.trim()).filter(Boolean),
        published,
      };
      if (isEdit) {
        await updateProduct(initial.id, payload);
        toast.success(t('admin.products.saved'));
      } else {
        await createProduct({ id, ...payload, videos: [] });
        toast.success(t('admin.products.created'));
      }
      onSaved();
    } catch (err) {
      if (err instanceof ProductIdTakenError) {
        setIdTaken(true);
        toast.error(t('admin.products.idTaken'));
      } else {
        toast.error(err?.message || t('admin.products.saveError'));
      }
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : productRowImageUrl({ image: imagePath });

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <Input
            label={t('admin.products.id')}
            value={id}
            onChange={(e) => { setId(e.target.value.toLowerCase()); setIdTaken(false); }}
            placeholder="trough-idler"
            disabled={isEdit}
            error={!isEdit && idTaken ? t('admin.products.idTaken') : !isEdit && id && !idValid ? t('admin.products.idInvalid') : undefined}
            hint={isEdit ? t('admin.products.idLocked') : t('admin.products.idHint')}
          />
        </div>

        <Input label={t('admin.products.name')} value={name} onChange={(e) => setName(e.target.value)} required />

        <div>
          <span style={fieldLabelStyle()}>{t('admin.products.blurb')}</span>
          <textarea style={textareaStyle(false)} value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <AdminSelect
            label={t('admin.products.category')}
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: t(`cat.${c}`, c) }))}
          />
          <div>
            <span style={fieldLabelStyle()}>{t('admin.products.icon')}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <AdminSelect
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                options={ICON_OPTIONS.map((i) => ({ value: i, label: i }))}
              />
              <Icon name={icon} size={22} color="var(--nr-accent)" />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <Input label={t('admin.products.diameter')} value={diameter} onChange={(e) => setDiameter(e.target.value)} placeholder="89–159" />
          <Input label={t('admin.products.load')} value={load} onChange={(e) => setLoad(e.target.value)} placeholder="1,200" />
        </div>

        {/* Image */}
        <div>
          <span style={fieldLabelStyle()}>{t('admin.products.image')}</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }} />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => pickImage(e.target.files?.[0] || null)}
              style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)' }}
            />
            {uploadingImage && <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{t('admin.products.uploading')}</span>}
          </div>
        </div>

        {/* Specs */}
        <div>
          <span style={fieldLabelStyle()}>{t('admin.products.specs')}</span>
          <div style={{ display: 'grid', gap: 8 }}>
            {specs.map((s, i) => (
              <div key={i} style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 80px auto', alignItems: 'center' }}>
                <Input value={s.label} onChange={(e) => updateSpec(i, { label: e.target.value })} placeholder={t('admin.products.specLabel')} />
                <Input value={s.value} onChange={(e) => updateSpec(i, { value: e.target.value })} placeholder={t('admin.products.specValue')} />
                <Input value={s.unit} onChange={(e) => updateSpec(i, { unit: e.target.value })} placeholder={t('admin.products.specUnit')} />
                <Button variant="outline" size="sm" onClick={() => removeSpec(i)} disabled={specs.length === 1}>
                  <Icon name="trash" size={14} />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addSpec} style={{ marginTop: 8 }}>
            {t('admin.products.addSpec')}
          </Button>
        </div>

        {/* Process / feature icons */}
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Input
            label={t('admin.products.processIcons')}
            value={processIcons}
            onChange={(e) => setProcessIcons(e.target.value)}
            placeholder="package, cog, flame, check"
            hint={t('admin.products.iconListHint')}
          />
          <Input
            label={t('admin.products.featureIcons')}
            value={featureIcons}
            onChange={(e) => setFeatureIcons(e.target.value)}
            placeholder="shield, gauge, ruler, cog"
            hint={t('admin.products.iconListHint')}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)' }}>
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} style={{ accentColor: 'var(--nr-accent)' }} />
          {t('admin.products.published')}
        </label>
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
