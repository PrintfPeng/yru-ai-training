import { client } from './client';

export const registrationsApi = {
  // Public — individual registration (from ActivityDetail form)
  publicRegister: (slug, participant, note, form_data) =>
    client.post(`/registrations/public/activity/${encodeURIComponent(slug)}/register`,
      { participant, note, form_data }),

  // Public — team registration (team leader submits all members)
  publicRegisterTeam: (slug, body) =>
    client.post(`/registrations/public/activity/${encodeURIComponent(slug)}/register-team`, body),

  // Public — masked registrant list shown on the registration page
  publicList: (slug) =>
    client.get(`/registrations/public/activity/${encodeURIComponent(slug)}/registrants`),

  // Public — trainee QR flow (EventLanding)
  verifyPhone: (slug, phone) =>
    client.post(`/registrations/public/activity/${encodeURIComponent(slug)}/verify-phone`,
      { phone }),

  // Admin
  listForActivity: (activityId, params = {}) =>
    client.get(`/registrations/by-activity/${activityId}`, { params }),
  adminCreate: (activityId, participant, note) =>
    client.post(`/registrations/by-activity/${activityId}`, { participant, note }),
  updateStatus: (id, status, note) =>
    client.patch(`/registrations/${id}/status`, { status, note }),
  remove: (id) => client.delete(`/registrations/${id}`),
};
