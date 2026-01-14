import React, { useState, useEffect } from 'react';
import { proposalAPI, emailAPI } from '../services/api';
import toast from 'react-hot-toast';

const EmailInbox = () => {
  const [proposals, setProposals] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [autoPolling, setAutoPolling] = useState(false);

  useEffect(() => {
    fetchAllProposals();
  }, []);

  useEffect(() => {
    let interval;
    if (autoPolling) {
      interval = setInterval(() => {
        checkForNewEmails();
      }, 30000); // Check every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoPolling]);

  const fetchAllProposals = async () => {
    try {
      const response = await proposalAPI.getAll();
      setProposals(response.data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };

  const checkForNewEmails = async () => {
    setIsChecking(true);
    try {
      const response = await emailAPI.checkForNew();
      const data = response.data;
      
      if (data.emailsProcessed > 0) {
        toast.success(`📧 ${data.emailsProcessed} new email(s) received and parsed!`);
        fetchAllProposals();
      } else {
        toast('No new emails', { icon: '📭' });
      }
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking emails:', error);
      toast.error('Failed to check emails. Ensure Gmail is configured.');
    } finally {
      setIsChecking(false);
    }
  };

  const toggleAutoPolling = async () => {
    try {
      if (autoPolling) {
        await emailAPI.stopPolling();
        toast.success('Auto-polling stopped');
      } else {
        await emailAPI.startPolling();
        toast.success('Auto-polling started (every 30s)');
      }
      setAutoPolling(!autoPolling);
    } catch (error) {
      toast.error('Failed to toggle polling');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PARSED': return '#16a34a';
      case 'INCOMPLETE': return '#f59e0b';
      case 'ERROR': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-lg font-bold">📧 Email Inbox</h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            Vendor responses received via email
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={checkForNewEmails}
            disabled={isChecking}
            className="btn btn-primary"
          >
            {isChecking ? (
              <>
                <div className="spinner"></div>
                Checking...
              </>
            ) : (
              '🔄 Check for New Emails'
            )}
          </button>
          <button
            onClick={toggleAutoPolling}
            className={autoPolling ? 'btn btn-secondary' : 'btn btn-primary'}
          >
            {autoPolling ? '⏸️ Stop Auto-Check' : '▶️ Start Auto-Check'}
          </button>
        </div>
      </div>

      {lastChecked && (
        <div style={{ padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          <p className="text-sm">
            Last checked: {lastChecked.toLocaleTimeString()}
            {autoPolling && <span style={{ marginLeft: '1rem', color: '#16a34a' }}>● Auto-checking every 30 seconds</span>}
          </p>
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h3 className="font-bold mb-4">📭 No Emails Received Yet</h3>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
            Vendor responses will appear here automatically when received.
          </p>
          <button onClick={checkForNewEmails} className="btn btn-primary">
            Check Gmail Now
          </button>
        </div>
      ) : (
        <div className="card">
          <h3 className="font-bold mb-4">Received Proposals ({proposals.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {proposals.map((proposal) => (
              <div
                key={proposal.id || proposal._id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  backgroundColor: proposal.receivedViaEmail ? '#f0fdf4' : '#f9fafb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold">{proposal.vendor?.name || 'Unknown Vendor'}</h4>
                      {proposal.receivedViaEmail && (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#16a34a', color: 'white', borderRadius: '0.25rem' }}>
                          📧 Email
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                      {proposal.emailFrom || proposal.vendor?.email}
                    </p>
                    {proposal.emailSubject && (
                      <p className="text-sm" style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                        Subject: {proposal.emailSubject}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        backgroundColor: getStatusColor(proposal.status) + '20',
                        color: getStatusColor(proposal.status)
                      }}
                    >
                      {proposal.status}
                    </span>
                    <p className="text-sm" style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                      {new Date(proposal.receivedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <strong>Total Price:</strong> {proposal.totalPrice ? `$${proposal.totalPrice.toLocaleString()}` : 'Not extracted'}
                  </div>
                  <div>
                    <strong>Delivery:</strong> {proposal.deliveryDate ? new Date(proposal.deliveryDate).toLocaleDateString() : 'Not specified'}
                  </div>
                  <div>
                    <strong>Warranty:</strong> {proposal.warranty || 'Not specified'}
                  </div>
                  <div>
                    <strong>Complete:</strong> {proposal.isComplete ? '✅ Yes' : '⚠️ Incomplete'}
                  </div>
                </div>

                {proposal.aiSummary && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                    <strong>AI Summary:</strong> {proposal.aiSummary}
                  </div>
                )}

                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    📄 View Raw Email Content
                  </summary>
                  <pre style={{ 
                    padding: '1rem', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '0.375rem', 
                    fontSize: '0.875rem',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {proposal.rawContent}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-4" style={{ backgroundColor: '#fffbeb', border: '1px solid #fbbf24' }}>
        <h4 className="font-bold mb-2">💡 How Email Receiving Works</h4>
        <ol style={{ paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
          <li>Vendors reply to RFP emails sent from {process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'your email'}</li>
          <li>System checks Gmail inbox for new emails with "RFP" in subject</li>
          <li>AI automatically extracts pricing, delivery, warranty, and terms</li>
          <li>Proposals appear here and in the RFP detail page</li>
          <li>Click "Check for New Emails" manually or enable auto-checking</li>
        </ol>
      </div>
    </div>
  );
};

export default EmailInbox;
