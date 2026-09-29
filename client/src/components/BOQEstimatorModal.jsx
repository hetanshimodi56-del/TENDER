import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  Plus, 
  Trash2, 
  Download, 
  Check, 
  IndianRupee, 
  Sparkles,
  PieChart
} from 'lucide-react';
import { formatINR } from './TenderCard';
import { api } from '../services/api';

export default function BOQEstimatorModal({ tender, onClose, onApplyBid, onShowToast }) {
  const defaultItems = [
    { id: 1, name: 'Core Infrastructure Hardware & Edge Devices', unit: 'Lot', qty: 1, unitRate: Math.round((tender.estimated_value || 10000000) * 0.45), gst: 18, margin: 15 },
    { id: 2, name: 'System Software Licenses & Security Suite', unit: 'User/Lic', qty: 50, unitRate: Math.round((tender.estimated_value || 10000000) * 0.003), gst: 18, margin: 20 },
    { id: 3, name: 'Field Installation, Wiring & Civil Works', unit: 'Sites', qty: 10, unitRate: Math.round((tender.estimated_value || 10000000) * 0.015), gst: 18, margin: 12 },
    { id: 4, name: 'Testing, Commissioning & Integration', unit: 'Lump Sum', qty: 1, unitRate: Math.round((tender.estimated_value || 10000000) * 0.08), gst: 18, margin: 18 },
    { id: 5, name: '3-Year Comprehensive AMC & Technical Support', unit: 'Years', qty: 3, unitRate: Math.round((tender.estimated_value || 10000000) * 0.04), gst: 18, margin: 22 },
    { id: 6, name: 'Contingency & Site Escalation Provision', unit: 'Provision', qty: 1, unitRate: Math.round((tender.estimated_value || 10000000) * 0.03), gst: 18, margin: 10 }
  ];

  const [items, setItems] = useState(defaultItems);

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: 'Custom Line Item (Component / Service)',
      unit: 'Nos',
      qty: 1,
      unitRate: 100000,
      gst: 18,
      margin: 15
    };
    setItems([...items, newItem]);
  };

  const deleteItem = (id) => {
    if (items.length <= 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  // Calculations
  const calculatedItems = items.map(item => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.unitRate) || 0;
    const baseCost = qty * rate;
    const marginAmount = baseCost * ((Number(item.margin) || 0) / 100);
    const subtotalWithMargin = baseCost + marginAmount;
    const gstAmount = subtotalWithMargin * ((Number(item.gst) || 0) / 100);
    const lineTotal = subtotalWithMargin + gstAmount;

    return {
      ...item,
      baseCost,
      marginAmount,
      gstAmount,
      lineTotal
    };
  });

  const totalBase = calculatedItems.reduce((acc, c) => acc + c.baseCost, 0);
  const totalMargin = calculatedItems.reduce((acc, c) => acc + c.marginAmount, 0);
  const totalGST = calculatedItems.reduce((acc, c) => acc + c.gstAmount, 0);
  const finalQuotation = calculatedItems.reduce((acc, c) => acc + c.lineTotal, 0);
  const emdRequired = Math.round(finalQuotation * 0.02);

  const handleApplyBid = async () => {
    try {
      await api.updateBidStatus(tender.id, {
        status: 'preparing',
        bid_amount: Math.round(finalQuotation),
        note: `BOQ calculation completed: Base ₹${Math.round(totalBase).toLocaleString('en-IN')}, Margin ₹${Math.round(totalMargin).toLocaleString('en-IN')}, Total Quote ₹${Math.round(finalQuotation).toLocaleString('en-IN')}`
      });

      if (onShowToast) onShowToast(`Applied BOQ calculation (₹${formatINR(Math.round(finalQuotation))}) to your bid!`);
      if (onApplyBid) onApplyBid(Math.round(finalQuotation));
      onClose();
    } catch (err) {
      if (onShowToast) onShowToast('Failed to apply BOQ bid', 'error');
    }
  };

  const handleExportCSV = () => {
    let csv = 'Item Description,Unit,Quantity,Base Rate (INR),Base Total (INR),Margin %,GST %,Final Line Total (INR)\n';
    calculatedItems.forEach(item => {
      csv += `"${item.name}","${item.unit}",${item.qty},${item.unitRate},${item.baseCost},${item.margin}%,${item.gst}%,${Math.round(item.lineTotal)}\n`;
    });
    csv += `\nSUMMARY,,,,,,,\n`;
    csv += `Total Base Cost,,,,,,${Math.round(totalBase)}\n`;
    csv += `Total Margin Profit,,,,,,${Math.round(totalMargin)}\n`;
    csv += `Total GST Taxes,,,,,,${Math.round(totalGST)}\n`;
    csv += `FINAL TENDER QUOTE,,,,,,${Math.round(finalQuotation)}\n`;
    csv += `EMD Deposit 2%,,,,,,${emdRequired}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BOQ_Costing_${tender.tender_reference_no.replace(/[/\\?%*:|"<>]/g, '_')}.csv`;
    link.click();
    if (onShowToast) onShowToast('Exported BOQ sheet to CSV spreadsheet!');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 1040, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #059669, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(5, 150, 105, 0.4)'
            }}>
              <Calculator size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Interactive BOQ (Bill of Quantities) Financial Estimator
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                Cost modeling, tax breakdowns & profit margin analysis for {tender.tender_reference_no}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 6,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Financial KPI Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
          padding: '16px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Base Direct Cost
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
              ₹{Math.round(totalBase).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.67rem', color: '#64748b' }}>Hardware & Labor</div>
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.67rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
              Gross Margin Profit
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16a34a', margin: '2px 0' }}>
              ₹{Math.round(totalMargin).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.67rem', color: '#16a34a' }}>
              {totalBase > 0 ? ((totalMargin / totalBase) * 100).toFixed(1) : 0}% markup
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.67rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>
              GST Output Taxes
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7', margin: '2px 0' }}>
              ₹{Math.round(totalGST).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.67rem', color: '#64748b' }}>Pass-through tax</div>
          </div>

          <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: '0.67rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Quoted Bid
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857', margin: '2px 0' }}>
              ₹{Math.round(finalQuotation).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.67rem', color: '#059669' }}>
              {tender.estimated_value ? (finalQuotation < tender.estimated_value ? `-${(((tender.estimated_value - finalQuotation) / tender.estimated_value) * 100).toFixed(1)}% vs budget` : '+ over budget') : ''}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.67rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
              EMD Deposit (2%)
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b45309', margin: '2px 0' }}>
              ₹{emdRequired.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.67rem', color: '#64748b' }}>Bank guarantee lock-in</div>
          </div>
        </div>

        {/* Spreadsheet Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Line-Item Cost Breakdown Sheet
            </h4>
            <button
              onClick={addItem}
              className="btn btn-sm btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}
            >
              <Plus size={14} /> + Add Item
            </button>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px 12px', width: '35%' }}>Item Description</th>
                  <th style={{ padding: '10px 12px', width: '10%' }}>Unit</th>
                  <th style={{ padding: '10px 12px', width: '8%' }}>Qty</th>
                  <th style={{ padding: '10px 12px', width: '15%' }}>Unit Base Rate (₹)</th>
                  <th style={{ padding: '10px 12px', width: '10%' }}>Margin %</th>
                  <th style={{ padding: '10px 12px', width: '10%' }}>GST %</th>
                  <th style={{ padding: '10px 12px', width: '12%', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ padding: '10px 8px', width: '5%', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={item.name}
                        onChange={e => updateItem(item.id, 'name', e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={item.unit}
                        onChange={e => updateItem(item.id, 'unit', e.target.value)}
                        style={{ padding: '4px 6px', fontSize: '0.78rem', width: 65 }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={item.qty}
                        onChange={e => updateItem(item.id, 'qty', e.target.value)}
                        style={{ padding: '4px 6px', fontSize: '0.78rem', width: 60 }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={item.unitRate}
                        onChange={e => updateItem(item.id, 'unitRate', e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={item.margin}
                        onChange={e => updateItem(item.id, 'margin', e.target.value)}
                        style={{ padding: '4px 6px', fontSize: '0.78rem', width: 55 }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <select
                        className="form-select"
                        value={item.gst}
                        onChange={e => updateItem(item.id, 'gst', e.target.value)}
                        style={{ padding: '4px 6px', fontSize: '0.78rem', width: 65 }}
                      >
                        <option value={18}>18%</option>
                        <option value={12}>12%</option>
                        <option value={5}>5%</option>
                        <option value={0}>0%</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      ₹{Math.round(item.lineTotal).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => deleteItem(item.id)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                        title="Delete line"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
          >
            <Download size={14} /> Export CSV Sheet
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              onClick={handleApplyBid}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #10b981, #059669)'
              }}
            >
              <Check size={14} /> Apply ₹{Math.round(finalQuotation).toLocaleString('en-IN')} to My Bid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
