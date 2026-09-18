import { client } from './client';

export const assessmentsApi = {
  // Admin — nested under activity
  listForActivity: (activityId) => client.get(`/assessments/by-activity/${activityId}`),
  create:          (activityId, body) => client.post(`/assessments/by-activity/${activityId}`, body),
  // Admin — by id
  getById:         (id) => client.get(`/assessments/${id}`),
  update:          (id, patch) => client.patch(`/assessments/${id}`, patch),
  remove:          (id) => client.delete(`/assessments/${id}`),
  // Public — trainee flow
  getActiveBySlug: (slug) => client.get(`/assessments/public/activity/${encodeURIComponent(slug)}/active`),
  submit:          (id, participantId, responseData) =>
                    client.post(`/assessments/${id}/public/submit`,
                      { participant_id: participantId, response_data: responseData }),
};
