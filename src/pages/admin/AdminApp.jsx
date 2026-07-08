import { Toaster } from 'sonner';
import { AdminGate } from './AdminGate';

/* Admin panel entry. Lazy-loaded from App.jsx (React.lazy) behind the
   `#/admin-…` hash, so normal visitors never download this bundle. Renders
   full-screen, outside the marketing chrome (no Header/Footer/docks). */
export default function AdminApp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface-page)',
      fontFamily: 'var(--font-body)',
    }}>
      <Toaster richColors position="top-right" />
      <AdminGate />
    </div>
  );
}
