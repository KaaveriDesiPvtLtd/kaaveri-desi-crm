import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, AlertCircle, Users, Shield, ShieldCheck, Eye, UserPlus, X, RefreshCw } from 'lucide-react';

const ROLE_CONFIG = {
  superadmin: { label: 'Super Admin', color: 'bg-red-100 text-red-700', icon: ShieldCheck },
  admin:      { label: 'Admin',       color: 'bg-blue-100 text-blue-700', icon: Shield },
  manager:    { label: 'Manager',     color: 'bg-green-100 text-green-700', icon: Users },
  viewer:     { label: 'Viewer',      color: 'bg-gray-100 text-gray-600', icon: Eye }
};

const initialFormState = {
  username: '',
  password: '',
  name: '',
  role: 'viewer'
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/crm/auth/users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't pre-fill password
      name: user.name,
      role: user.role
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.username.trim()) {
      setFormError('Name and username are required.');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const updatePayload = { name: formData.name, role: formData.role };
        if (formData.password) updatePayload.password = formData.password;
        await axios.put(`/api/crm/auth/users/${editingUser.id || editingUser._id}`, updatePayload);
      } else {
        await axios.post('/api/crm/auth/users', formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`Deactivate user "${user.name}"? They will no longer be able to login.`)) return;
    try {
      await axios.delete(`/api/crm/auth/users/${user.id || user._id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate user.');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await axios.put(`/api/crm/auth/users/${user.id || user._id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage admin users and their roles</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className="text-slate-500" />
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus size={20} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Users Table - Desktop */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Username</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Role</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-400">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-400">No users found.</td></tr>
              ) : (
                users.map((user) => {
                  const roleInfo = ROLE_CONFIG[user.role] || ROLE_CONFIG.viewer;
                  const RoleIcon = roleInfo.icon;
                  return (
                    <tr key={user._id || user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{user.username}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleInfo.color}`}>
                          <RoleIcon size={14} />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.role !== 'superadmin' && (
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'hover:bg-orange-50 text-slate-500 hover:text-orange-500' : 'hover:bg-green-50 text-slate-500 hover:text-green-600'}`}
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {user.isActive ? <Trash2 size={16} /> : <RefreshCw size={16} />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Cards - Mobile */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No users found.</div>
        ) : (
          users.map((user) => {
            const roleInfo = ROLE_CONFIG[user.role] || ROLE_CONFIG.viewer;
            const RoleIcon = roleInfo.icon;
            return (
              <div key={user._id || user.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{user.name}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">@{user.username}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleInfo.color}`}>
                    <RoleIcon size={14} />
                    {roleInfo.label}
                  </span>
                  {user.role !== 'superadmin' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`p-2 rounded-lg transition-colors ${user.isActive ? 'hover:bg-orange-50 text-slate-500 hover:text-orange-500' : 'hover:bg-green-50 text-slate-500 hover:text-green-600'}`}
                      >
                        {user.isActive ? <Trash2 size={16} /> : <RefreshCw size={16} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{formError}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none text-sm"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none text-sm"
                  placeholder="e.g. johndoe"
                  disabled={!!editingUser}
                  required
                />
                {editingUser && <p className="text-xs text-slate-400 mt-1">Username cannot be changed</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {editingUser && <span className="text-slate-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none text-sm"
                  placeholder={editingUser ? '••••••••' : 'Min 6 characters'}
                  required={!editingUser}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role & Accessibility</label>
                <div className="space-y-2">
                  {['admin', 'manager', 'viewer'].map((role) => {
                    const info = ROLE_CONFIG[role];
                    const roleDescriptions = {
                      admin: 'Full read-write access to all tabs except User Management',
                      manager: 'Read-write on Inventory & Orders. Read-only on Dashboard & Reports',
                      viewer: 'Read-only access to Dashboard, Inventory, Orders, and Reports'
                    };
                    return (
                      <label
                        key={role}
                        className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.role === role ? 'border-yellow-500 bg-yellow-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={formData.role === role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="mt-1 accent-yellow-500"
                        />
                        <div>
                          <span className={`inline-flex items-center gap-1 text-sm font-semibold`}>
                            {info.label}
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">{roleDescriptions[role]}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-yellow-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingUser ? 'Update User' : 'Create User'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
