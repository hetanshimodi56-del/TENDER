import React from 'react';
import { X, FolderKanban, Download, FileText, CheckCircle2, FileSpreadsheet, Shield } from 'lucide-react';

export default function FileManagerModal({ onClose }) {
  const documents = [
    {
      id: 'doc_bg',
      name: 'Annexure II - Standard Bank Guarantee (BG) Format for EMD',
      type: 'Text Format (.txt)',
      size: '12 KB',
      description: 'Standard irrevocable bank guarantee format issued by Scheduled Commercial Banks in favor of the Tender Inviting Authority.',
      filename: 'Annexure_II_EMD_Bank_Guarantee_Format.txt',
      content: `================================================================================
          ANNEXURE II - MODEL BANK GUARANTEE FORMAT FOR EARNEST MONEY DEPOSIT (EMD)
================================================================================
To:
The Directorate of Public Procurement, Government of Gujarat
Gandhinagar, Gujarat - 382010

WHEREAS [Name of Bidder] (hereinafter called "the Bidder") has submitted their bid dated [Date] for the implementation of [Tender Name] (hereinafter called "the Tender").

KNOW ALL MEN by these presents that WE [Name of Bank] having our registered office at [Address] are bound unto The Governor of Gujarat in the sum of INR [Amount] for which payment well and truly to be made to the said Authority, the Bank binds itself, its successors and assigns by these presents.

SEALED with the Common Seal of the said Bank this [Day] of [Month], 2026.

THE CONDITIONS OF THIS OBLIGATION ARE:
1. If the Bidder withdraws or amends their bid during the period of bid validity specified in the RFP document.
2. If the Bidder having been notified of the acceptance of their bid fails or refuses to furnish the Performance Security or execute the Contract Agreement within 15 days of Letter of Intent.

We undertake to pay to the Authority up to the above amount upon receipt of their first written demand, without the Authority having to substantiate their demand.

Guarantor: [Authorized Signatory of Bank]
Branch UDIN: [UDIN Number]`
    },
    {
      id: 'doc_boq',
      name: 'Annexure IV - Bill of Quantities (BOQ) Price Bid Schedule',
      type: 'Spreadsheet (.csv)',
      size: '8 KB',
      description: 'Standard BOQ financial price schedule template with item codes, units, basic rate, GST%, and total evaluated cost.',
      filename: 'BOQ_Price_Schedule_Template.csv',
      content: `Item No,Description of Item,Unit,Quantity,Basic Rate (INR),GST (%),Total Amount (INR)
1.01,Supply of High-Resolution AI Video ANPR Cameras,Nos,180,65000,18,13806000
1.02,Supply & Commissioning of Adaptive Traffic Signal Controllers,Nos,45,280000,18,14868000
1.03,Integrated Command and Control Center (ICCC) Display Wall 70",Nos,12,350000,18,4956000
1.04,Edge AI Video Analytics Server Cluster Tier-III,Set,4,2200000,18,10384000
1.05,5-Year Comprehensive Warranty and Technical O&M Support,Years,5,4000000,18,23600000
,,,Total Evaluated Bid Price (INR),,,67614000`
    },
    {
      id: 'doc_nda',
      name: 'Annexure V - Non-Disclosure Agreement (NDA)',
      type: 'Text Document (.txt)',
      size: '14 KB',
      description: 'Confidentiality agreement protecting proprietary government infrastructure and network architecture diagrams.',
      filename: 'Annexure_V_Non_Disclosure_Agreement.txt',
      content: `================================================================================
                    ANNEXURE V - MUTUAL NON-DISCLOSURE AGREEMENT
================================================================================
This Mutual Non-Disclosure Agreement is entered into on this [Date] between:
1. The Procuring Department, Government Authority ("Disclosing Party")
2. The Bidder Organization ("Receiving Party")

1. Confidential Information: All technical blueprints, network topology diagrams, SCADA control protocols, and source codes provided during the pre-bid and evaluation phases are confidential.
2. Term: The obligations shall continue for a period of 5 (five) years from the date of disclosure.
3. Penalty: Any unauthorized disclosure shall result in immediate disqualification, forfeiture of EMD, and blacklisting under statutory procurement guidelines.`
    },
    {
      id: 'doc_jv',
      name: 'Annexure VI - Joint Venture / Consortium Agreement Format',
      type: 'Text Document (.txt)',
      size: '16 KB',
      description: 'Joint undertaking defining equity shares, lead partner obligations, and joint-and-several liability.',
      filename: 'Annexure_VI_Joint_Venture_Declaration.txt',
      content: `================================================================================
           ANNEXURE VI - JOINT VENTURE (JV) / CONSORTIUM MEMORANDUM OF UNDERSTANDING
================================================================================
This Memorandum of Understanding (MoU) made on this [Date] between:
- Lead Partner: [Company A - minimum 51% equity]
- Consortium Partner: [Company B]

We hereby solemnly declare:
1. That we have formed a Consortium for the purpose of bidding for Tender [Tender Ref].
2. Lead Partner shall be authorized to incur liabilities and receive instructions on behalf of the Consortium.
3. Both partners shall be jointly and severally liable for the execution of the contract in accordance with the contract terms.`
    }
  ];

  const handleDownload = (doc) => {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(0, 121, 107, 0.08), #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#e6f4f1',
              color: '#00796b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FolderKanban size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>Manage Files & Procurement Templates</h2>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Standard Formats, BOQ Schedules, EMD Bank Guarantees & Joint Venture Documents
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {documents.map(doc => (
            <div
              key={doc.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: doc.type.includes('Spreadsheet') ? '#f0fdf4' : '#f8fafc',
                  color: doc.type.includes('Spreadsheet') ? '#16a34a' : '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2
                }}>
                  {doc.type.includes('Spreadsheet') ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
                </div>

                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: 520, lineHeight: 1.4, marginBottom: 6 }}>
                    {doc.description}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: '#94a3b8' }}>
                    <span>Type: <strong>{doc.type}</strong></span>
                    <span>Size: <strong>{doc.size}</strong></span>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleDownload(doc)}
                style={{ padding: '6px 14px' }}
              >
                <Download size={14} /> Download
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#f8fafc'
        }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
