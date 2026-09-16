const API_BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Error en la solicitud');
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  login: (usuario, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, password }),
    }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  me: () => request('/auth/me'),

  getProducts: () => request('/products'),

  getProductsByCategory: (category) => request(`/products/${category}`),

  getProductTypes: (category) => request(`/products/meta/types/${category}`),

  createProduct: (data) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (category, code, data) =>
    request(`/products/${category}/${encodeURIComponent(code)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (category, code) =>
    request(`/products/${category}/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    }),

  getSuppliers: () => request('/suppliers'),

  getSalesStats: () => request('/sales/stats'),

  getSales: (limit = 50) => request(`/sales?limit=${limit}`),

  createSale: (data) =>
    request('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSale: (id) => request(`/sales/${id}`, { method: 'DELETE' }),

  getInvoices: (limit = 100) => request(`/invoices?limit=${limit}`),

  getInvoiceStats: () => request('/invoices/stats'),

  getInvoice: (id) => request(`/invoices/${id}`),

  createInvoice: (data) =>
    request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateInvoiceStatus: (id, status) =>
    request(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getRepairs: (limit = 100) => request(`/repairs?limit=${limit}`),

  getRepairStats: () => request('/repairs/stats'),

  getRepair: (id) => request(`/repairs/${id}`),

  createRepair: (data) =>
    request('/repairs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRepairStatus: (id, status) =>
    request(`/repairs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  sendChatMessage: (messages) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),
};
