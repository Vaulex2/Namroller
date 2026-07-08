import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/core/Button';
import { Badge } from '../../components/core/Badge';
import { Card } from '../../components/surfaces/Card';
import { Input } from '../../components/forms/Input';
import { Icon } from '../Icon';
import {
  listReviews, setReviewApproved, deleteReview, bulkSetReviewApproved, bulkDeleteReviews,
} from '../../lib/admin';
import { useAdminResource } from '../../hooks/useAdminResource';
import { AdminTable } from './shared/AdminTable';
import { AdminSelect } from './shared/AdminSelect';
import { StarRating } from './shared/StarRating';

const REVIEW_FILTERS = ['all', 'pending', 'approved'];
const SORTS = ['date_desc', 'date_asc', 'rating_desc', 'rating_asc'];
const EMPTY_ROWS = [];

const fetchReviews = () => listReviews();

/* Review moderation: lists ALL reviews (pending + approved). Approving keeps the
   review in the list (its badge flips to "published") so it doesn't disappear;
   un-publishing moves it back to pending; delete removes it permanently. Direct
   table access, gated by RLS admin policies (public.is_admin()). */
export function ReviewsPanel() {
  const { t, i18n } = useTranslation();
  const [busyId, setBusyId] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('date_desc');
  const [selected, setSelected] = React.useState(() => new Set());
  const [bulkBusy, setBulkBusy] = React.useState(false);

  const { data, setData, loading, error, reload } = useAdminResource(fetchReviews);
  const rows = data ?? EMPTY_ROWS;

  React.useEffect(() => { if (error) toast.error(t('admin.reviews.loadError')); }, [error, t]);

  const refresh = () => { setSelected(new Set()); reload(); };

  // Filter (all/pending/approved) + search + sort, entirely in memory.
  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (filter === 'pending' && r.approved) return false;
      if (filter === 'approved' && !r.approved) return false;
      if (!q) return true;
      return [r.name, r.role, r.text].some((v) => v && String(v).toLowerCase().includes(q));
    });
    const sorted = [...filtered];
    if (sort === 'date_asc') sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sort === 'date_desc') sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sort === 'rating_asc') sorted.sort((a, b) => a.rating - b.rating);
    else if (sort === 'rating_desc') sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [rows, filter, query, sort]);

  // Toggle approval in place — the row stays visible, only its status changes.
  const toggleApprove = async (row) => {
    setBusyId(row.id);
    try {
      await setReviewApproved(row.id, !row.approved);
      setData((rs) => rs.map((r) => (r.id === row.id ? { ...r, approved: !row.approved } : r)));
      toast.success(row.approved ? t('admin.reviews.unapprove') : t('admin.reviews.approve'));
    } catch {
      toast.error(t('admin.reviews.actionError'));
      reload(); // resync on failure
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(t('admin.reviews.confirmDelete'))) return;
    setBusyId(row.id);
    try {
      await deleteReview(row.id);
      setData((rs) => rs.filter((r) => r.id !== row.id));
      toast.success(t('admin.reviews.delete'));
    } catch {
      toast.error(t('admin.reviews.actionError'));
      reload();
    } finally {
      setBusyId(null);
    }
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === shown.length ? new Set() : new Set(shown.map((r) => r.id))));
  };

  const bulkApprove = async (approved) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      await bulkSetReviewApproved(ids, approved);
      setData((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, approved } : r)));
      toast.success(t(approved ? 'admin.reviews.bulkApproved' : 'admin.reviews.bulkRejected', { n: ids.length }));
      setSelected(new Set());
    } catch {
      toast.error(t('admin.reviews.actionError'));
      reload();
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkDelete = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(t('admin.reviews.confirmBulkDelete', { n: ids.length }))) return;
    setBulkBusy(true);
    try {
      await bulkDeleteReviews(ids);
      setData((rs) => rs.filter((r) => !ids.includes(r.id)));
      toast.success(t('admin.reviews.bulkDeleted', { n: ids.length }));
      setSelected(new Set());
    } catch {
      toast.error(t('admin.reviews.actionError'));
      reload();
    } finally {
      setBulkBusy(false);
    }
  };

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU'); }
    catch { return iso; }
  };

  return (
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)', marginBottom: 16 }}>
        {t('admin.reviews.intro')}
      </p>

      {/* Search + sort + refresh */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.reviews.searchPh')}
          />
        </div>
        <AdminSelect
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          options={SORTS.map((s) => ({ value: s, label: t(`admin.reviews.sort.${s}`) }))}
        />
        <Button variant="outline" size="md" disabled={loading} onClick={refresh}>
          {t('admin.refresh')}
        </Button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {REVIEW_FILTERS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {t(`admin.reviews.filter_${f}`)}
          </Button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <Card variant="sunken" padding={12} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--text-body)' }}>
              {t('admin.quotes.selected', { n: selected.size })}
            </span>
            <Button variant="primary" size="sm" disabled={bulkBusy} onClick={() => bulkApprove(true)}>
              {t('admin.reviews.bulkApprove')}
            </Button>
            <Button variant="outline" size="sm" disabled={bulkBusy} onClick={() => bulkApprove(false)}>
              {t('admin.reviews.bulkReject')}
            </Button>
            <Button variant="danger" size="sm" disabled={bulkBusy} onClick={bulkDelete}>
              {t('admin.reviews.delete')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              {t('admin.quotes.bulkClear')}
            </Button>
          </div>
        </Card>
      )}

      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{t('admin.reviews.loadError')}</p>}

      <AdminTable
        loading={loading}
        error={null}
        emptyMessage={loading ? t('admin.loading') : t('admin.reviews.empty')}
        rows={shown}
        rowKey={(r) => r.id}
        selectable
        selectedIds={selected}
        onToggleRow={toggleSelected}
        onToggleAll={toggleSelectAll}
        columns={[
          {
            key: 'name', header: t('admin.reviews.reviewer'),
            render: (r) => (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--text-strong)' }}>{r.name}</strong>
                  {r.role && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>{r.role}</span>}
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--text-body)', whiteSpace: 'pre-wrap', maxWidth: 420 }}>
                  {r.text}
                </p>
              </div>
            ),
          },
          { key: 'rating', header: '★', render: (r) => <StarRating rating={r.rating} /> },
          {
            key: 'approved', header: t('admin.reviews.statusApproved'),
            render: (r) => (
              <Badge tone={r.approved ? 'success' : 'warning'} soft>
                {r.approved ? t('admin.reviews.statusApproved') : t('admin.reviews.statusPending')}
              </Badge>
            ),
          },
          { key: 'created_at', header: t('admin.reviews.date'), render: (r) => fmtDate(r.created_at) },
        ]}
        renderRowActions={(r) => (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <Button
              variant={r.approved ? 'outline' : 'primary'}
              size="sm"
              disabled={busyId === r.id}
              onClick={() => toggleApprove(r)}
            >
              {r.approved ? t('admin.reviews.unapprove') : t('admin.reviews.approve')}
            </Button>
            <Button variant="danger" size="sm" disabled={busyId === r.id} onClick={() => remove(r)}>
              <Icon name="trash" size={14} />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
