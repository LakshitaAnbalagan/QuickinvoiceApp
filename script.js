// script.js

document.addEventListener('DOMContentLoaded', () => {
    const invoiceList = document.getElementById('invoiceList');
  
    // Show loading message
    invoiceList.innerHTML = '<p>Loading invoices...</p>';
  
    // Fetch data from backend
    fetch('https://quickinvoiceapp-2.onrender.com')

      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch invoices. Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Clear previous content
        invoiceList.innerHTML = '';
  
        if (!Array.isArray(data) || data.length === 0) {
          invoiceList.innerHTML = '<p>No invoices available.</p>';
          return;
        }
  
        // Render each invoice
        data.forEach(inv => {
          const card = document.createElement('div');
          card.className = 'invoice-card';
  
          card.innerHTML = `
            <h3>${inv.customerName}</h3>
            <p><strong>Product:</strong> ${inv.product}</p>
            <p><strong>Quantity:</strong> ${inv.quantity}</p>
            <p><strong>Price:</strong> ₹${inv.price}</p>
            <p><strong>Date:</strong> ${new Date(inv.date).toLocaleDateString()}</p>
          `;
  
          invoiceList.appendChild(card);
        });
      })
      .catch(error => {
        console.error('Error loading invoices:', error);
        invoiceList.innerHTML = '<p>Error loading invoices. Please try again later.</p>';
      });
  });
  