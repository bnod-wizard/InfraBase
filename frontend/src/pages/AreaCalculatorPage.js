import React from 'react';
import AreaCalculatorModal from '../components/AreaCalculatorModal';

function AreaCalculatorPage() {
  return (
    <>
      <div className="topbar">
        <div className="crumbs">
          <b>Area Calculator</b>
        </div>
      </div>

      <div style={{ marginTop: '24px', maxWidth: '680px' }}>
        <AreaCalculatorModal asPage />
      </div>
    </>
  );
}

export default AreaCalculatorPage;
