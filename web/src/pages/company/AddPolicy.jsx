import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { policiesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { INSURANCE_TYPES } from '../../utils/insuranceTypes'

const AddPolicy = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    holder_name: '',
    holder_id_number: '',
    holder_phone: '',
    holder_email: '',
    policy_type: 'auto',
    coverage_amount: '',
    premium_amount: '',
    start_date: '',
    expiry_date: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await policiesAPI.createPolicy({
        ...formData,
        company_id: user?.company_id,
      })
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              className="input"
              value={formData.holder_id_number}
              onChange={(e) => setFormData({ ...formData, holder_id_number: e.target.value })}
              required
            />
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
            <label className="label">Coverage Amount *</label>
            <input
              type="number"
              className="input"
              value={formData.coverage_amount}
              onChange={(e) => setFormData({ ...formData, coverage_amount: e.target.value })}
              required
              min="0"
              step="0.01"
            />
          </div>

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
