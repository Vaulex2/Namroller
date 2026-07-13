import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../components/core/Button';
import { Badge } from '../../components/core/Badge';
import { Card } from '../../components/surfaces/Card';
import { Icon } from '../Icon';
import { listAllProducts, reorderProducts, setProductPublished, deleteProduct, productRowImageUrl } from '../../lib/products';
import { useAdminResource } from '../../hooks/useAdminResource';
import { SortableList, DragHandle } from './shared/SortableList';
import { AdminModal } from './shared/AdminModal';
import { ProductForm } from './ProductForm';

const fetchProducts = () => listAllProducts();

/* Product catalog management: drag-reorderable list (mirrors VideosPanel's
   media-grid precedent, not a table — reordering needs drag affordance per
   row), publish toggle, edit (opens ProductForm in an AdminModal), delete. */
export function ProductsPanel() {
  const { t } = useTranslation();
  const [busyId, setBusyId] = React.useState(null);
  const [formOpen, setFormOpen] = React.useState(false); // false | 'create' | ProductRow being edited
  const { data, setData, loading, error, reload } = useAdminResource(fetchProducts);
  const rows = data ?? [];

  React.useEffect(() => { if (error) toast.error(t('admin.products.loadError')); }, [error, t]);

  const handleReorder = async (orderedIds) => {
    const prev = data;
    setData((rs) => orderedIds.map((id) => rs.find((r) => r.id === id)));
    try {
      await reorderProducts(orderedIds);
    } catch {
      setData(prev);
      toast.error(t('admin.products.actionError'));
    }
  };

  const togglePublish = async (row) => {
    setBusyId(row.id);
    try {
      await setProductPublished(row.id, !row.published);
      setData((rs) => rs.map((r) => (r.id === row.id ? { ...r, published: !row.published } : r)));
    } catch {
      toast.error(t('admin.products.actionError'));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(t('admin.products.confirmDelete'))) return;
    setBusyId(row.id);
    try {
      await deleteProduct(row);
      setData((rs) => rs.filter((r) => r.id !== row.id));
      toast.success(t('admin.products.deleted'));
    } catch {
      toast.error(t('admin.products.actionError'));
    } finally {
      setBusyId(null);
    }
  };

  const closeForm = (didSave) => {
    setFormOpen(false);
    if (didSave) reload();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)', margin: 0 }}>
          {t('admin.products.intro')}
        </p>
        <Button variant="primary" size="md" onClick={() => setFormOpen('create')}>
          {t('admin.products.add')}
        </Button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.loading')}</p>
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.products.empty')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SortableList
            items={rows}
            itemKey={(row) => row.id}
            onReorder={handleReorder}
            renderItem={(row, { dragHandleProps }) => {
              const imageUrl = productRowImageUrl(row);
              return (
                <Card variant="outline" padding={16} style={{ opacity: row.published ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <DragHandle {...dragHandleProps} />
                    {imageUrl ? (
                      <img src={imageUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }} />
                    ) : (
                      <span style={{ width: 48, height: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)' }}>
                        <Icon name={row.icon} size={22} color="var(--text-muted)" />
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--text-strong)' }}>{row.name}</strong>
                        <Badge tone="neutral" soft>{t(`cat.${row.cat}`, row.cat)}</Badge>
                        <Badge tone={row.published ? 'success' : 'warning'} soft>
                          {row.published ? t('admin.products.published') : t('admin.products.hidden')}
                        </Badge>
                      </div>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 'var(--fs-body-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.blurb}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Button variant="outline" size="sm" onClick={() => setFormOpen(row)}>
                        <Icon name="edit" size={14} />
                      </Button>
                      <Button variant="outline" size="sm" disabled={busyId === row.id} onClick={() => togglePublish(row)}>
                        <Icon name={row.published ? 'eye-off' : 'eye'} size={14} />
                      </Button>
                      <Button variant="danger" size="sm" disabled={busyId === row.id} onClick={() => remove(row)}>
                        <Icon name="trash" size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            }}
          />
        </div>
      )}

      {formOpen && (
        <AdminModal
          onClose={() => closeForm(false)}
          closeLabel={t('admin.detail.close')}
          title={formOpen === 'create' ? t('admin.products.add') : t('admin.products.edit')}
          maxWidth={880}
        >
          <ProductForm
            initial={formOpen === 'create' ? null : formOpen}
            onSaved={() => closeForm(true)}
            onCancel={() => closeForm(false)}
          />
        </AdminModal>
      )}
    </div>
  );
}
