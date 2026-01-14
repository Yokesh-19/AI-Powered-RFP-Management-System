import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rfpAPI, vendorAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRFPs: 0,
    totalVendors: 0,
    activeRFPs: 0,
    completedRFPs: 0
  });
  const [recentRFPs, setRecentRFPs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [rfpsResponse, vendorsResponse] = await Promise.all([
        rfpAPI.getAll(),
        vendorAPI.getAll()
      ]);

      const rfps = rfpsResponse.data;
      const vendors = vendorsResponse.data;

      setStats({
        totalRFPs: rfps.length,
        totalVendors: vendors.length,
        activeRFPs: rfps.filter(rfp => ['DRAFT', 'SENT', 'RECEIVING_PROPOSALS'].includes(rfp.status)).length,
        completedRFPs: rfps.filter(rfp => rfp.status === 'COMPLETED').length
      });

      setRecentRFPs(rfps.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center" style={{ padding: '4rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-bold mb-4">RFP Management Dashboard</h1>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card text-center">
          <h3 className="text-lg font-bold" style={{ color: '#2563eb' }}>{stats.totalRFPs}</h3>
          <p className="text-sm" style={{ color: '#6b7280' }}>Total RFPs</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-bold" style={{ color: '#059669' }}>{stats.totalVendors}</h3>
          <p className="text-sm" style={{ color: '#6b7280' }}>Total Vendors</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-bold" style={{ color: '#d97706' }}>{stats.activeRFPs}</h3>
          <p className="text-sm" style={{ color: '#6b7280' }}>Active RFPs</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-bold" style={{ color: '#7c3aed' }}>{stats.completedRFPs}</h3>
          <p className="text-sm" style={{ color: '#6b7280' }}>Completed RFPs</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-bold mb-4">Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/rfps/create" className="btn btn-primary">
              🚀 Create New RFP
            </Link>
            <Link to="/vendors/create" className="btn btn-secondary">
              👥 Add Vendor
            </Link>
            <Link to="/emails" className="btn btn-secondary">
              📧 Check Email Inbox
            </Link>
            <Link to="/rfps" className="btn btn-secondary">
              📋 View All RFPs
            </Link>
          </div>
        </div>
        
        {/* Recent RFPs */}
        <div className="card">
          <h3 className="font-bold mb-4">Recent RFPs</h3>
          {recentRFPs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentRFPs.map(rfp => (
                <div key={rfp.id || rfp._id} style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
                  <div className="font-bold text-sm">{rfp.title}</div>
                  <div className="text-sm" style={{ color: '#6b7280' }}>
                    Status: {rfp.status} • Budget: {rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'N/A'}
                  </div>
                  <Link 
                    to={`/rfps/${rfp.id || rfp._id}`}
                    className="text-sm"
                    style={{ color: '#2563eb', textDecoration: 'none' }}
                  >
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#6b7280' }}>
              No RFPs created yet. <Link to="/rfps/create" style={{ color: '#2563eb' }}>Create your first RFP</Link>
            </p>
          )}
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 className="font-bold mb-4">🎯 Complete Workflow Demo</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <h4 className="font-bold text-sm mb-2">1. Create RFP</h4>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Use natural language: "I need 20 laptops with 16GB RAM, budget $50000"
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-2">2. Add Vendors</h4>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Add vendor contact information and email addresses
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-2">3. Send RFP</h4>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Select vendors and send RFP via email integration
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-2">4. AI Analysis</h4>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Receive proposals, AI parses and compares automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;