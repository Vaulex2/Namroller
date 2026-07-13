import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/core/Button';
import { Input } from '../../components/forms/Input';
import { Icon } from '../Icon';
import { AdminSelect } from './shared/AdminSelect';
import { IconPicker } from './shared/IconPicker';
import { PRODUCT_ICON_OPTIONS } from './shared/constants';
import { createProduct, updateProduct, uploadProductImage, productRowImageUrl, ProductIdTakenError } from '../../lib/products';

const CATEGORIES = ['Idlers', 'Pulleys', 'Systems'];
const CONTENT_LANGS = ['ru', 'uz'];

const emptySpec = () => ({ label: '', value: '', unit: '' });
const emptyStep = () => ({ icon: PRODUCT_ICON_OPTIONS[0], title: { ru: '', uz: '' }, text: { ru: '', uz: '' } });

// DB rows may have partial/legacy shapes (e.g. a step saved before both
// languages existed) — always normalize to the full {ru,uz} shape so every
// input below has a defined value to control.
const normalizeStep = (s) => ({
  icon: s.icon || PRODUCT_ICON_OPTIONS[0],
  title: { ru: s.title?.ru ?? '', uz: s.title?.uz ?? '' },
  text: { ru: s.text?.ru ?? '', uz: s.text?.uz ?? '' },
});

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function textareaStyle(hasError) {
  return {
    padding: '10px 12px', minHeight: 84, resize: 'vertical', width: '100%',
    border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)',
    color: 'var(--text-strong)', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)',
    boxSizing: 'border-box',
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

function Section({ title, hint, children }) {
  return (
    <div>
      <div style={fieldLabelStyle()}>{title}</div>
      {hint && <p style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>{hint}</p>}
      {children}
    </div>
  );
}

/* Language pill toggle for the bilingual content section below — switches
   which language's text is shown/edited for overview/process/features/
   applications. This is NOT the admin panel's own UI language (that's
   AdminLangSwitcher in AdminDashboard.jsx); it's independent local state, so
   authoring in Uzbek never changes the surrounding form's own language. */
