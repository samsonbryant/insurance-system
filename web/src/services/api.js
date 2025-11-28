import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data
          
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout API error:', error)
    }
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData)
    return response.data
  }
}

// Company API
export const companyAPI = {
  getCompanies: async (params = {}) => {
    const response = await api.get('/companies', { params })
    return response.data
  },

  getCompany: async (id) => {
    const response = await api.get(`/companies/${id}`)
    return response.data
  },

  registerCompany: async (companyData) => {
    const response = await api.post('/companies/register', companyData)
    return response.data
  },

  updateCompany: async (id, companyData) => {
    const response = await api.put(`/companies/${id}`, companyData)
    return response.data
  },

  approveCompany: async (id, status) => {
    const response = await api.put(`/companies/${id}/approve`, { status })
    return response.data
  },

  getCompanyStats: async (id) => {
    const response = await api.get(`/companies/${id}/stats`)
    return response.data
  }
}

// Verification API
export const verificationAPI = {
  getVerifications: async (params = {}) => {
    const response = await api.get('/verifications', { params })
    return response.data
  },

  getVerification: async (id) => {
    const response = await api.get(`/verifications/${id}`)
    return response.data
  },

  verifyDocument: async (verificationData) => {
    const response = await api.post('/verifications/verify', verificationData)
    return response.data
  },

  // Public verification (no authentication required) - use axios directly without auth token
  verifyPublic: async (verificationData) => {
    const response = await axios.post(`${API_BASE_URL}/verifications/public/verify`, verificationData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.data
  },

  updateVerificationStatus: async (id, status, reason) => {
    const response = await api.put(`/verifications/${id}/status`, { status, reason })
    return response.data
  },

  getVerificationStats: async () => {
    const response = await api.get('/verifications/stats/summary')
    return response.data
  }
}

// Users API
export const usersAPI = {
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  getUser: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData)
    return response.data
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  suspendUser: async (id) => {
    const response = await api.put(`/users/${id}/suspend`)
    return response.data
  },

  activateUser: async (id) => {
    const response = await api.put(`/users/${id}/activate`)
    return response.data
  },

  getUserStats: async () => {
    const response = await api.get('/users/stats/summary')
    return response.data
  }
}

// Policies API
export const policiesAPI = {
  getPolicies: async (params = {}) => {
    const response = await api.get('/policies', { params })
    return response.data
  },

  getPolicy: async (id) => {
    const response = await api.get(`/policies/${id}`)
    return response.data
  },

  createPolicy: async (policyData) => {
    const response = await api.post('/policies', policyData)
    return response.data
  },

  updatePolicy: async (id, policyData) => {
    const response = await api.put(`/policies/${id}`, policyData)
    return response.data
  },

  deletePolicy: async (id) => {
    const response = await api.delete(`/policies/${id}`)
    return response.data
  },

  suspendPolicy: async (id) => {
    const response = await api.put(`/policies/${id}/suspend`)
    return response.data
  },

  activatePolicy: async (id) => {
    const response = await api.put(`/policies/${id}/activate`)
    return response.data
  },

  syncPolicies: async (policies, companyId) => {
    const response = await api.post('/policies/sync', { policies, company_id: companyId })
    return response.data
  },

  searchPolicies: async (searchParams) => {
    const response = await api.get('/policies/search/verify', { params: searchParams })
    return response.data
  }
}

// Reports API
export const reportsAPI = {
  getVerificationReports: async (params = {}) => {
    const response = await api.get('/reports/verifications', { params })
    return response.data
  },

  getPolicyReports: async (params = {}) => {
    const response = await api.get('/reports/policies', { params })
    return response.data
  },

  getDashboard: async () => {
    const response = await api.get('/reports/dashboard')
    return response.data
  },

  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard')
    return response.data
  },

  getAuditReports: async (params = {}) => {
    const response = await api.get('/reports/audit', { params })
    return response.data
  },

  getAuditLogs: async (params = {}) => {
    const response = await api.get('/reports/audit', { params })
    return response.data
  },

  exportAuditLogs: async (params = {}) => {
    const response = await api.get('/reports/audit/export/csv', { 
      params,
      responseType: 'blob'
    })
    return response.data
  }
}

// Upload API
export const uploadAPI = {
  uploadSingle: async (file, type = 'file') => {
    const formData = new FormData()
    formData.append(type, file)

    const response = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  uploadMultiple: async (files, type = 'files') => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append(type, file)
    })

    const response = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  uploadDocument: async (file) => {
    const formData = new FormData()
    formData.append('document', file)

    const response = await api.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  uploadImage: async (file) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getFileInfo: async (filename) => {
    const response = await api.get(`/upload/file/${filename}`)
    return response.data
  },

  deleteFile: async (filename) => {
    const response = await api.delete(`/upload/file/${filename}`)
    return response.data
  },

  listFiles: async (params = {}) => {
    const response = await api.get('/upload/files', { params })
    return response.data
  }
}

