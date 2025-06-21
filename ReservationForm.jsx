import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('your-publishable-key');

const ReservationForm = () => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', date: '', time: '', guests: 1
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stripe = await stripePromise;
    const elements = stripe.elements();
    const card = elements.create('card');
    card.mount('#card-element');

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card,
      billing_details: { name: form.name, email: form.email, phone: form.phone }
    });

    if (error) return setMessage(error.message);

    const res = await fetch('/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, paymentMethodId: paymentMethod.id })
    });
    const data = await res.json();
    if (data.success) setMessage('Reservation confirmed! Check your email.');
    else setMessage(data.message);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded shadow">
      <h2 className="text-xl font-bold">Reserve a Table</h2>
      {['name', 'email', 'phone', 'date', 'time'].map(field => (
        <input key={field} id={field} type={field === 'email' ? 'email' : 'text'} placeholder={field} value={form[field]} onChange={handleChange} className="w-full p-2 border rounded" required />
      ))}
      <input id="guests" type="number" min="1" max="25" placeholder="Number of Guests" value={form.guests} onChange={handleChange} className="w-full p-2 border rounded" required />
      <div id="card-element" className="p-2 border rounded"></div>
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Book Now</button>
      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </form>
  );
};

export default ReservationForm;