import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { budgetService } from '../services/budgetService';
import { paymentService } from '../services/paymentService';
import { rentService } from '../services/rentService';
import { statisticsService } from '../services/statisticsService';
import { houseService } from '../services/houseService';
import './BudgetManagement.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function BudgetManagement() {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [budget, setBudget] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [rentPayment, setRentPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('budget');
  
  // Budget form state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCategories, setBudgetCategories] = useState([
    { name: 'groceries', amount: 0 },
    { name: 'wifi', amount: 0 },
    { name: 'gas', amount: 0 },
    { name: 'electricity', amount: 0 }
  ]);
  
  // Payment form state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    category: 'groceries',
    amount: '',
    description: '',
    receipt: null,
    contributions: []
  });
  
  // Rent form state
  const [showRentModal, setShowRentModal] = useState(false);
  const [rentData, setRentData] = useState({
    totalAmount: '',
    receipt: null,
    contributions: []
  });

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houseId, currentMonth, currentYear]);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    
    // Fetch house details
    const houseResult = await houseService.getHouseDetails(houseId);
    if (houseResult.success) {
      setHouse(houseResult.data.house);
    }
    
    // Fetch budget
    const budgetResult = await budgetService.getBudget(houseId, currentYear, currentMonth);
    if (budgetResult.success) {
      setBudget(budgetResult.data.budget);
      
      // Fetch statistics if budget exists
      const statsResult = await statisticsService.getStatistics(houseId, currentYear, currentMonth);
      if (statsResult.success) {
        setStatistics(statsResult.data.statistics);
      }
    } else {
      setBudget(null);
      setStatistics(null);
    }
    
    // Fetch rent payment
    const rentResult = await rentService.getRentPayment(houseId, currentYear, currentMonth);
    if (rentResult.success) {
      setRentPayment(rentResult.data.rentPayment);
    } else {
      setRentPayment(null);
    }
    
    setLoading(false);
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const result = await budgetService.createOrUpdateBudget(houseId, {
      month: currentMonth,
      year: currentYear,
      categories: budgetCategories.filter(cat => cat.amount > 0)
    });
    
    if (result.success) {
      setSuccess('Budget created successfully!');
      setShowBudgetModal(false);
      fetchAllData();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!budget) {
      setError('Please create a budget first');
      return;
    }
    
    const result = await paymentService.createPayment(houseId, {
      ...paymentData,
      budgetId: budget._id
    });
    
    if (result.success) {
      setSuccess('Payment recorded successfully!');
      setShowPaymentModal(false);
      setPaymentData({
        category: 'groceries',
        amount: '',
        description: '',
        receipt: null,
        contributions: []
      });
      fetchAllData();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error);
    }
  };

  const handleCreateRent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const result = await rentService.createOrUpdateRent(houseId, {
      month: currentMonth,
      year: currentYear,
      ...rentData
    });
    
    if (result.success) {
      setSuccess('Rent payment recorded successfully!');
      setShowRentModal(false);
      setRentData({
        totalAmount: '',
        receipt: null,
        contributions: []
      });
      fetchAllData();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error);
    }
  };

  const canManageBudget = house && ['owner', 'admin', 'financier'].includes(house.userRole);
  const canManageRent = house && ['owner', 'admin', 'rent payer'].includes(house.userRole);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Prepare rent pie chart data
  const rentChartData = rentPayment && rentPayment.contributions.length > 0 ? {
    labels: rentPayment.contributions.map(c => c.userId.username),
    datasets: [{
      data: rentPayment.contributions.map(c => c.amount),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ]
    }]
  } : null;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="budget-management-container">
      <header className="budget-header">
        <button onClick={() => navigate(`/house/${houseId}`)} className="btn-back">
          ← Back to House
        </button>
        <h1>Budget Management</h1>
      </header>

      <div className="month-selector">
        <button onClick={() => {
          if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(currentYear - 1);
          } else {
            setCurrentMonth(currentMonth - 1);
          }
        }}>←</button>
        <h2>{monthNames[currentMonth - 1]} {currentYear}</h2>
        <button onClick={() => {
          if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(currentYear + 1);
          } else {
            setCurrentMonth(currentMonth + 1);
          }
        }}>→</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="tabs">
        <button 
          className={activeTab === 'budget' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('budget')}
        >
          Budget & Payments
        </button>
        <button 
          className={activeTab === 'rent' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('rent')}
        >
          Rent Payment
        </button>
        <button 
          className={activeTab === 'statistics' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
      </div>

      {activeTab === 'budget' && (
        <div className="budget-content">
          {!budget ? (
            <div className="no-budget">
              <p>No budget set for this month</p>
              {canManageBudget && (
                <button onClick={() => setShowBudgetModal(true)} className="btn-primary">
                  Create Budget
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="budget-summary">
                <h3>Budget Categories</h3>
                <div className="categories-list">
                  {budget.categories.map((cat, idx) => (
                    <div key={idx} className="category-item">
                      <span className="category-name">{cat.name}</span>
                      <span className="category-amount">${cat.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {canManageBudget && (
                <div className="action-buttons">
                  <button onClick={() => setShowBudgetModal(true)} className="btn-secondary">
                    Update Budget
                  </button>
                  <button onClick={() => setShowPaymentModal(true)} className="btn-primary">
                    Add Payment
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rent' && (
        <div className="rent-content">
          {!rentPayment ? (
            <div className="no-rent">
              <p>No rent payment recorded for this month</p>
              {canManageRent && (
                <button onClick={() => setShowRentModal(true)} className="btn-primary">
                  Record Rent Payment
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="rent-summary">
                <h3>Rent Payment Details</h3>
                <p className="rent-amount">Total: ${rentPayment.totalAmount}</p>
                {rentPayment.receiptUrl && (
                  <a href={rentPayment.receiptUrl} target="_blank" rel="noopener noreferrer">
                    View Receipt
                  </a>
                )}
              </div>
              
              {rentChartData && (
                <div className="rent-chart">
                  <h4>Rent Contributions</h4>
                  <Pie data={rentChartData} />
                </div>
              )}
              
              {canManageRent && (
                <button onClick={() => setShowRentModal(true)} className="btn-secondary">
                  Update Rent Payment
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className="statistics-content">
          {!statistics ? (
            <p>No statistics available. Please create a budget first.</p>
          ) : (
            <div>
              <div className="overall-stats">
                <div className="stat-card">
                  <h4>Total Budgeted</h4>
                  <p className="stat-value">${statistics.totalBudgeted}</p>
                </div>
                <div className="stat-card">
                  <h4>Total Spent</h4>
                  <p className="stat-value">${statistics.totalSpent}</p>
                </div>
                <div className="stat-card">
                  <h4>Remaining</h4>
                  <p className="stat-value">${statistics.totalRemaining}</p>
                </div>
              </div>

              <div className="category-stats">
                <h3>Category Breakdown</h3>
                {Object.entries(statistics.categoryStats).map(([category, data]) => (
                  <div key={category} className="category-stat">
                    <h4>{category}</h4>
                    <div className="stat-row">
                      <span>Budgeted: ${data.budgeted}</span>
                      <span>Spent: ${data.spent}</span>
                      <span>Remaining: ${data.remaining}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${(data.spent / data.budgeted) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="member-contributions">
                <h3>Member Contributions</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Contributed</th>
                      <th>Expected</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.memberContributions.map((member) => (
                      <tr key={member.userId}>
                        <td>{member.username}</td>
                        <td>${member.totalContributed.toFixed(2)}</td>
                        <td>${member.totalSpent.toFixed(2)}</td>
                        <td className={member.balance >= 0 ? 'positive' : 'negative'}>
                          ${member.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{budget ? 'Update' : 'Create'} Budget</h2>
            <form onSubmit={handleCreateBudget}>
              {budgetCategories.map((cat, idx) => (
                <div key={idx} className="form-group">
                  <label>{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</label>
                  <input
                    type="number"
                    value={cat.amount}
                    onChange={(e) => {
                      const newCategories = [...budgetCategories];
                      newCategories[idx].amount = parseFloat(e.target.value) || 0;
                      setBudgetCategories(newCategories);
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
              ))}
              <div className="modal-actions">
                <button type="button" onClick={() => setShowBudgetModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {budget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Payment</h2>
            <form onSubmit={handleCreatePayment}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={paymentData.category}
                  onChange={(e) => setPaymentData({ ...paymentData, category: e.target.value })}
                  required
                >
                  {budget && budget.categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={paymentData.description}
                  onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Receipt (optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setPaymentData({ ...paymentData, receipt: e.target.files[0] })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rent Modal */}
      {showRentModal && (
        <div className="modal-overlay" onClick={() => setShowRentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{rentPayment ? 'Update' : 'Record'} Rent Payment</h2>
            <form onSubmit={handleCreateRent}>
              <div className="form-group">
                <label>Total Amount</label>
                <input
                  type="number"
                  value={rentData.totalAmount}
                  onChange={(e) => setRentData({ ...rentData, totalAmount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Receipt (optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setRentData({ ...rentData, receipt: e.target.files[0] })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowRentModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {rentPayment ? 'Update' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetManagement;
