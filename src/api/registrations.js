import { client } from './client';

export const registrationsApi = {
  // Public — from ActivityDetail form
  publicRegister: (slug, participant, note) =>
    client.post(`/registrations/public/activity/${encodeURIComponent(slug)}/register`,
      { participant, note }),

  // Public — trainee QR flow (EventLanding)
  verifyPhone: (slug, phone) =>
    client.post(`/registrations/public/activity/${encodeURIComponent(slug)}/verify-phone`,
      { phone }),

  // Admin
  listForActivity: (activityId, params = {}) =>
    client.get(`/registrations/by-activity/${activityId}`, { params }),
  updateStatus: (id, status, note) =>
    client.patch(`/registrations/${id}/status`, { status, note }),
  remove: (id) => client.delete(`/registrations/${id}`),
};
