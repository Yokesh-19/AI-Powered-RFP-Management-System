import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div>
      <nav className="nav">
        <div className="container">
          <div className="nav-content">
            <h1 className="nav-title">RFP Management System</h1>
            <div className="nav-links">
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/rfps" 
                className={`nav-link ${isActive('/rfps') ? 'active' : ''}`}
              >
                RFPs
              </Link>
              <Link 
                to="/vendors" 
                className={`nav-link ${isActive('/vendors') ? 'active' : ''}`}
              >
                Vendors
              </Link>
              <Link 
                to="/emails" 
                className={`nav-link ${isActive('/emails') ? 'active' : ''}`}
              >
                📧 Inbox
              </Link>
            </div>
            <div className="flex gap-4">
              {location.pathname === '/rfps' && (
                <Link to="/rfps/create" className="btn btn-primary">
                  + Create RFP
                </Link>
              )}
              {location.pathname === '/vendors' && (
                <Link to="/vendors/create" className="btn btn-primary">
                  + Add Vendor
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container" style={{ padding: '2rem 20px' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;