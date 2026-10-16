import { client } from './client';

export const roomsApi = {
  // Admin — room bookings read from the public Google Sheet (read-only).
  // Pass { refresh: 1 } to bypass the server cache.
  listBookings: (params = {}) => client.get('/rooms/bookings', { params }),
};
