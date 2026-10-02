import { client } from './client';

export const certificatesApi = {
  // Public verify — used by CertificateDownload. Sent as a query param so codes
  // containing '/' (ควท.มรย.2570/03/001) survive nginx/URL-path handling.
  getByCode: (code) => client.get('/certificates/public', { params: { code } }),
};
