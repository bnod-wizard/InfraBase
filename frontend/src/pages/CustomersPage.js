import React, { useState } from 'react';
import CustomerList from '../components/CustomerList';
import Modal from '../components/Modal';
import CustomerDetail from '../components/CustomerDetail';

/**
 * Customers Page - Main customers management page
 */
function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddCustomer = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Refresh the customer list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <CustomerList 
        onAddClick={handleAddCustomer}
        refreshKey={refreshKey}
      />
      
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Customer"
      >
        <CustomerDetail 
          customerId="new"
          onClose={handleCloseModal}
          isModal={true}
        />
      </Modal>
    </>
  );
}

export default CustomersPage;
