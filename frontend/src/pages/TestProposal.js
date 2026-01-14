import React, { useState } from 'react';
import { proposalAPI } from '../services/api';
import toast from 'react-hot-toast';

const TestProposal = () => {
  const [formData, setFormData] = useState({
    rfpId: '69673cf535e08fa3b1a285d6',
    vendorId: '696676e616ec6a7814026dc1',
    rawContent: 'We can provide 20 laptops at $1,200 each = $24,000 and 15 monitors at $350 each = $5,250. Total: $29,250. Delivery in 25 days. 2-year warranty included.'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await proposalAPI.create(formData);
      toast.success('Proposal submitted successfully!');
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit proposal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2 className="text-lg font-bold mb-4">Test: Submit Vendor Proposal</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">RFP ID</label>
          <input
            type="text"
            className="form-input"
            value={formData.rfpId}
            onChange={(e) => setFormData({...formData, rfpId: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Vendor ID</label>
          <input
            type="text"
            className="form-input"
            value={formData.vendorId}
            onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Vendor Response (Raw Content)</label>
          <textarea
            className="form-textarea"
            rows="6"
            value={formData.rawContent}
            onChange={(e) => setFormData({...formData, rawContent: e.target.value})}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Submitting...' : 'Submit Proposal'}
        </button>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
        <h4 className="font-bold mb-2">Instructions:</h4>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li>Update RFP ID from your RFP URL</li>
          <li>Get Vendor ID from: <a href="http://localhost:3001/api/vendors" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>http://localhost:3001/api/vendors</a></li>
          <li>Edit the vendor response text if needed</li>
          <li>Click Submit Proposal</li>
          <li>Go back to RFP page and refresh to see the proposal</li>
        </ol>
      </div>
    </div>
  );
};

export default TestProposal;
