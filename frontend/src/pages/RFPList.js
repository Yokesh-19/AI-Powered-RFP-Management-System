import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { rfpAPI } from '../services/api';
import toast from 'react-hot-toast';

const RFPList = () => {
  const [rfps, setRfps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRFPs();
  }, []);

  const fetchRFPs = async () => {
    try {
      const response = await rfpAPI.getAll();
      setRfps(response.data);
    } catch (error) {
      console.error('Error fetching RFPs:', error);
      toast.error('Failed to fetch RFPs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will also delete all related proposals.`)) {
      return;
    }

    try {
      await rfpAPI.delete(id);
      toast.success('RFP deleted successfully');
      fetchRFPs();
    } catch (error) {
      console.error('Error deleting RFP:', error);
      toast.error('Failed to delete RFP');
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      DRAFT: 'status-badge status-draft',
      SENT: 'status-badge status-sent',
      RECEIVING_PROPOSALS: 'status-badge status-receiving',
      EVALUATING: 'status-badge status-evaluating',
      COMPLETED: 'status-badge status-completed',
      CANCELLED: 'status-badge status-draft',
    };
    return classes[status] || 'status-badge status-draft';
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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-lg font-bold">RFPs</h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            Manage your Request for Proposals and track vendor responses.
          </p>
        </div>
      </div>

      {rfps.length === 0 ? (
        <div className="text-center" style={{ padding: '3rem' }}>
          <h3 className="font-bold mb-4">No RFPs</h3>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
            Get started by creating your first RFP.
          </p>
          <Link to="/rfps/create" className="btn btn-primary">
            Create RFP
          </Link>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Budget</th>
                <th>Vendors</th>
                <th>Proposals</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rfps.map((rfp) => (
                <tr key={rfp.id}>
                  <td>
                    <div>
                      <div className="font-bold">{rfp.title}</div>
                      <div className="text-sm" style={{ color: '#6b7280', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rfp.description}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={getStatusClass(rfp.status)}>
                      {rfp.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {rfp.budget ? `$${rfp.budget.toLocaleString()}` : '-'}
                  </td>
                  <td>
                    {rfp.rfpVendors?.length || 0}
                  </td>
                  <td>
                    {rfp.proposals?.length || 0}
                  </td>
                  <td className="text-sm" style={{ color: '#6b7280' }}>
                    {format(new Date(rfp.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td>
                    <Link
                      to={`/rfps/${rfp.id}`}
                      style={{ color: '#2563eb', textDecoration: 'none', marginRight: '1rem' }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(rfp.id, rfp.title)}
                      style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RFPList;