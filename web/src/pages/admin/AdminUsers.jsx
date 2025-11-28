import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersAPI } from '../../services/api'
import { useRealTimeEvents } from '../../services/realTimeService'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { Edit, Trash2, UserX, UserCheck, Eye } from 'lucide-react'

const AdminUsers = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Real-time updates
  useRealTimeEvents({
    'userUpdate': () => loadUsers(),
    'userCreated': () => loadUsers(),
    'userDeleted': () => loadUsers(),
  })

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getAllUsers()
      // Handle different response structures
      if (response.users) {
        setUsers(Array.isArray(response.users) ? response.users : [])
      } else if (Array.isArray(response)) {
        setUsers(response)
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter(user =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredUsers(filtered)
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      await usersAPI.deleteUser(userId)
      toast.success('User deleted successfully')
      loadUsers()
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const handleSuspend = async (userId) => {
    try {
      await usersAPI.suspendUser(userId)
      toast.success('User suspended successfully')
      loadUsers()
    } catch (error) {
      toast.error('Failed to suspend user')
    }
  }

  const handleActivate = async (userId) => {
    try {
      await usersAPI.activateUser(userId)
      toast.success('User activated successfully')
      loadUsers()
    } catch (error) {
      toast.error('Failed to activate user')
    }
  }

  const handleExport = () => {
    const headers = ['Username', 'Email', 'First Name', 'Last Name', 'Role', 'Phone', 'Status', 'Last Login']
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        user.username,
        user.email,
        user.first_name || '',
        user.last_name || '',
        user.role,
        user.phone || '',
        user.is_active ? 'Active' : 'Inactive',
        user.last_login ? new Date(user.last_login).toLocaleDateString() : ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success('Users exported successfully')
  }

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      cbl: 'bg-blue-100 text-blue-700',
      insurer: 'bg-green-100 text-green-700',
      insured: 'bg-yellow-100 text-yellow-700',
      company: 'bg-orange-100 text-orange-700',
      officer: 'bg-indigo-100 text-indigo-700',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
        {role?.toUpperCase()}
      </span>
    )
  }

  const columns = [
    {
      header: 'Username',
      accessor: 'username',
      render: (user) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
            <span className="text-primary-600 font-medium">
              {user.first_name?.[0] || user.username?.[0] || 'U'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.username}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Name',
      accessor: 'name',
      render: (user) => (
        <div>
          {user.first_name || user.last_name ? (
            <>
              <div className="font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </div>
              {user.phone && (
                <div className="text-sm text-gray-500">{user.phone}</div>
              )}
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (user) => getRoleBadge(user.role),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (user) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          user.is_active
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Last Login',
      accessor: 'last_login',
      render: (user) => (
        <div className="text-sm text-gray-500">
          {user.last_login
            ? new Date(user.last_login).toLocaleDateString()
            : 'Never'}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      title="Users Management"
      data={filteredUsers}
      columns={columns}
      loading={loading}
      onRefresh={loadUsers}
      onAdd={() => navigate('/users/add')}
      onExport={handleExport}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      emptyMessage="No users found"
      renderRowActions={(user) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/users/edit/${user.id}`)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          {user.is_active ? (
            <button
              onClick={() => handleSuspend(user.id)}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
              title="Suspend"
            >
              <UserX className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => handleActivate(user.id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
              title="Activate"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(user.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  )
}

export default AdminUsers
