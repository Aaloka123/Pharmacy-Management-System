import { useMemo, useState, type ChangeEvent } from 'react';
import Navbar from '../VendorComponents/Navbar';
import { VendorMain, FadeInOnScroll } from '../components/PortalMain';
import mednexuxLogo from '../assets/Mednexux.png';

type InvoiceStatus = 'Unpaid' | 'Paid' | 'Partially Paid';
type InvoiceLine = {
  id: number;
  productName: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceForm = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  billToName: string;
  billToEmail: string;
  billToPhone: string;
  billToAddress: string;
  lines: InvoiceLine[];
  taxPercent: string;
  discount: string;
  paymentMethod: 'e-sewa' | 'khalti' | 'COD';
  status: InvoiceStatus;
};

type SavedInvoice = InvoiceForm & { id: number };
const FIXED_TAX_PERCENT = 13;

const createEmptyInvoice = (sequence: number): InvoiceForm => ({
  invoiceNumber: `INV-2026-${String(sequence).padStart(3, '0')}`,
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  paymentTerms: 'Net 15',
  billToName: '',
  billToEmail: '',
  billToPhone: '',
  billToAddress: '',
  lines: [
    {
      id: 1,
      productName: '',
      description: '',
      quantity: '1',
      unitPrice: '0',
    },
  ],
  taxPercent: String(FIXED_TAX_PERCENT),
  discount: '0',
  paymentMethod: 'e-sewa',
  status: 'Unpaid',
});

