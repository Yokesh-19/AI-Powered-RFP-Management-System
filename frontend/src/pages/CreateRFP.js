import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { rfpAPI } from '../services/api';

const CreateRFP = () => {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await rfpAPI.create(description);                 //sends a post request to backend (api/rfps)
      toast.success('RFP created successfully!');
      console.log('Created RFP:', response.data);
      // Use the _id field for navigation
      const rfpId = response.data._id || response.data.id;                     //id of the new rfp
      navigate(`/rfps/${rfpId}`);                                   //navigating to rfp details page to view and select vendor
    } catch (error) {
      console.error('Error creating RFP:', error);
      toast.error(error.response?.data?.error || 'Failed to create RFP');
    } finally {
      setIsLoading(false);
    }
  };

  const examples = [
    "I need 20 laptops with 16GB RAM and 512GB SSD, 15 external monitors, budget is $50,000, delivery needed within 30 days",
    "Looking for office furniture: 25 desks, 25 chairs, 5 meeting tables, 2 whiteboards. Budget around $15,000, delivery in 2 weeks",
    "Need catering services for company event: 200 people, lunch and dinner, vegetarian options required, event date is next month, budget $8,000"
  ];

  return (
    <div>
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 className="text-lg font-bold mb-4">Create New RFP</h2>
        <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
          Describe what you need in plain English. Our AI will convert it into a structured RFP.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">RFP Description</label>
            <textarea
              className="form-textarea"
              rows="6"
              placeholder="Example: I need 20 laptops with 16GB RAM, 15 monitors, $50k budget, 30-day delivery..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate('/rfps')}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !description.trim()}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Creating RFP...
                </>
              ) : (
                'Create RFP'
              )}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <h4 className="font-bold mb-4">Example Descriptions:</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {examples.map((example, index) => (
              <div key={index} style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem' }}>
                <p className="text-sm">{example}</p>
                <button
                  type="button"
                  onClick={() => setDescription(example)}
                  className="text-sm"
                  style={{ color: '#2563eb', marginTop: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                  disabled={isLoading}
                >
                  Use this example
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRFP;