import React, { useState } from 'react';

export const PaymentForm = () => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'UGX',
    email: '',
    name: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.error || 'Failed to initiate payment');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="p-4 border rounded shadow space-y-4">
      <h3 className="text-lg font-bold">Complete Payment</h3>
      <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleInputChange} required className="w-full p-2 border rounded" />
      <select name="currency" value={formData.currency} onChange={handleInputChange} className="w-full p-2 border rounded">
        <option value="UGX">UGX</option>
        <option value="USD">USD</option>
      </select>
      <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} required className="w-full p-2 border rounded" />
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required className="w-full p-2 border rounded" />
      <input type="tel" name="phoneNumber" placeholder="Phone Number (e.g., 256771234567)" value={formData.phoneNumber} onChange={handleInputChange} required className="w-full p-2 border rounded" />
      
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Processing...' : 'Pay with Pesapal'}
      </button>
    </form>
  );
};