const Bills = () => {
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [draftInvoice, setDraftInvoice] = useState<InvoiceForm>(createEmptyInvoice(1));
  const [showEditor, setShowEditor] = useState(false);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');

  const calculations = useMemo(() => {
    const subtotal = draftInvoice.lines.reduce((sum, line) => {
      const quantity = Number(line.quantity) || 0;
      const unitPrice = Number(line.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);
    const taxPercent = FIXED_TAX_PERCENT;
    const discountPercent = Math.min(100, Math.max(0, Number(draftInvoice.discount) || 0));
    const discountAmount = subtotal * (discountPercent / 100);
    const taxAmount = subtotal * (taxPercent / 100);
    const total = subtotal + taxAmount - discountAmount;
    return { subtotal, taxAmount, discountAmount, total };
  }, [draftInvoice]);

  const getInvoiceTotal = (invoice: InvoiceForm) => {
    const subtotal = invoice.lines.reduce((sum, line) => {
      const quantity = Number(line.quantity) || 0;
      const unitPrice = Number(line.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);
    const discountPercent = Math.min(100, Math.max(0, Number(invoice.discount) || 0));
    const discountAmount = subtotal * (discountPercent / 100);
    const taxAmount = subtotal * (FIXED_TAX_PERCENT / 100);
    return Math.max(subtotal + taxAmount - discountAmount, 0);
  };

  const filteredInvoices = useMemo(() => {
    const query = invoiceSearchTerm.trim().toLowerCase();
    if (!query) return invoices;
    return invoices.filter((invoice) =>
      [invoice.invoiceNumber, invoice.billToName, invoice.billToEmail, invoice.billToPhone]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [invoiceSearchTerm, invoices]);

  const handleDraftChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setDraftInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (lineId: number, field: keyof InvoiceLine, value: string) => {
    setDraftInvoice((prev) => ({
      ...prev,
      lines: prev.lines.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)),
    }));
  };

  const addLine = () => {
    setDraftInvoice((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: Date.now(),
          productName: '',
          description: '',
          quantity: '1',
          unitPrice: '0',
        },
      ],
    }));
  };

  const removeLine = (lineId: number) => {
    setDraftInvoice((prev) => {
      if (prev.lines.length <= 1) return prev;
      return {
        ...prev,
        lines: prev.lines.filter((line) => line.id !== lineId),
      };
    });
  };

  const startNewInvoice = () => {
    setSelectedInvoiceId(null);
    setDraftInvoice(createEmptyInvoice(invoices.length + 1));
    setShowEditor(true);
  };

  const saveInvoice = () => {
    if (selectedInvoiceId) return;
    const newInvoice: SavedInvoice = { ...draftInvoice, id: Date.now() };
    setInvoices((prev) => [newInvoice, ...prev]);
    setSelectedInvoiceId(newInvoice.id);
    setShowEditor(true);
  };

  const handleDeleteInvoice = (invoiceId: number) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this invoice?');
    if (!shouldDelete) return;
    setInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
    if (selectedInvoiceId === invoiceId) {
      setSelectedInvoiceId(null);
      setShowEditor(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <VendorMain>
      <FadeInOnScroll>
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }
            * {
              visibility: hidden !important;
            }
            .invoice-print-area,
            .invoice-print-area * {
              visibility: visible !important;
            }
            .invoice-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 12px !important;
              box-shadow: none !important;
              border: 1px solid #e2e8f0 !important;
              background: white !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              font-size: 12px !important;
            }
            .invoice-print-area input,
            .invoice-print-area select,
            .invoice-print-area textarea {
              border: none !important;
              box-shadow: none !important;
              outline: none !important;
              background: transparent !important;
              padding: 0 !important;
              margin: 0 !important;
              min-height: auto !important;
              height: auto !important;
              color: #0f172a !important;
              font-size: 12px !important;
              pointer-events: none !important;
              appearance: none !important;
            }
            .invoice-print-area textarea {
              resize: none !important;
            }
            .invoice-print-area .print-hide {
              display: none !important;
            }
            .hide-on-print {
              display: none !important;
            }
            .invoice-print-area .mt-6,
            .invoice-print-area .mt-5,
            .invoice-print-area .mt-4 {
              margin-top: 10px !important;
            }
            .invoice-print-area .py-3,
            .invoice-print-area .py-2,
            .invoice-print-area .p-5,
            .invoice-print-area .p-4 {
              padding-top: 6px !important;
              padding-bottom: 6px !important;
            }
            .invoice-print-area table,
            .invoice-print-area tr,
            .invoice-print-area td,
            .invoice-print-area th {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            body {
              background: white !important;
            }
          }
        `}</style>

        <div className="hide-on-print flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoice</h1>
            <p className="mt-1 text-sm text-slate-600">Create and manage invoices for your orders.</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <input
              type="text"
              value={invoiceSearchTerm}
              onChange={(event) => setInvoiceSearchTerm(event.target.value)}
              placeholder="Search invoice..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-600 sm:w-64"
            />
            <button
              type="button"
              onClick={startNewInvoice}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              New Invoice
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[300px_1fr]">
          <aside className="hide-on-print rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">All Invoices ({invoices.length})</h2>
            {invoices.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No invoices yet. Click New Invoice to start.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {filteredInvoices.map((invoice) => (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => {
                      setSelectedInvoiceId(invoice.id);
                      setDraftInvoice(invoice);
                      setShowEditor(true);
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      selectedInvoiceId === invoice.id
                        ? 'border-teal-300 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{invoice.invoiceNumber}</p>
                        <p className="mt-1 text-xs text-slate-500">{invoice.billToName || 'Unnamed Client'}</p>
                      </div>
                      <div className="flex h-full flex-col items-end justify-start gap-2">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteInvoice(invoice.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              handleDeleteInvoice(invoice.id);
                            }
                          }}
                          className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
                          aria-label="Delete invoice"
                        >
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <path
                              d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.8"
                            />
                          </svg>
                        </span>
                        <p className="text-sm font-bold text-slate-600">
                          Rs. {getInvoiceTotal(invoice).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredInvoices.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    No matching invoices found.
                  </p>
                ) : null}
              </div>
            )}
          </aside>

          <section>
            {showEditor ? (
            <>
              <div className="hide-on-print mb-3 flex flex-col items-start gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6v-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                  Print / Save PDF
                </button>
              </div>
            <section className="invoice-print-area rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-start justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <img src={mednexuxLogo} alt="Mednexux logo" className="h-12 w-12 rounded-md object-cover" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Mednexux Pharmacy</h3>
                    <p className="text-xs text-slate-500">Kathmandu, Nepal | +977 9800000000</p>
                    <p className="text-xs text-slate-500">mednexux.pharmacy@gmail.com</p>
                    <p className="text-xs text-slate-500">VAT/PAN: 123456789</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">Tax Invoice</p>
                  <p className="mt-1 text-3 font-bold text-slate-900">{draftInvoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="pt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-700">Bill To</p>
                    <div className="mt-3 space-y-2">
                      <input name="billToName" value={draftInvoice.billToName} onChange={handleDraftChange} placeholder="Customer name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-600" />
                      <input name="billToEmail" value={draftInvoice.billToEmail} onChange={handleDraftChange} placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600" />
                      <input name="billToPhone" value={draftInvoice.billToPhone} onChange={handleDraftChange} placeholder="Phone" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600" />
                      <textarea name="billToAddress" value={draftInvoice.billToAddress} onChange={handleDraftChange} rows={3} placeholder="Address" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-700">Invoice Details</p>
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                        <label className="text-sm text-slate-600">Invoice no.</label>
                        <input name="invoiceNumber" value={draftInvoice.invoiceNumber} onChange={handleDraftChange} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600" />
                      </div>
                      <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                        <label className="text-sm text-slate-600">Issue date</label>
                        <input name="invoiceDate" type="date" value={draftInvoice.invoiceDate} onChange={handleDraftChange} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600" />
                      </div>
                      <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                        <label className="text-sm text-slate-600">Payment terms</label>
                        <input name="paymentTerms" value={draftInvoice.paymentTerms} onChange={handleDraftChange} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600" />
                      </div>
                      <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                        <label className="text-sm text-slate-600">Payment</label>
                        <select name="paymentMethod" value={draftInvoice.paymentMethod} onChange={handleDraftChange} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600">
                          <option value="e-sewa">e-sewa</option>
                          <option value="khalti">khalti</option>
                          <option value="COD">COD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-3 py-2 text-sm font-semibold text-slate-700">Product</th>
                        <th className="px-3 py-2 text-sm font-semibold text-slate-700">Description</th>
                        <th className="w-24 px-3 py-2 text-sm font-semibold text-slate-700">Qty</th>
                        <th className="w-28 px-3 py-2 text-sm font-semibold text-slate-700">Rate</th>
                        <th className="w-28 px-3 py-2 text-sm font-semibold text-slate-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftInvoice.lines.map((line) => {
                        const lineAmount = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
                        return (
                          <tr className="border-t border-slate-200" key={line.id}>
                            <td className="px-3 py-3">
                              <input
                                value={line.productName}
                                onChange={(event) => handleLineChange(line.id, 'productName', event.target.value)}
                                placeholder="Product name"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                value={line.description}
                                onChange={(event) => handleLineChange(line.id, 'description', event.target.value)}
                                placeholder="Line description"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={(event) => handleLineChange(line.id, 'quantity', event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                value={line.unitPrice}
                                onChange={(event) => handleLineChange(line.id, 'unitPrice', event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600"
                              />
                            </td>
                            <td className="px-3 py-3 text-sm font-semibold text-slate-800">
                              <div className="flex items-center justify-between gap-2">
                                <span>Rs. {lineAmount.toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={() => removeLine(line.id)}
                                  className="print-hide rounded-md border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
                                  aria-label="Remove line"
                                  disabled={draftInvoice.lines.length <= 1}
                                >
                                  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <path
                                      d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1.8"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addLine}
                  className="print-hide mt-3 ml-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <span className="text-lg leading-none">+</span>
                  Add line
                </button>

                <div className="mt-5 ml-auto w-full max-w-xs space-y-3">
                  <div className="print-hide">
                    <label className="text-sm font-semibold text-slate-600">Discount (%)</label>
                    <input name="discount" type="number" min="0" max="100" value={draftInvoice.discount} onChange={handleDraftChange} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600"><span>VAT ({FIXED_TAX_PERCENT}%)</span><span>Rs. {calculations.taxAmount.toLocaleString()}</span></div>
                  <div className="flex items-center justify-between text-sm text-slate-600"><span>Subtotal</span><span>Rs. {calculations.subtotal.toLocaleString()}</span></div>
                  <div className="flex items-center justify-between text-sm text-slate-600"><span>Discount ({Math.min(100, Math.max(0, Number(draftInvoice.discount) || 0))}%)</span><span>- Rs. {calculations.discountAmount.toLocaleString()}</span></div>
                  <div className="flex items-center justify-between border-t-2 border-slate-500 pt-3 text-3 font-bold text-slate-900">
                    <span>Total due</span>
                    <span className="text-teal-600">Rs. {Math.max(calculations.total, 0).toLocaleString()}</span>
                  </div>
                </div>

              </div>
              {selectedInvoiceId === null ? (
                <button
                  type="button"
                  onClick={saveInvoice}
                  className="hide-on-print mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                  Save Invoice
                </button>
              ) : null}
              <p className="hidden border-t border-slate-300 pt-3 text-center text-xs text-slate-600 print:block">
                Thank you for your business. If you have any questions about this invoice, please contact us.
              </p>
            </section>
            </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                Create a new invoice to get started.
              </div>
            )}
          </section>
        </div>
      </FadeInOnScroll>
      </VendorMain>
    </div>
  );
};

export default Bills;