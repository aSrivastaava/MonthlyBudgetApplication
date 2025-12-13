import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { houseService } from '../services/houseService';
import './HouseDetails.css';

function HouseDetails() {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchHouseDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houseId]);

  const fetchHouseDetails = async () => {
    setLoading(true);
    const result = await houseService.getHouseDetails(houseId);
    if (result.success) {
      setHouse(result.data.house);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await houseService.renameHouse(houseId, newName);
    
    if (result.success) {
      setSuccess('House renamed successfully!');
      setHouse({ ...house, name: newName });
      setTimeout(() => {
        setShowRenameModal(false);
        setSuccess('');
      }, 2000);
    } else {
      setError(result.error);
    }
  };

  const handleAssignRole = async (memberId, role) => {
    setError('');
    setSuccess('');

    const result = await houseService.assignRole(houseId, memberId, role);
    
    if (result.success) {
      setSuccess('Role assigned successfully!');
      fetchHouseDetails();
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } else {
      setError(result.error);
    }
  };

  const canManageRoles = house && (house.userRole === 'owner' || house.userRole === 'admin');
  const canRenameHouse = house && (house.userRole === 'owner' || house.userRole === 'admin');

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!house) {
    return (
      <div className="error-container">
        <p>{error || 'House not found'}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="house-details-container">
      <header className="house-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back
        </button>
        <div className="house-title">
          <h1>{house.name}</h1>
          {canRenameHouse && (
            <button onClick={() => setShowRenameModal(true)} className="btn-secondary">
              Rename
            </button>
          )}
        </div>
      </header>

      <div className="house-content">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="budget-link-section">
          <button 
            onClick={() => navigate(`/house/${houseId}/budget`)} 
            className="btn-budget"
          >
            📊 Manage Budget & Payments
          </button>
        </div>

        <div className="house-info-section">
          <div className="info-card">
            <h3>House Key</h3>
            <p className="house-key-display">{house.houseKey}</p>
            <small>Share this key with others to invite them</small>
          </div>

          <div className="info-card">
            <h3>Your Role</h3>
            <span className={`role-badge role-${house.userRole}`}>{house.userRole}</span>
          </div>

          <div className="info-card">
            <h3>Owner</h3>
            <p>{house.owner.username}</p>
            <small>{house.owner.email}</small>
          </div>
        </div>

        <div className="members-section">
          <h2>Members ({house.members.length})</h2>
          <div className="members-list">
            {house.members.map((member) => (
              <div key={member.userId._id} className="member-card">
                <div className="member-info">
                  <h4>{member.userId.username}</h4>
                  <p>{member.userId.email}</p>
                  <small>Joined: {new Date(member.joinedAt).toLocaleDateString()}</small>
                </div>
                <div className="member-role">
                  {canManageRoles && member.role !== 'owner' ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleAssignRole(member.userId._id, e.target.value)}
                      className="role-select"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="financier">Financier</option>
                      <option value="rent payer">Rent Payer</option>
                    </select>
                  ) : (
                    <span className={`role-badge role-${member.role}`}>{member.role}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Rename House</h2>
            <form onSubmit={handleRename}>
              <div className="form-group">
                <label htmlFor="newName">New House Name</label>
                <input
                  type="text"
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="Enter new house name"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowRenameModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HouseDetails;
