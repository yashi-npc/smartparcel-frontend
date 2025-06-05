// utils/generateInvoice.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (parcel) => {
  const doc = new jsPDF();

  // Use item price as base amount
  const baseAmount = parseFloat(parcel.price || 0);
  // GST 18% (India standard)
  const gst = +(baseAmount * 0.18).toFixed(2);
  const total = +(baseAmount + gst).toFixed(2);

  // Header
  doc.setFontSize(18);
  doc.text('ShipWise Delivery Invoice', 20, 20);
  doc.setFontSize(12);
  doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, 30);
  doc.text(`Tracking ID: ${parcel.trackingId}`, 20, 38);

  // Recipient Info
  doc.text(`Recipient: ${parcel.recipientName}`, 20, 48);
  doc.text(`Recipient Email: ${parcel.recipientEmail}`, 20, 56);
  doc.text(`Recipient Phone: ${parcel.recipientPhone}`, 20, 64);
  doc.text(`Address: ${parcel.recipientAddress}`, 20, 72);
  doc.text(`Item: ${parcel.itemName || 'N/A'}`, 20, 80);
  doc.text(`Status: ${parcel.status}`, 20, 88);
  doc.text(`Created On: ${parcel.createdAt ? new Date(parcel.createdAt).toLocaleDateString() : 'N/A'}`, 20, 96);

  // Pricing Table
  autoTable(doc, {
    startY: 90,
    head: [['Description', 'Amount (₹)']],
    body: [
      ['Item Price', baseAmount.toFixed(2)],
      ['GST (18%)', gst.toFixed(2)],
      ['Total Amount', total.toFixed(2)],
    ],
  });

  // Footer
  doc.setFontSize(11);
  doc.text('Thank you for shipping with ShipWise!', 20, doc.lastAutoTable.finalY + 20);

  // Download
  doc.save(`invoice_${parcel.trackingId}.pdf`);
};
