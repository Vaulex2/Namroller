import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/core/Button';
import { Input } from '../../components/forms/Input';
import { Card } from '../../components/surfaces/Card';
import {
  listAllVideos, uploadCapabilityVideo, setPublished, reorderVideos, deleteVideo,
  videoRowPublicUrls, VIDEO_MIME, POSTER_MIME,
} from '../../lib/videos';
import { useAdminResource } from '../../hooks/useAdminResource';
import { SortableList, DragHandle } from './shared/SortableList';

const fetchVideos = () => listAllVideos();

/* Imkoniyatlar video management: upload (video + optional poster + title),
   publish/unpublish, reorder, delete. All writes are gated by storage + table
   RLS admin policies. */
export function VideosPanel() {
  const { t } = useTranslation();
  const [busyId, setBusyId] = React.useState(null);

  // Upload form state
  const [video, setVideo] = React.useState(null);
  const [poster, setPoster] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const videoRef = React.useRef(null);
  const posterRef = React.useRef(null);

  const { data, setData, loading, error, reload } = useAdminResource(fetchVideos);
  const rows = data ?? [];

  React.useEffect(() => { if (error) toast.error(t('admin.videos.loadError')); }, [error, t]);

  const upload = async (e) => {
    e.preventDefault();
    if (!video) { toast.error(t('admin.videos.needVideo')); return; }
    setUploading(true);
    try {
      await uploadCapabilityVideo({ video, poster, title });
      setVideo(null); setPoster(null); setTitle('');
      if (videoRef.current) videoRef.current.value = '';
      if (posterRef.current) posterRef.current.value = '';
      toast.success(t('admin.videos.upload'));
      reload();
    } catch (err) {
      toast.error(err?.message || t('admin.videos.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const togglePublish = async (row) => {
    setBusyId(row.id);
    try {
      await setPublished(row.id, !row.published);
      setData((rs) => rs.map((r) => (r.id === row.id ? { ...r, published: !row.published } : r)));
    }
    catch { toast.error(t('admin.videos.actionError')); }
    finally { setBusyId(null); }
  };

  const handleReorder = async (orderedIds) => {
    const prev = data;
    // Optimistic: reflect the new order instantly, revert on failure.
    setData((rs) => orderedIds.map((id) => rs.find((r) => r.id === id)));
    try {
      await reorderVideos(orderedIds);
    } catch {
      setData(prev);
      toast.error(t('admin.videos.actionError'));
    }
  };

  const remove = async (row) => {
    if (!window.confirm(t('admin.videos.confirmDelete'))) return;
    setBusyId(row.id);
    try {
      await deleteVideo(row);
      setData((rs) => rs.filter((r) => r.id !== row.id));
      toast.success(t('admin.videos.delete'));
    }
    catch { toast.error(t('admin.videos.actionError')); }
    finally { setBusyId(null); }
  };

  return (
    <div>
      {/* Upload form */}
      <Card accentBar padding={24} style={{ marginBottom: 24 }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)',
          textTransform: 'uppercase', fontSize: 18, color: 'var(--text-strong)', margin: '0 0 16px',
        }}>
          {t('admin.videos.uploadTitle')}
        </h2>
        <form onSubmit={upload}>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={fileFieldStyle}>
              <span style={fileLabelStyle}>{t('admin.videos.videoFile')} *</span>
              <input
                ref={videoRef}
                type="file"
                accept={VIDEO_MIME.join(',')}
                onChange={(e) => setVideo(e.target.files?.[0] || null)}
                style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)' }}
              />
            </label>
            <label style={fileFieldStyle}>
              <span style={fileLabelStyle}>{t('admin.videos.posterFile')}</span>
              <input
                ref={posterRef}
                type="file"
                accept={POSTER_MIME.join(',')}
                onChange={(e) => setPoster(e.target.files?.[0] || null)}
                style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)' }}
              />
            </label>
          </div>
          <div style={{ marginTop: 16, maxWidth: 360 }}>
            <Input
              label={t('admin.videos.titleField')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('admin.videos.titlePh')}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <Button type="submit" variant="primary" disabled={uploading || !video}>
              {uploading ? t('admin.videos.uploading') : t('admin.videos.upload')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Existing videos — drag the grip handle to reorder */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.loading')}</p>
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.videos.empty')}</p>
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <SortableList
            items={rows}
            itemKey={(row) => row.id}
            onReorder={handleReorder}
            direction="grid"
            renderItem={(row, { dragHandleProps }) => {
              const { src, poster: posterUrl } = videoRowPublicUrls(row);
              return (
                <Card variant="outline" padding={0} style={{ opacity: row.published ? 1 : 0.6 }}>
                  <video
                    src={src || undefined}
                    poster={posterUrl || undefined}
                    controls
                    playsInline
                    preload="none"
                    style={{ display: 'block', width: '100%', aspectRatio: '9 / 16', objectFit: 'cover', background: 'var(--slate-900)' }}
                  />
                  <div style={{ padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <DragHandle {...dragHandleProps} />
                      {row.title && <div style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-semibold)' }}>{row.title}</div>}
                    </div>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginBottom: 10 }}>
                      {row.published ? t('admin.videos.published') : t('admin.videos.hidden')}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Button variant="outline" size="sm" disabled={busyId === row.id} onClick={() => togglePublish(row)}>
                        {row.published ? t('admin.videos.hide') : t('admin.videos.publish')}
                      </Button>
                      <Button variant="danger" size="sm" disabled={busyId === row.id} onClick={() => remove(row)}>
                        {t('admin.videos.delete')}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

const fileFieldStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
const fileLabelStyle = {
  fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
  fontSize: 'var(--fs-overline)', letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--text-muted)',
};
