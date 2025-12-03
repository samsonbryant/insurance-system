import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { insurerAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { INSURANCE_TYPES } from '../../utils/insuranceTypes'
import { generateHolderID } from '../../utils/exportUtils'

const COVERAGE_TYPES = [
  { value: 'treaty', label: 'Treaty' },
  { value: 'facultative', label: 'Facultative' },
  { value: 'co_insured', label: 'Co-Insured' },
]

const AddPolicy = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    holder_name: '',
    holder_id_number: '',
    holder_phone: '',
    holder_email: '',
    policy_type: 'auto',
    coverage_type: '',
    reinsurance_number: '',
    premium_amount: '',
    start_date: '',
    expiry_date: '',
  })

  // Auto-generate holder ID when component mounts or when Add Policy button is clicked
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      holder_id_number: generateHolderID()
    }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate reinsurance number if coverage type is selected
    if (formData.coverage_type && !formData.reinsurance_number) {
      toast.error('Reinsurance Number is required when Coverage Type is selected')
      return
    }
    
    try {
      setLoading(true)
      // Map coverage_type to coverage_amount for backward compatibility
      const policyData = {
        ...formData,
        coverage_amount: formData.coverage_type, // Store coverage type
        coverage_type: formData.coverage_type,
        reinsurance_number: formData.reinsurance_number,
      }
      await insurerAPI.createPolicy(policyData)
      toast.success('Policy created successfully')
      navigate('/policies')
    } catch (error) {
      console.error('Error creating policy:', error)
      toast.error(error.response?.data?.error || 'Failed to create policy')
    } finally {
      setLoading(false)
    }
  }

  const policyTypes = INSURANCE_TYPES

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/policies')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Policy</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${formData.coverage_type ? '' : ''}`}>
          <div>
            <label className="label">Policy Type *</label>
            <select
              className="input"
              value={formData.policy_type}
              onChange={(e) => setFormData({ ...formData, policy_type: e.target.value })}
              required
            >
              {policyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Holder Name *</label>
            <input
              type="text"
              className="input"
              value={formData.holder_name}
              onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Holder ID Number *</label>
            <input
              type="text"
              className="input bg-gray-50"
              value={formData.holder_id_number}
              readOnly
              required
              title="Auto-generated - cannot be changed"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated - cannot be changed</p>
          </div>

          <div>
            <label className="label">Holder Phone</label>
            <input
              type="tel"
              className="input"
              value={formData.holder_phone}
              onChange={(e) => setFormData({ ...formData, holder_phone: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Holder Email</label>
            <input
              type="email"
              className="input"
              value={formData.holder_email}
              onChange={(e) => setFormData({ ...formData, holder_email: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Coverage *</label>
            <select
              className="input"
              value={formData.coverage_type}
              onChange={(e) => setFormData({ ...formData, coverage_type: e.target.value, reinsurance_number: '' })}
              required
            >
              <option value="">Select Coverage Type</option>
              {COVERAGE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {formData.coverage_type && (
            <div>
              <label className="label">Reinsurance No. *</label>
              <input
                type="text"
                className="input"
                value={formData.reinsurance_number}
                onChange={(e) => setFormData({ ...formData, reinsurance_number: e.target.value })}
                required
                placeholder={`Enter ${COVERAGE_TYPES.find(t => t.value === formData.coverage_type)?.label} Reinsurance Number`}
              />
            </div>
          )}

          <div>
            <label className="label">Premium Amount *</label>
            <input
              type="number"
              className="input"
              value={formData.premium_amount}
              onChange={(e) => setFormData({ ...formData, premium_amount: e.target.value })}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="label">Start Date *</label>
            <input
              type="date"
              className="input"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Expiry Date *</label>
            <input
              type="date"
              className="input"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={loading}
          >
            <Save className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create Policy'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/policies')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddPolicy
