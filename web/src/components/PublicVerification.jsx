import React, { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, Clock, Loader, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { verificationAPI } from '../services/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const PublicVerification = () => {
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState([])
  const [formData, setFormData] = useState({
    policy_number: '',
    company_id: ''
  })
  const [verificationResult, setVerificationResult] = useState(null)
  const [showResult, setShowResult] = useState(false)

  // Load companies for dropdown
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/companies/public`, {
          params: { limit: 100, status: 'approved' },
          headers: {
            'Content-Type': 'application/json'
          }
        })
        setCompanies(response.data.companies || response.data || [])
      } catch (error) {
        console.error('Error loading companies:', error)
        // Don't show error toast for public endpoint failures - just log
        if (error.response?.status !== 401) {
          toast.error('Failed to load insurance companies')
        }
      }
    }
    loadCompanies()
  }, [])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setVerificationResult(null)

    try {
      const verificationData = {
        policy_number: formData.policy_number.trim(),
        company_id: parseInt(formData.company_id),
        verification_method: 'manual'
      }
      
      const response = await verificationAPI.verifyPublic(verificationData)

      setVerificationResult(response)
      setShowResult(true)
      toast.success('Verification completed!')
    } catch (error) {
      console.error('Verification error:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to verify policy'
      const errorDetails = error.response?.data?.details
      
      if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
        toast.error(errorDetails[0].msg || errorMessage)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setFormData({
      policy_number: '',
      company_id: ''
    })
    setVerificationResult(null)
    setShowResult(false)
  }

  // Close result modal
  const closeResult = () => {
    setShowResult(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Insurance Policy</h2>
          <p className="text-gray-600">Verify your insurance policy instantly</p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Policy Number */}
          <div>
            <label htmlFor="verify_policy_number" className="label">
              Policy Number <span className="text-red-500">*</span>
            </label>
            <input
              id="verify_policy_number"
              type="text"
              className="input"
              placeholder="Enter policy number"
              value={formData.policy_number}
              onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Insurer */}
          <div>
            <label htmlFor="verify_company_id" className="label">
              Insurer <span className="text-red-500">*</span>
            </label>
            <select
              id="verify_company_id"
              className="input"
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              required
              disabled={loading}
            >
              <option value="">Select insurer</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Verify Policy
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verification Result Modal */}
      {showResult && verificationResult && (
        <VerificationResultModal
          result={verificationResult}
          onClose={closeResult}
        />
      )}
    </div>
  )
}

// Verification Result Modal Component
const VerificationResultModal = ({ result, onClose }) => {
  const status = result.verification?.status || 'invalid'
  const policy = result.matched_policy

  const getStatusIcon = () => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-16 w-16 text-green-600" />
      case 'expired':
        return <Clock className="h-16 w-16 text-yellow-600" />
      case 'invalid':
      case 'fake':
      case 'not_found':
        return <XCircle className="h-16 w-16 text-red-600" />
      default:
        return <Shield className="h-16 w-16 text-gray-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'valid':
        return 'bg-green-50 border-green-500'
      case 'expired':
        return 'bg-yellow-50 border-yellow-500'
      case 'invalid':
      case 'fake':
      case 'not_found':
        return 'bg-red-50 border-red-500'
      default:
        return 'bg-gray-50 border-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'valid':
        return 'Valid Policy'
      case 'expired':
        return 'Expired Policy'
      case 'invalid':
      case 'fake':
        return 'Invalid Policy'
      case 'not_found':
        return 'Policy Not Found'
      default:
        return 'Verification Pending'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full border-l-4 ${getStatusColor()}`}>
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            {getStatusIcon()}
            <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
              {getStatusText()}
            </h3>
          </div>

          {/* Details */}
          {status === 'invalid' || status === 'fake' || status === 'not_found' ? (
            <div className="text-center py-4">
              <p className="text-gray-700 text-lg font-semibold">Invalid</p>
              <p className="text-gray-600 mt-2">The policy could not be verified.</p>
            </div>
          ) : status === 'expired' ? (
            <div className="space-y-3 mb-6">
              {policy && (
                <>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-700">Policy Holder:</span>
                    <span className="text-gray-900">{policy.holder_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-700">Insurer:</span>
                    <span className="text-gray-900">{policy.company?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-700">Policy No.:</span>
                    <span className="text-gray-900">{policy.policy_number}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-700">Expiration Date:</span>
                    <span className="text-gray-900">
                      {new Date(policy.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                    <p className="text-yellow-800 font-medium">Note: This policy has expired.</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {policy && (
                <>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-700">Policy Holder:</span>
                    <span className="text-gray-900">{policy.holder_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-700">Insurer:</span>
                    <span className="text-gray-900">{policy.company?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-700">Policy No.:</span>
                    <span className="text-gray-900">{policy.policy_number}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-700">Expiration Date:</span>
                    <span className="text-gray-900">
                      {new Date(policy.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <button
            onClick={onClose}
            className="w-full btn btn-primary py-3"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PublicVerification
