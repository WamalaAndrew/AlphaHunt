import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const trackingId = searchParams.get('trackingId');

  return (
    <div className="p-8 text-center">
      {status === 'success' ? (
        <div>
          <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
          <p className="mt-2">Thank you for your payment.</p>
          <p className="mt-1">Tracking ID: {trackingId}</p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-red-600">Payment Failed</h2>
          <p className="mt-2">Something went wrong with your payment. Please try again.</p>
        </div>
      )}
      <Link to="/" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded">
        Back to Home
      </Link>
    </div>
  );
};
