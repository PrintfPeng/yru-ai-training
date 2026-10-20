import { client } from './client';

export const categoriesApi = {
  // Public — list active categories (pass { all: 1 } as admin to include hidden)
  list:    (params = {}) => client.get('/categories', { params }),
  getById: (id)          => client.get(`/categories/${id}`),
  // Admin
  create:  (data)        => client.post('/categories', data),
  update:  (id, data)    => client.put(`/categories/${id}`, data),
  remove:  (id)          => client.delete(`/categories/${id}`),
};

/** Public link to the training page filtered to one category. */
export const categoryPublicUrl = (slug) =>
  `${window.location.origin}/?view=training&cat=${encodeURIComponent(slug)}`;
