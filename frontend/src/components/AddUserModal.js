import React, { useState, useEffect } from 'react';
import '../styles/AccountModal.css';
import usersApi from '../services/usersApi';
import { useToast } from '../context';

const EMPTY = { username: '', email: '', password: '', role: 'user' };

const formatRequiredPlaceholder = (placeholder) => {
  const labelText = placeholder.split('(')[0].trim().replace(/\s*\*$/, '');
  return `${labelText} is required`;
};

const ClearInput = ({ name, value, onChange, error, placeholder, type = 'text', disabled = false }) => {
  const displayPlaceholder = error && !value ? formatRequiredPlaceholder(placeholder) : ' ';
  return (
    <div className={`field-wrap${error ? ' has-error' : ''}${disabled ? ' field-disabled' : ''}`}>
      <input
        name={name}
        value={value}
        type={type}
        onChange={disabled ? undefined : onChange}
        placeholder={displayPlaceholder}
        autoComplete="off"
        readOnly={disabled}
        style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
      />
      {placeholder && <label>{placeholder}</label>}
      {value && type !== 'password' && !disabled && (
        <button
          type="button"
          className="field-clear"
          tabIndex={-1}
          onClick={() => onChange({ target: { name, value: '' } })}
        >✕</button>
      )}
    </div>
  );
};

const SelectInput = ({ name, value, onChange, label, children, disabled = false }) => (
  <div className="field-wrap" style={disabled ? { opacity: 0.5 } : undefined}>
    <select name={name} value={value} onChange={disabled ? undefined : onChange} disabled={disabled}>
      {children}
    </select>
    <label>{label}</label>
  </div>
);

const SectionHead = ({ children }) => (
  <p className="form-section-head">{children}</p>
);

const PROTECTED_EMAIL = 'admin@infrabase.com';

// editUser: { id, username, email, role } — when set, modal is in edit mode
// canEditRole: only admins editing other users should see the role field
function AddUserModal({ isOpen, onClose, onSuccess, editUser = null, canEditRole = false }) {
  const toast    = useToast();
  const isEdit      = !!editUser;
  const isProtected = isEdit && editUser.email?.toLowerCase() === PROTECTED_EMAIL;
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (isOpen) {
      if (editUser) {
        setForm({ username: editUser.username || '', email: editUser.email || '', password: '', role: editUser.role || 'user' });
      } else {
        setForm(EMPTY);
      }
      setErrors({});
    }
  }, [isOpen, editUser]);

  if (!isOpen) return null;

  const handle = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: false }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = true;
    if (!form.email.trim())    e.email    = true;
    // Password required only when creating; on edit it's optional; protected account: not allowed
    if (!isEdit && !form.password)                        e.password = true;
    if (!isProtected && form.password && form.password.length < 6) e.password = true;
    return e;
  };

  const handleSubmit = async () => {
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    setLoading(true);
    try {
      let res;
      if (isEdit) {
        const payload = { username: form.username.trim() };
        if (!isProtected) {
          payload.email = form.email.trim();
          if (form.password) payload.password = form.password;
        }
        res = await usersApi.updateUser(editUser.id, payload);
      } else {
        res = await usersApi.createUser({
          username: form.username.trim(),
          email:    form.email.trim(),
          password: form.password,
          role:     form.role,
        });
      }

      if (res.data?.success) {
        toast(isEdit ? 'User updated successfully' : 'User created successfully');
        onSuccess?.(res.data.data ?? null);
        onClose();
      } else {
        toast(res.data?.message || (isEdit ? 'Failed to update user' : 'Failed to create user'), 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || (isEdit ? 'Failed to update user' : 'Failed to create user'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="account-modal-overlay">
      <div className="account-modal" style={{ maxWidth: 520, height: 'auto', maxHeight: 'calc(100vh - 32px)' }}>

        {/* ── Header ── */}
        <div className="account-modal-header">
          <div className="modal-header-left">
            <p className="modal-eyebrow">User Management</p>
            <h2>{isEdit ? `Edit User — ${editUser.username}` : 'Add New User'}</h2>
          </div>
          <div className="modal-header-right">
            <button className="close-btn" onClick={handleClose} disabled={loading}>✕</button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="account-modal-content">
          <div className="form-step">

            <SectionHead>Account Details</SectionHead>
            <div className="form-grid">
              <ClearInput
                name="username"
                value={form.username}
                onChange={handle}
                error={errors.username}
                placeholder="Username *"
              />
              <ClearInput
                name="email"
                value={form.email}
                onChange={handle}
                error={errors.email}
                placeholder="Email *"
                type="email"
                disabled={isProtected}
              />
              {!isProtected && (
                <ClearInput
                  name="password"
                  value={form.password}
                  onChange={handle}
                  error={errors.password}
                  placeholder={isEdit ? 'New Password (leave blank to keep current)' : 'Password * (min. 6 characters)'}
                  type="password"
                />
              )}
            </div>
            {isProtected && (
              <p className="info-text" style={{ borderLeftColor: '#f59e0b', color: '#92400e', background: '#fffbeb' }}>
                Email and password for this account cannot be changed.
              </p>
            )}

            {(!isEdit || canEditRole) && (
              <>
                <SectionHead>Role &amp; Permissions</SectionHead>
                <div className="form-grid">
                  <SelectInput name="role" value={form.role} onChange={handle} label="Role *" disabled={isProtected}>
                    <option value="user">User — standard access</option>
                    <option value="reviewer">Reviewer — senior review access</option>
                    <option value="admin">Admin — full access</option>
                  </SelectInput>
                </div>
              </>
            )}

            {!isProtected && errors.password && form.password && form.password.length < 6 && (
              <p className="info-text" style={{ borderLeftColor: '#ef4444', color: '#dc2626', background: '#fef2f2' }}>
                Password must be at least 6 characters.
              </p>
            )}

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="account-modal-footer">
          <button className="btn-secondary" onClick={handleClose} disabled={loading}>
            ← Cancel
          </button>
          <div className="button-group">
            <button className="btn-success" onClick={handleSubmit} disabled={loading}>
              {loading
                ? (isEdit ? 'Saving…' : 'Creating…')
                : (isEdit ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AddUserModal;
