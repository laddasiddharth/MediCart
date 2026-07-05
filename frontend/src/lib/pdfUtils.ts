import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePDF = (order: any, orderItems: any[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("MediCart", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Your trusted online pharmacy", 14, 30);
  
  // Invoice Details
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("INVOICE", 150, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Order ID: #${order.id}`, 150, 30);
  doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 150, 36);
  doc.text(`Status: ${order.status.toUpperCase()}`, 150, 42);

  // Customer Info
  doc.setFontSize(12);
  doc.text("Bill To:", 14, 50);
  doc.setFontSize(10);
  doc.text(`Name: ${order.customerName || "N/A"}`, 14, 58);
  doc.text(`Email: ${order.customerEmail || "N/A"}`, 14, 64);
  doc.text(`Address: ${order.deliveryAddress || ""}, ${order.deliveryCity || ""} ${order.deliveryState || ""} - ${order.deliveryPincode || ""}`, 14, 70);

  // Table
  const tableColumn = ["Item", "Unit Price", "Qty", "Total"];
  const tableRows: any[] = [];

  orderItems.forEach(item => {
    const itemData = [
      item.medicineName,
      `Rs. ${parseFloat(item.priceAtTime).toFixed(2)}`,
      item.quantity,
      `Rs. ${(parseFloat(item.priceAtTime) * item.quantity).toFixed(2)}`
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 85,
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94] },
  });

  // Footer / Totals
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  
  doc.setFontSize(11);
  doc.text(`Subtotal: Rs. ${parseFloat(order.totalAmount).toFixed(2)}`, 140, finalY + 10);
  doc.text(`Shipping: Free`, 140, finalY + 16);
  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94);
  doc.text(`Total: Rs. ${parseFloat(order.totalAmount).toFixed(2)}`, 140, finalY + 26);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for choosing MediCart!", 14, finalY + 40);

  doc.save(`Invoice_MediCart_Order_${order.id}.pdf`);
};
