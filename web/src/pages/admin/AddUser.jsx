import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersAPI, companyAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

const AddUser = () => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const unauthorizedWarnedRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [companies, setCompanies] = useState([])
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'officer',
    company_id: '',
  })

  useEffect(() => {
    if (authLoading) return

    if (!user || user.role !== 'admin') {
      if (!unauthorizedWarnedRef.current) {
        toast.error('Only administrators can create users')
        unauthorizedWarnedRef.current = true
      }
      setLoadingCompanies(false)
      navigate('/dashboard', { replace: true })
      return
    }

    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true)
        const response = await companyAPI.getCompanies({ limit: 100 })
        setCompanies(response.companies || [])
      } catch (error) {
        console.error('Error loading companies:', error)
        toast.error('Failed to load companies list')
      } finally {
        setLoadingCompanies(false)
      }
    }

    fetchCompanies()
  }, [authLoading, user, navigate])

  const requiresCompany = ['company', 'insurer'].includes(formData.role)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      setSubmitting(true)
      const { confirmPassword, company_id, ...rest } = formData
      const userData = {
        ...rest,
        ...(requiresCompany && company_id
          ? { company_id: parseInt(company_id, 10) }
          : {}),
      }

      if (requiresCompany && !userData.company_id) {
        toast.error('Please select a company')
        return
      }

      await usersAPI.createUser(userData)
      toast.success('User created successfully')
      navigate('/users')
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(error.response?.data?.error || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'cbl', label: 'CBL' },
    { value: 'insurer', label: 'Insurer' },
    { value: 'insured', label: 'Insured' },
    { value: 'company', label: 'Company' },
    { value: 'officer', label: 'Officer' },
  ]

  if (authLoading) {
    return null
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Username *</label>
            <input
              type="text"
              className="input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Password *</label>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="label">Confirm Password *</label>
            <input
              type="password"
              className="input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              className="input"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Last Name</label>
            <input
              type="text"
              className="input"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Role *</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => {
                const nextRole = e.target.value
                setFormData((prev) => ({
                  ...prev,
                  role: nextRole,
                  company_id: ['company', 'insurer'].includes(nextRole)
                    ? prev.company_id
                    : '',
                }))
              }}
              required
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {requiresCompany && (
            <div>
              <label className="label">Company *</label>
              <select
                className="input"
                value={formData.company_id}
                onChange={(e) =>
                  setFormData({ ...formData, company_id: e.target.value })
                }
                disabled={loadingCompanies}
                required
              >
                <option value="">
                  {loadingCompanies ? 'Loading companies...' : 'Select company'}
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddUser
