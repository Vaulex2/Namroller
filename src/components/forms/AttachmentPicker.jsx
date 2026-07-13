import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../pages/Icon';
import {
  MAX_ATTACHMENTS, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES,
  ATTACHMENT_IMAGE_MIME, ATTACHMENT_VIDEO_MIME, ATTACHMENT_ACCEPT,
} from '../../lib/quotes';

const fieldLabel = {
  display: 'block', marginBottom: 6,
  fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
  fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

// Derived from the byte limits (not hardcoded in the translation strings) so
// the hint/error text can never drift out of sync with the actual caps.
const MAX_IMAGE_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));
const MAX_VIDEO_MB = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));

/* Queues photos/videos locally (no network) — nothing uploads until the form
   actually submits (see uploadQuoteAttachments in lib/quotes.ts), so removing
   a file here never needs a delete call against the write-only storage
   bucket. Renders as a picker button + thumbnail strip; `files` / `onChange`
   are controlled so the parent form can include the queue in its own submit
   flow and reset it after success. */
export function AttachmentPicker({ files, onChange, disabled }) {
  const { t } = useTranslation();
  const inputRef = React.useRef(null);
  const [error, setError] = React.useState('');

  // Object URLs for image previews, kept in sync with `files` here (not
  // computed during render, which isn't allowed to touch refs) — created for
  // any new file, revoked for any file that dropped out of the list or on
  // unmount, so we don't leak blob: memory across a long form session.
  const [previews, setPreviews] = React.useState(new Map());
  const previewsRef = React.useRef(previews);
  React.useEffect(() => {
    setPreviews((prev) => {
      const next = new Map();
      for (const file of files) {
        if (ATTACHMENT_IMAGE_MIME.includes(file.type)) {
          next.set(file, prev.get(file) ?? URL.createObjectURL(file));
        }
      }
      for (const [file, url] of prev) {
        if (!next.has(file)) URL.revokeObjectURL(url);
      }
      previewsRef.current = next;
      return next;
    });
  }, [files]);
  React.useEffect(() => () => {
    previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addFiles = (picked) => {
    const list = Array.from(picked);
    const room = MAX_ATTACHMENTS - files.length;
    if (room <= 0) {
      setError(t('attachments.tooMany', { n: MAX_ATTACHMENTS }));
      return;
    }
    // Picking more than fits: report it rather than silently dropping the
    // overflow — the per-file errors below are the fallback when it fits.
    const overflow = list.length > room;
    let lastFileError = '';
    const accepted = [];
    for (const file of list.slice(0, room)) {
      const isImage = ATTACHMENT_IMAGE_MIME.includes(file.type);
      const isVideo = ATTACHMENT_VIDEO_MIME.includes(file.type);
      if (!isImage && !isVideo) {
        lastFileError = t('attachments.badType');
        continue;
      }
      const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > max) {
        lastFileError = isVideo
          ? t('attachments.videoTooBig', { mb: MAX_VIDEO_MB })
          : t('attachments.imageTooBig', { mb: MAX_IMAGE_MB });
        continue;
      }
      accepted.push(file);
    }
    setError(overflow ? t('attachments.tooMany', { n: MAX_ATTACHMENTS }) : lastFileError);
    if (accepted.length) onChange([...files, ...accepted]);
  };

  // No manual URL.revokeObjectURL here — the effect above reconciles
  // `previews` against the new `files` prop and revokes whatever dropped out.
  const remove = (file) => onChange(files.filter((f) => f !== file));

  return (
    <div>
      <span style={fieldLabel}>{t('attachments.label')}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {files.map((file, i) => {
          const preview = previews.get(file);
          return (
            <div
              key={i}
              style={{
                position: 'relative', width: 64, height: 64, flexShrink: 0,
                borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                border: '1px solid var(--border-default)',
                background: 'var(--surface-sunken)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title={file.name}
            >
              {preview ? (
                <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Icon name="video" size={22} color="var(--text-muted)" />
              )}
              <button
                type="button"
                onClick={() => remove(file)}
                disabled={disabled}
                aria-label={t('attachments.remove')}
                style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(2,6,23,0.72)', color: 'var(--white)',
                  border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          );
        })}

        {files.length < MAX_ATTACHMENTS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            style={{
              width: 64, height: 64, flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-default)',
              background: 'transparent', color: 'var(--text-muted)',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <Icon name="upload" size={18} />
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('attachments.add')}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        multiple
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        style={{ display: 'none' }}
      />

      <p style={{ margin: '6px 0 0', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
        {t('attachments.hint', { n: MAX_ATTACHMENTS, imageMb: MAX_IMAGE_MB, videoMb: MAX_VIDEO_MB })}
      </p>
      {error && (
        <p style={{ margin: '4px 0 0', fontSize: 'var(--fs-caption)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
