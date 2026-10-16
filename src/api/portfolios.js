import { client } from './client';

export const portfoliosApi = {
  // Public — list active portfolios (pass { all: 1 } as admin to include hidden)
  getPortfolios:    (params = {}) => client.get('/portfolios', { params }),
  getPortfolioById: (id)          => client.get(`/portfolios/${id}`),
  // Admin
  createPortfolio:  (data)        => client.post('/portfolios', data),
  updatePortfolio:  (id, data)    => client.put(`/portfolios/${id}`, data),
  deletePortfolio:  (id)          => client.delete(`/portfolios/${id}`),
};
