import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { rfpAPI, vendorAPI, proposalAPI } from '../services/api';
import toast from 'react-hot-toast';

const RFPDetail = () => {
  const { id } = useParams();
  const [rfp, setRfp] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [rfpResponse, vendorsResponse, proposalsResponse] = await Promise.all([
        rfpAPI.getById(id),
        vendorAPI.getAll(),
        proposalAPI.getByRFP(id)
      ]);
      
      setRfp(rfpResponse.data);
      setVendors(vendorsResponse.data);
      setProposals(proposalsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Don't show error toast, just log it
      console.log('Some data failed to load, but continuing...');
      
      // Try to fetch at least the RFP
      try {
        const rfpResponse = await rfpAPI.getById(id);
        setRfp(rfpResponse.data);
      } catch (rfpError) {
        console.error('Failed to fetch RFP:', rfpError);
      }
      
      // Try to fetch vendors
      try {
        const vendorsResponse = await vendorAPI.getAll();
        setVendors(vendorsResponse.data);
      } catch (vendorError) {
        console.error('Failed to fetch vendors:', vendorError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRFP = async () => {
    if (selectedVendors.length === 0) {
      toast.error('Please select at least one vendor');
      return;
    }

    setIsSending(true);
    try {
      await rfpAPI.sendToVendors(id, selectedVendors);
      toast.success('RFP sent to selected vendors!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error sending RFP:', error);
      toast.error('Failed to send RFP');
    } finally {
      setIsSending(false);
    }
  };

  const handleVendorSelect = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleCompareProposals = async () => {
    setIsComparing(true);
    try {
      const response = await proposalAPI.compare(id);
      setComparison(response.data);
      toast.success('Proposals compared successfully!');
    } catch (error) {
      console.error('Error comparing proposals:', error);
      toast.error('Failed to compare proposals');
    } finally {
      setIsComparing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center" style={{ padding: '4rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
      </div>
    );
  }

  if (!rfp) {
    return <div className="text-center">RFP not found</div>;
  }

  return (
    <div>
      <div className="card mb-4">
        <h1 className="text-lg font-bold mb-4">{rfp.title}</h1>
        <p className="mb-4">{rfp.description}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <strong>Status:</strong> {rfp.status.replace('_', ' ')}
          </div>
          <div>
            <strong>Budget:</strong> {rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'Not specified'}
          </div>
          <div>
            <strong>Delivery Date:</strong> {rfp.deliveryDate ? new Date(rfp.deliveryDate).toLocaleDateString() : 'Not specified'}
          </div>
        </div>

        {rfp.items && rfp.items.length > 0 && (
          <div>
            <h3 className="font-bold mb-4">Items Requested:</h3>
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Specifications</th>
                  </tr>
                </thead>
                <tbody>
                  {rfp.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.specifications || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {rfp.status === 'DRAFT' && (
        <div className="card mb-4">
          <h3 className="font-bold mb-4">Send to Vendors</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {vendors.map(vendor => (
              <label key={vendor.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
                <input
                  type="checkbox"
                  checked={selectedVendors.includes(vendor.id)}
                  onChange={() => handleVendorSelect(vendor.id)}
                />
                <div>
                  <div className="font-bold">{vendor.name}</div>
                  <div className="text-sm" style={{ color: '#6b7280' }}>{vendor.email}</div>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={handleSendRFP}
            disabled={isSending || selectedVendors.length === 0}
            className="btn btn-primary"
          >
            {isSending ? (
              <>
                <div className="spinner"></div>
                Sending...
              </>
            ) : (
              `Send to ${selectedVendors.length} vendor(s)`
            )}
          </button>
        </div>
      )}

      {proposals.length > 0 && (
        <div className="card">
          <h3 className="font-bold mb-4">Vendor Proposals ({proposals.length})</h3>
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Total Price</th>
                  <th>Delivery</th>
                  <th>Warranty</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map(proposal => (
                  <tr key={proposal.id || proposal._id}>
                    <td className="font-bold">{proposal.vendor?.name || 'Unknown Vendor'}</td>
                    <td>{proposal.totalPrice ? `$${proposal.totalPrice.toLocaleString()}` : 'N/A'}</td>
                    <td className="text-sm">{proposal.deliveryDate ? new Date(proposal.deliveryDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="text-sm">{proposal.warranty || 'N/A'}</td>
                    <td>
                      <span className={`status-badge status-${proposal.status.toLowerCase()}`}>
                        {proposal.status}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: '#6b7280' }}>
                      {new Date(proposal.receivedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {proposals.filter(p => p.status === 'PARSED' || p.status === 'INCOMPLETE').length >= 2 && (
            <div className="mt-4">
              <button
                onClick={handleCompareProposals}
                disabled={isComparing}
                className="btn btn-primary"
              >
                {isComparing ? (
                  <>
                    <div className="spinner"></div>
                    Analyzing...
                  </>
                ) : (
                  'Compare Proposals with AI'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {isComparing && (
        <div className="card mt-4" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f0f9ff' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
          <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>🤖 AI is analyzing proposals...</p>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            Comparing pricing, delivery terms, warranty, and compliance with requirements
          </p>
        </div>
      )}

      {comparison && (
        <div className="card mt-4">
          {/* Prominent Recommendation Banner */}
          {comparison.recommendation && (
            <div style={{ 
              padding: '2rem', 
              backgroundColor: '#10b981', 
              color: 'white',
              borderRadius: '0.5rem', 
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                ✅ RECOMMENDED VENDOR
              </h2>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                {proposals.find(p => p.vendorId === comparison.recommendation.recommendedVendorId)?.vendor?.name || 'N/A'}
              </h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                {comparison.recommendation.reasoning}
              </p>
              {comparison.recommendation.priceSavings && (
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  💰 Save ${comparison.recommendation.priceSavings.toLocaleString()} vs alternatives
                </p>
              )}
            </div>
          )}

          <h2 className="text-lg font-bold mb-4">🎯 AI Proposal Comparison</h2>
          
          {/* Executive Summary */}
          <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #2563eb' }}>
            <h3 className="font-bold mb-2">Executive Summary</h3>
            <p>{comparison.summary}</p>
          </div>

          {/* Recommendation */}
          {comparison.recommendation && (
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #16a34a' }}>
              <h3 className="font-bold mb-2">✅ Recommendation</h3>
              <p className="mb-2"><strong>Recommended Vendor:</strong> {proposals.find(p => p.vendorId === comparison.recommendation.recommendedVendorId)?.vendor?.name || 'N/A'}</p>
              <p className="mb-2">{comparison.recommendation.reasoning}</p>
              {comparison.recommendation.priceSavings && (
                <p className="mb-2" style={{ color: '#16a34a', fontWeight: 'bold' }}>💰 Potential Savings: ${comparison.recommendation.priceSavings.toLocaleString()}</p>
              )}
              {comparison.recommendation.keyAdvantages && comparison.recommendation.keyAdvantages.length > 0 && (
                <div className="mb-2">
                  <strong>Key Advantages:</strong>
                  <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                    {comparison.recommendation.keyAdvantages.map((adv, i) => <li key={i}>{adv}</li>)}
                  </ul>
                </div>
              )}
              {comparison.recommendation.considerations && comparison.recommendation.considerations.length > 0 && (
                <div>
                  <strong>Considerations:</strong>
                  <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                    {comparison.recommendation.considerations.map((con, i) => <li key={i}>{con}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Detailed Analysis */}
          <h3 className="font-bold mb-4">Detailed Vendor Analysis</h3>
          {comparison.analysis && comparison.analysis.map((analysis, index) => {
            const proposal = proposals.find(p => p.vendorId === analysis.vendorId);
            const isRecommended = analysis.vendorId === comparison.recommendation?.recommendedVendorId;
            
            return (
              <div 
                key={analysis.vendorId} 
                style={{ 
                  padding: '1.5rem', 
                  border: isRecommended ? '2px solid #16a34a' : '1px solid #e5e7eb', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem',
                  backgroundColor: isRecommended ? '#f0fdf4' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h4 className="font-bold" style={{ fontSize: '1.1rem' }}>
                      #{analysis.rank} {proposal?.vendor?.name || 'Unknown Vendor'}
                      {isRecommended && <span style={{ marginLeft: '0.5rem', color: '#16a34a' }}>⭐ RECOMMENDED</span>}
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: analysis.score >= 80 ? '#16a34a' : analysis.score >= 60 ? '#f59e0b' : '#dc2626' }}>
                      {analysis.score}/100
                    </div>
                    <div className="text-sm" style={{ color: '#6b7280' }}>Overall Score</div>
                  </div>
                </div>

                {/* Score Breakdown */}
                {analysis.scoreBreakdown && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
                    <strong>Score Breakdown:</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div>💰 Price: {analysis.scoreBreakdown.price}/40</div>
                      <div>🚚 Delivery: {analysis.scoreBreakdown.delivery}/25</div>
                      <div>🛡️ Warranty: {analysis.scoreBreakdown.warranty}/15</div>
                      <div>📋 Terms: {analysis.scoreBreakdown.terms}/10</div>
                      <div>✅ Complete: {analysis.scoreBreakdown.completeness}/10</div>
                    </div>
                  </div>
                )}

                {/* Compliance Check */}
                {analysis.complianceCheck && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: analysis.complianceCheck.overallCompliance === 'FULL' ? '#f0fdf4' : '#fef3c7', borderRadius: '0.375rem' }}>
                    <strong>Compliance: </strong>
                    <span style={{ fontWeight: 'bold', color: analysis.complianceCheck.overallCompliance === 'FULL' ? '#16a34a' : '#f59e0b' }}>
                      {analysis.complianceCheck.overallCompliance}
                    </span>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      <span>{analysis.complianceCheck.meetsBudget ? '✅' : '❌'} Budget</span>
                      <span>{analysis.complianceCheck.meetsDelivery ? '✅' : '❌'} Delivery</span>
                      <span>{analysis.complianceCheck.meetsWarranty ? '✅' : '❌'} Warranty</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  {/* Pros */}
                  <div>
                    <strong style={{ color: '#16a34a' }}>✅ Pros:</strong>
                    <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      {analysis.pros && analysis.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <strong style={{ color: '#dc2626' }}>❌ Cons:</strong>
                    <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      {analysis.cons && analysis.cons.map((con, i) => <li key={i}>{con}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Value Adds */}
                {analysis.valueAdds && analysis.valueAdds.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>🎁 Value Adds:</strong>
                    <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      {analysis.valueAdds.map((add, i) => <li key={i}>{add}</li>)}
                    </ul>
                  </div>
                )}

                {/* Risk Factors */}
                {analysis.riskFactors && analysis.riskFactors.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#f59e0b' }}>⚠️ Risk Factors:</strong>
                    <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      {analysis.riskFactors.map((risk, i) => <li key={i}>{risk}</li>)}
                    </ul>
                  </div>
                )}

                {/* Notes */}
                {analysis.notes && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                    <strong>Notes:</strong> {analysis.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RFPDetail;