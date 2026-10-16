import { client } from './client';

export const authApi = {
  login:  (username, password, remember = false) =>
    client.post('/auth/login', { username, password, remember }),
  logout: () => client.post('/auth/logout'),
  me:     () => client.get('/auth/me'),
};
