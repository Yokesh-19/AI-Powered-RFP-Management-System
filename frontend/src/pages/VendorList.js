import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vendorAPI } from '../services/api';
import toast from 'react-hot-toast';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await vendorAPI.getAll();                   //gets all vendors from backend
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to fetch vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await vendorAPI.delete(id);                                             //sends delete request to backend to delete vendor by id
      toast.success('Vendor deleted successfully');
      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-lg font-bold">Vendors</h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            Manage your vendor database and contact information.
          </p>
        </div>
      </div>

      {vendors.length === 0 ? (                                                  //if there is no vendor, it allows you to create new vendor
        <div className="text-center" style={{ padding: '3rem' }}>
          <h3 className="font-bold mb-4">No Vendors</h3>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
            Get started by adding your first vendor.
          </p>
          <Link to="/vendors/create" className="btn btn-primary">
            Add Vendor
          </Link>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Contact Person</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="font-bold">{vendor.name}</td>
                  <td>{vendor.email}</td>
                  <td>{vendor.phone || '-'}</td>
                  <td>{vendor.contactPerson || '-'}</td>
                  <td>
                    <Link
                      to={`/vendors/${vendor.id}/edit`}                                                        //navigates to edit page
                      style={{ color: '#2563eb', textDecoration: 'none', marginRight: '1rem' }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(vendor.id, vendor.name)}
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

export default VendorList;