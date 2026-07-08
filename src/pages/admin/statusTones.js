// Badge tone per pipeline status, shared by the quotes list and detail view.
// Lives in its own module (not next to a component) so react-refresh can
// hot-reload the panels cleanly.
export const STATUS_TONE = {
  new: 'warning',
  accepted: 'accent',
  completed: 'success',
};
