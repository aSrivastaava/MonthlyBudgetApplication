import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { houseService } from '../services/houseService';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const [houses, setHouses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [houseName, setHouseName] = useState('');
  const [houseKey, setHouseKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    const result = await houseService.getMyHouses();
    if (result.success) {
      setHouses(result.data.houses);
    }
  };

  const handleCreateHouse = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await houseService.createHouse(houseName);
    
    if (result.success) {
      setSuccess(`House created! Your house key is: ${result.data.house.houseKey}`);
      setHouseName('');
      fetchHouses();
      setTimeout(() => {
        setShowCreateModal(false);
        setSuccess('');
      }, 3000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleJoinHouse = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await houseService.joinHouse(houseKey);
    
    if (result.success) {
      setSuccess('Successfully joined house!');
      setHouseKey('');
      fetchHouses();
      setTimeout(() => {
        setShowJoinModal(false);
        setSuccess('');
      }, 2000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Monthly Budget Application</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}!</span>
          <button onClick={handleLogout} className="btn-secondary">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="actions-bar">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create House
          </button>
          <button onClick={() => setShowJoinModal(true)} className="btn-primary">
            Join House
          </button>
        </div>

        <div className="houses-grid">
          <h2>My Houses</h2>
          {houses.length === 0 ? (
            <p className="no-houses">You haven't created or joined any houses yet.</p>
          ) : (
            <div className="houses-list">
              {houses.map((house) => (
                <div key={house.id} className="house-card" onClick={() => navigate(`/house/${house.id}`)}>
                  <h3>{house.name}</h3>
                  <div className="house-info">
                    <span className="house-key">Key: {house.houseKey}</span>
                    <span className={`role-badge role-${house.role}`}>{house.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New House</h2>
            <form onSubmit={handleCreateHouse}>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="form-group">
                <label htmlFor="houseName">House Name</label>
                <input
                  type="text"
                  id="houseName"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  required
                  placeholder="Enter house name"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Join House</h2>
            <form onSubmit={handleJoinHouse}>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="form-group">
                <label htmlFor="houseKey">House Key</label>
                <input
                  type="text"
                  id="houseKey"
                  value={houseKey}
                  onChange={(e) => setHouseKey(e.target.value)}
                  required
                  placeholder="Enter 6-digit house key"
                  maxLength={6}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
