import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RFPList from './pages/RFPList';
import CreateRFP from './pages/CreateRFP';
import RFPDetail from './pages/RFPDetail';
import VendorList from './pages/VendorList';
import CreateVendor from './pages/CreateVendor';
import EditVendor from './pages/EditVendor';
import EmailInbox from './pages/EmailInbox';
import TestProposal from './pages/TestProposal';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rfps" element={<RFPList />} />
            <Route path="/rfps/create" element={<CreateRFP />} />
            <Route path="/rfps/:id" element={<RFPDetail />} />
            <Route path="/vendors" element={<VendorList />} />
            <Route path="/vendors/create" element={<CreateVendor />} />
            <Route path="/vendors/:id/edit" element={<EditVendor />} />
            <Route path="/emails" element={<EmailInbox />} />
            {/* TestProposal - Development only */}
            {process.env.NODE_ENV === 'development' && (
              <Route path="/test-proposal" element={<TestProposal />} />
            )}
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;