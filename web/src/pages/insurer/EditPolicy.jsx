import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { insurerAPI, policiesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { INSURANCE_TYPES } from '../../utils/insuranceTypes'

const EditPolicy = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    loadPolicy()
  }, [id])

  const loadPolicy = async () => {
    try {
      setLoading(true)
      const response = await insurerAPI.getPolicies()
      const policy = (response.policies || response || []).find(p => p.id === parseInt(id))
      if (policy) {
        setFormData({
          holder_name: policy.holder_name || '',
          holder_id_number: policy.holder_id_number || '',
          holder_phone: policy.holder_phone || '',
          holder_email: policy.holder_email || '',
          policy_type: policy.policy_type || 'auto',
          coverage_amount: policy.coverage_amount || '',
          premium_amount: policy.premium_amount || '',
          start_date: policy.start_date ? policy.start_date.split('T')[0] : '',
          expiry_date: policy.expiry_date ? policy.expiry_date.split('T')[0] : '',
        })
      }
    } catch (error) {
      console.error('Error loading policy:', error)
      toast.error('Failed to load policy')
      navigate('/policies')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await policiesAPI.updatePolicy(id, formData)
      toast.success('Policy updated successfully')
      navigate('/policies')
    } catch (error) {
      console.error('Error updating policy:', error)
      toast.error(error.response?.data?.error || 'Failed to update policy')
    } finally {
      setSaving(false)
    }
  }

  const policyTypes = INSURANCE_TYPES

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/policies')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Policy</h1>
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
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
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

export default EditPolicy
