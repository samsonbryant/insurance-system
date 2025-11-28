import React, { useState, useEffect } from 'react'
import { AlertCircle, Building2, FileText, CheckCircle, Loader, Send, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { INSURANCE_TYPES } from '../utils/insuranceTypes'
import { uploadAPI } from '../services/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://insurance-system.fly.dev/api' : '/api')

const PublicClaims = () => {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [companies, setCompanies] = useState([])
  const [formData, setFormData] = useState({
    policy_number: '',
    company_id: '',
    note: '',
    insurance_type: '',
    attachment_url: ''
  })
  const [attachmentFile, setAttachmentFile] = useState(null)

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

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await axios.post(`${API_BASE_URL}/upload/image/public`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const uploadUrl = response.data.url || response.data.path
      setFormData(prev => ({ ...prev, attachment_url: uploadUrl }))
      toast.success('Attachment uploaded successfully')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload attachment')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const claimData = {
        policy_number: formData.policy_number.trim(),
        company_id: parseInt(formData.company_id),
        note: formData.note.trim(),
        insurance_type: formData.insurance_type,
        attachment_url: formData.attachment_url || null
      }

      const response = await axios.post(`${API_BASE_URL}/claims/public/submit`, claimData)

      setSubmitted(true)
      toast.success('Claim submitted successfully! Your claim has been received and will be reviewed by the insurer.')
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          policy_number: '',
          company_id: '',
          note: '',
          insurance_type: '',
          attachment_url: ''
        })
        setAttachmentFile(null)
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error('Claim submission error:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to submit claim'
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

  const handleReset = () => {
    setFormData({
      policy_number: '',
      company_id: '',
      note: '',
      insurance_type: '',
      attachment_url: ''
    })
    setAttachmentFile(null)
    setSubmitted(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report a Claim</h2>
        <p className="text-gray-600">Submit your insurance claim for processing</p>
      </div>

      {submitted ? (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Claim Submitted Successfully!</h3>
          <p className="text-gray-600 mb-4">Your claim has been received and will be reviewed by the insurer.</p>
          <button
            onClick={handleReset}
            className="btn btn-secondary"
          >
            Submit Another Claim
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note (Textarea) */}
          <div>
            <label htmlFor="note" className="label">
              Note <span className="text-red-500">*</span>
            </label>
            <textarea
              id="note"
              className="input"
              rows="4"
              placeholder="Explain your claim in detail..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Insurer */}
          <div>
            <label htmlFor="claim_company_id" className="label">
              Insurer <span className="text-red-500">*</span>
            </label>
            <select
              id="claim_company_id"
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

          {/* Policy No. */}
          <div>
            <label htmlFor="claim_policy_number" className="label">
              Policy No. <span className="text-red-500">*</span>
            </label>
            <input
              id="claim_policy_number"
              type="text"
              className="input"
              placeholder="Enter your policy number"
              value={formData.policy_number}
              onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Type of Insurance */}
          <div>
            <label htmlFor="insurance_type" className="label">
              Type of Insurance <span className="text-red-500">*</span>
            </label>
            <select
              id="insurance_type"
              className="input"
              value={formData.insurance_type}
              onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
              required
              disabled={loading}
            >
              <option value="">Select insurance type</option>
              {INSURANCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Attachment */}
          <div>
            <label htmlFor="attachment" className="label">
              Attachment
            </label>
            <div className="flex gap-2">
              <input
                id="attachment"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="input flex-1"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setAttachmentFile(file)
                    handleFileUpload(file)
                  }
                }}
                disabled={loading || uploading}
              />
              {uploading && (
                <div className="flex items-center px-3">
                  <Loader className="animate-spin h-5 w-5 text-blue-600" />
                </div>
              )}
            </div>
            {formData.attachment_url && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Attachment uploaded
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Submit
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

export default PublicClaims