// CBL API
export const cblAPI = {
  getDashboard: async () => {
    const response = await api.get('/cbl/dashboard')
    return response.data
  },

  getCompanies: async (params = {}) => {
    const response = await api.get('/cbl/companies', { params })
    return response.data
  },

  importCompanies: async (companies) => {
    const response = await api.post('/cbl/companies/import', { companies })
    return response.data
  },

  approveCompany: async (companyId, approvalNotes) => {
    const response = await api.put(`/cbl/companies/${companyId}/approve`, { approval_notes: approvalNotes })
    return response.data
  },

  suspendCompany: async (companyId, reason, duration) => {
    const response = await api.put(`/cbl/companies/${companyId}/suspend`, { reason, duration })
    return response.data
  },

  getApprovals: async (params = {}) => {
    const response = await api.get('/cbl/approvals', { params })
    return response.data
  },

  approveRequest: async (approvalId, notes) => {
    const response = await api.put(`/cbl/approvals/${approvalId}/approve`, { notes })
    return response.data
  },

  declineRequest: async (approvalId, reason) => {
    const response = await api.put(`/cbl/approvals/${approvalId}/decline`, { reason })
    return response.data
  },


  performReferenceCheck: async (searchQuery, searchType) => {
    const response = await api.post('/cbl/reference-check', { search_query: searchQuery, search_type: searchType })
    return response.data
  },

  getReferenceHistory: async (params = {}) => {
    const response = await api.get('/cbl/reference-history', { params })
    return response.data
  }
}

// Insurer API
export const insurerAPI = {
  getDashboard: async () => {
    const response = await api.get('/insurer/dashboard')
    return response.data
  },

  getRegistration: async () => {
    const response = await api.get('/insurer/registration')
    return response.data
  },

  renewRegistration: async (renewalDocuments, notes) => {
    const response = await api.put('/insurer/registration/renew', { renewal_documents: renewalDocuments, notes })
    return response.data
  },

  getPolicies: async (params = {}) => {
    const response = await api.get('/insurer/policies', { params })
    return response.data
  },

  createPolicy: async (policyData) => {
    const response = await api.post('/insurer/policies', policyData)
    return response.data
  },

  updatePolicy: async (id, policyData) => {
    const response = await api.put(`/insurer/policies/${id}`, policyData)
    return response.data
  },

  getClaims: async (params = {}) => {
    const response = await api.get('/insurer/claims', { params })
    return response.data
  },

  settleClaim: async (claimId, settlementAmount, settlementNotes) => {
    const response = await api.put(`/insurer/claims/${claimId}/settle`, { 
      settlement_amount: settlementAmount, 
      settlement_notes: settlementNotes 
    })
    return response.data
  },

  denyClaim: async (claimId, denialReason) => {
    const response = await api.put(`/insurer/claims/${claimId}/deny`, { denial_reason: denialReason })
    return response.data
  },

  getStatements: async (params = {}) => {
    const response = await api.get('/insurer/statements', { params })
    return response.data
  },

  generateStatement: async (policyId, statementType, periodStart, periodEnd) => {
    const response = await api.post('/insurer/statements/generate', {
      policy_id: policyId,
      statement_type: statementType,
      period_start: periodStart,
      period_end: periodEnd
    })
    return response.data
  },


  getReportsSummary: async () => {
    const response = await api.get('/insurer/reports/summary')
    return response.data
  },

  getNextPolicyNumbers: async (year) => {
    const response = await api.get('/insurer/policy-numbers/next', { params: { year } })
    return response.data
  },

  getPolicyNumberStats: async (year) => {
    const response = await api.get('/insurer/policy-numbers/stats', { params: { year } })
    return response.data
  }
}

// Insured API
export const insuredAPI = {
  getDashboard: async () => {
    const response = await api.get('/insured/dashboard')
    return response.data
  },

  getPolicies: async (params = {}) => {
    const response = await api.get('/insured/policies', { params })
    return response.data
  },

  getPolicy: async (policyId) => {
    const response = await api.get(`/insured/policies/${policyId}`)
    return response.data
  },

  getPolicyCertificate: async (policyId) => {
    const response = await api.get(`/insured/policies/${policyId}/certificate`)
    return response.data
  },

  verifyPolicy: async (policyNumber, holderName, verificationPurpose) => {
    const response = await api.post('/insured/verify-policy', {
      policy_number: policyNumber,
      holder_name: holderName,
      verification_purpose: verificationPurpose
    })
    return response.data
  },

  getClaims: async (params = {}) => {
    const response = await api.get('/insured/claims', { params })
    return response.data
  },

  reportClaim: async (claimData) => {
    const response = await api.post('/insured/claims', claimData)
    return response.data
  },

  getClaim: async (claimId) => {
    const response = await api.get(`/insured/claims/${claimId}`)
    return response.data
  },

  getStatements: async (params = {}) => {
    const response = await api.get('/insured/statements', { params })
    return response.data
  },

  downloadStatement: async (statementId) => {
    const response = await api.get(`/insured/statements/${statementId}/download`, {
      responseType: 'blob'
    })
    return response.data
  },

  getVerificationHistory: async (params = {}) => {
    const response = await api.get('/insured/verification-history', { params })
    return response.data
  }
}

export default api

