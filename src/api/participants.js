import { client } from './client';

export const participantsApi = {
  list:    (params = {}) => client.get('/participants', { params }),
  getById: (id)          => client.get(`/participants/${id}`),
  update:  (id, patch)   => client.patch(`/participants/${id}`, patch),
  remove:  (id)          => client.delete(`/participants/${id}`),
};
