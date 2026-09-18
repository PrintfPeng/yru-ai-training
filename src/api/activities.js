import { client } from './client';

export const activitiesApi = {
  list:      (params = {})  => client.get('/activities', { params }),
  getBySlug: (slug)         => client.get(`/activities/slug/${encodeURIComponent(slug)}`),
  getById:   (id)           => client.get(`/activities/${id}`),
  create:    (body)         => client.post('/activities', body),
  update:    (id, patch)    => client.patch(`/activities/${id}`, patch),
  remove:    (id)           => client.delete(`/activities/${id}`),
};
