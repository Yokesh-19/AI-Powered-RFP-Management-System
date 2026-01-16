import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,                             //base url for api calls
  headers: {
    'Content-Type': 'application/json',
  },
});

// RFP API
export const rfpAPI = {                                        
  create: (description) => 
    api.post('/rfps', { description }),
  
  getAll: () => 
    api.get('/rfps'),
  
  getById: (id) => 
    api.get(`/rfps/${id}`),
  
  sendToVendors: (id, vendorIds) =>                                  //send rfp to vendors
    api.post(`/rfps/${id}/send`, { vendorIds }),
  
  delete: (id) => 
    api.delete(`/rfps/${id}`),
};

// Vendor API
export const vendorAPI = {
  create: (vendor) =>                                               
    api.post('/vendors', vendor),                                   //api call to create vendor
  
  getAll: () => 
    api.get('/vendors'),
  
  getById: (id) => 
    api.get(`/vendors/${id}`),                                        
  
  update: (id, vendor) => 
    api.put(`/vendors/${id}`, vendor),
  
  delete: (id) => 
    api.delete(`/vendors/${id}`),
};

// Proposal API
export const proposalAPI = {
  create: (proposal) => 
    api.post('/proposals', proposal),                                //api call to create proposal
  
  getAll: () => 
    api.get('/proposals/all'),
  
  getByRFP: (rfpId) => 
    api.get(`/proposals/rfp/${rfpId}`),
  
  compare: (rfpId) => 
    api.post(`/proposals/compare/${rfpId}`),
};

// Email API
export const emailAPI = {
  checkForNew: () =>                                      //api call to check for new emails
    api.get('/email/check'),
  
  startPolling: () => 
    api.post('/email/start-polling'),                      
  
  stopPolling: () => 
    api.post('/email/stop-polling'),
};

export default api;