function ContentLangToggle({ lang, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', overflow: 'hidden',
    }}>
      {CONTENT_LANGS.map((l, idx) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            style={{
              padding: '6px 14px', cursor: 'pointer',
              background: active ? 'var(--nr-accent)' : 'transparent',
              color: active ? 'var(--white)' : 'var(--text-muted)',
              border: 'none', borderLeft: idx > 0 ? '1px solid var(--border-default)' : 'none',
              fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
              fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

// One process/feature step: icon picker + title + description for the
// active language. The step list itself (count, icon, order) is shared
// across languages — only title/text vary — so RU and UZ can never end up
// with a different number of steps the way the old comma-list-of-icon-names
// zipped against a separate i18n array could.
function StepEditor({ steps, setSteps, lang, addLabel, titlePh, textPh }) {
  const update = (i, patch) => setSteps((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const updateField = (i, field, value) => update(i, { [field]: { ...steps[i][field], [lang]: value } });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          display: 'grid', gap: 8, padding: 12,
          border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <IconPicker value={s.icon} onChange={(icon) => update(i, { icon })} />
            <Button variant="outline" size="sm" onClick={() => setSteps((rows) => rows.filter((_, idx) => idx !== i))}>
              <Icon name="trash" size={14} />
            </Button>
          </div>
          <Input
            value={s.title[lang]}
            onChange={(e) => updateField(i, 'title', e.target.value)}
            placeholder={titlePh}
          />
          <textarea
            style={textareaStyle(false)}
            value={s.text[lang]}
            onChange={(e) => updateField(i, 'text', e.target.value)}
            placeholder={textPh}
          />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setSteps((rows) => [...rows, emptyStep()])} style={{ justifySelf: 'start' }}>
        {addLabel}
      </Button>
    </div>
  );
}

// Repeatable single-line rows for one language's applications list.
function ListEditor({ items, onChange, addLabel, placeholder }) {
  const update = (i, value) => onChange(items.map((v, idx) => (idx === i ? value : v)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((v, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Input value={v} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} />
          </div>
          <Button variant="outline" size="sm" onClick={() => remove(i)}>
            <Icon name="trash" size={14} />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, ''])} style={{ justifySelf: 'start' }}>
        {addLabel}
      </Button>
    </div>
  );
}

/* Create/edit form for a catalog product, rendered inside AdminModal.
   `id` auto-fills from Name (slugified) until the admin types into the id
   field directly, then stays put — no more hand-typing a valid slug from
   scratch. Overview/process/features/applications are authored in RU + UZ
   (the admin panel's own language scope — see supabase/schema/products.sql
   for why EN/ZH/FA aren't editable here) via the language toggle below;
   process/feature icons are picked visually (IconPicker), not typed. */
export function ProductForm({ initial, onSaved, onCancel }) {
  const { t } = useTranslation();
  const isEdit = !!initial;
  const [id, setId] = React.useState(initial?.id ?? '');
  const [idTouched, setIdTouched] = React.useState(isEdit);
  const [name, setName] = React.useState(initial?.name ?? '');
  const [blurb, setBlurb] = React.useState(initial?.blurb ?? '');
  const [icon, setIcon] = React.useState(initial?.icon ?? PRODUCT_ICON_OPTIONS[0]);
  const [cat, setCat] = React.useState(initial?.cat ?? CATEGORIES[0]);
  const [diameter, setDiameter] = React.useState(initial?.diameter ?? '');
  const [load, setLoad] = React.useState(initial?.load ?? '');
  const [published, setPublished] = React.useState(initial?.published ?? true);
  const [specs, setSpecs] = React.useState(initial?.specs?.length ? initial.specs : [emptySpec()]);
  const [imagePath, setImagePath] = React.useState(initial?.image ?? null);
  const [imageFile, setImageFile] = React.useState(null);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [idTaken, setIdTaken] = React.useState(false);

  const [contentLang, setContentLang] = React.useState('ru');
  const [overview, setOverview] = React.useState({ ru: initial?.overview?.ru ?? '', uz: initial?.overview?.uz ?? '' });
  const [process, setProcess] = React.useState((initial?.process ?? []).map(normalizeStep));
  const [features, setFeatures] = React.useState((initial?.features ?? []).map(normalizeStep));
  const [applications, setApplications] = React.useState({
    ru: initial?.applications?.ru ?? [],
    uz: initial?.applications?.uz ?? [],
  });

  const idValid = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
  const canSave = idValid && name.trim() && blurb.trim() && !uploadingImage && !saving;

  const changeName = (value) => {
    setName(value);
    if (!isEdit && !idTouched) setId(slugify(value));
  };
  const changeId = (value) => {
    setIdTouched(true);
    setId(value.toLowerCase());
    setIdTaken(false);
  };

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
      const trimStep = (s) => ({
        icon: s.icon,
        title: { ru: s.title.ru.trim(), uz: s.title.uz.trim() },
        text: { ru: s.text.ru.trim(), uz: s.text.uz.trim() },
      });
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
        overview: { ru: overview.ru.trim(), uz: overview.uz.trim() },
        process: process.map(trimStep).filter((s) => s.title.ru || s.title.uz),
        features: features.map(trimStep).filter((s) => s.title.ru || s.title.uz),
        applications: {
          ru: applications.ru.map((a) => a.trim()).filter(Boolean),
          uz: applications.uz.map((a) => a.trim()).filter(Boolean),
        },
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
      <div style={{ display: 'grid', gap: 24 }}>
        {/* Basic info */}
        <div style={{ display: 'grid', gap: 16 }}>
          <Input label={t('admin.products.name')} value={name} onChange={(e) => changeName(e.target.value)} required autoFocus />

          <div>
            <Input
              label={t('admin.products.id')}
              value={id}
              onChange={(e) => changeId(e.target.value)}
              placeholder="trough-idler"
              disabled={isEdit}
              error={!isEdit && idTaken ? t('admin.products.idTaken') : !isEdit && id && !idValid ? t('admin.products.idInvalid') : undefined}
              hint={isEdit ? t('admin.products.idLocked') : t('admin.products.idHint')}
            />
          </div>

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
              <IconPicker value={icon} onChange={setIcon} />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <Input label={t('admin.products.diameter')} value={diameter} onChange={(e) => setDiameter(e.target.value)} placeholder="89–159" />
            <Input label={t('admin.products.load')} value={load} onChange={(e) => setLoad(e.target.value)} placeholder="1,200" />
          </div>
        </div>

        {/* Image */}
        <Section title={t('admin.products.image')}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {previewUrl && (
              <img src={previewUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }} />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => pickImage(e.target.files?.[0] || null)}
              style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)' }}
            />
            {uploadingImage && <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{t('admin.products.uploading')}</span>}
          </div>
        </Section>

        {/* Specs */}
        <Section title={t('admin.products.specs')}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 80px auto', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
              <span>{t('admin.products.specLabel')}</span>
              <span>{t('admin.products.specValue')}</span>
              <span>{t('admin.products.specUnit')}</span>
              <span />
            </div>
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
        </Section>

        {/* Bilingual content */}
        <div style={{ display: 'grid', gap: 16, padding: 16, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={fieldLabelStyle()}>{t('admin.products.content')}</span>
            <ContentLangToggle lang={contentLang} onChange={setContentLang} />
          </div>

          <Section title={t('admin.products.overview')}>
            <textarea
              style={textareaStyle(false)}
              value={overview[contentLang]}
              onChange={(e) => setOverview((o) => ({ ...o, [contentLang]: e.target.value }))}
              placeholder={t('admin.products.overviewPh')}
            />
          </Section>

          <Section title={t('admin.products.process')}>
            <StepEditor
              steps={process}
              setSteps={setProcess}
              lang={contentLang}
              addLabel={t('admin.products.addStep')}
              titlePh={t('admin.products.stepTitlePh')}
              textPh={t('admin.products.stepTextPh')}
            />
          </Section>

          <Section title={t('admin.products.features')}>
            <StepEditor
              steps={features}
              setSteps={setFeatures}
              lang={contentLang}
              addLabel={t('admin.products.addFeature')}
              titlePh={t('admin.products.stepTitlePh')}
              textPh={t('admin.products.stepTextPh')}
            />
          </Section>

          <Section title={t('admin.products.applications')}>
            <ListEditor
              items={applications[contentLang]}
              onChange={(items) => setApplications((a) => ({ ...a, [contentLang]: items }))}
              addLabel={t('admin.products.addApplication')}
              placeholder={t('admin.products.applicationPh')}
            />
          </Section>
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
