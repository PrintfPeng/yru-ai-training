import { client } from './client';

export const certificatesApi = {
  // Public verify — used by CertificateDownload + /verify/:code page
  getByCode: (code) => client.get(`/certificates/public/${encodeURIComponent(code)}`),
};
