import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import Navbar from '../VendorComponents/Navbar';
import { VendorLayout, VendorMain, FadeInOnScroll } from '../components/PortalMain';
import mednexuxLogo from '../assets/Mednexux.png';
import { isValidPhoneNumber, phoneInputProps, sanitizePhoneInput } from '../lib/phoneUtils';
import {
  createVendorBill,
  deleteVendorBill,
  fetchVendorBills,
  updateVendorBill,
  fromApiBillStatus,
  fromApiPaymentMethod,
  toApiBillStatus,
  toApiPaymentMethod,
  type BillDto,
} from '../lib/billApi';
import { toast } from 'react-toastify';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  vendorBusinessName?: string;
  vendorPanVatId?: string;
  vendorBusinessLocation?: string;
  vendorPhone?: string;
  vendorEmail?: string;
};

type SavedInvoice = InvoiceForm & { id: number };

type LineFieldErrors = {
  productName?: string;
  description?: string;
  quantity?: string;
  unitPrice?: string;
};

type InvoiceFieldErrors = {
  billToName?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToAddress?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  lines?: string;
  lineErrors?: Record<number, LineFieldErrors>;
};

const FIXED_TAX_PERCENT = 13;
const fieldInputClass = (hasError: boolean, extra = '') =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
    hasError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-teal-600'
  } ${extra}`;
const fieldErrorText = (message?: string) =>
  message ? <p className="mt-1 text-xs font-medium text-rose-600">{message}</p> : null;

const billToInvoiceForm = (bill: BillDto): SavedInvoice => ({
  id: bill.id,
  invoiceNumber: bill.invoiceNumber,
  invoiceDate: bill.invoiceDate,
  dueDate: bill.dueDate ?? '',
  paymentTerms: bill.paymentTerms ?? 'Net 15',
  billToName: bill.billToName,
  billToEmail: bill.billToEmail ?? '',
  billToPhone: bill.billToPhone ?? '',
  billToAddress: bill.billToAddress ?? '',
  lines: bill.lines.map((line) => ({
    id: line.id,
    productName: line.productName,
    description: line.description ?? '',
    quantity: String(line.quantity),
    unitPrice: String(line.unitPrice),
  })),
  taxPercent: String(bill.taxPercent),
  discount: String(bill.discountPercent),
  paymentMethod: fromApiPaymentMethod(bill.paymentMethod),
  status: fromApiBillStatus(bill.status),
  vendorBusinessName: bill.vendorBusinessName,
  vendorPanVatId: bill.vendorPanVatId ?? undefined,
  vendorBusinessLocation: bill.vendorBusinessLocation ?? undefined,
  vendorPhone: bill.vendorPhone ?? undefined,
  vendorEmail: bill.vendorEmail ?? undefined,
});

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<InvoiceFieldErrors>({});

  useEffect(() => {
    let active = true;
    const loadBills = async () => {
      try {
        const bills = await fetchVendorBills();
        if (!active) return;
        setInvoices(bills.map(billToInvoiceForm));
      } catch {
        if (active) toast.error('Could not load invoices.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadBills();
    return () => {
      active = false;
    };
  }, []);

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
    let nextValue = name === 'billToPhone' ? sanitizePhoneInput(value) : value;
    if (name === 'discount') {
      if (nextValue.trim() !== '') {
        const numeric = Number(nextValue);
        if (!Number.isFinite(numeric)) {
          return;
        }
        if (numeric > 100) nextValue = '100';
        else if (numeric < 0) nextValue = '0';
      }
    }
    setDraftInvoice((prev) => ({ ...prev, [name]: nextValue }));
    setFieldErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name as keyof InvoiceFieldErrors];
      return next;
    });
  };

  const handleLineChange = (lineId: number, field: keyof InvoiceLine, value: string) => {
    setDraftInvoice((prev) => ({
      ...prev,
      lines: prev.lines.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)),
    }));
    setFieldErrors((prev) => {
      if (!prev.lineErrors?.[lineId]?.[field as keyof LineFieldErrors] && !prev.lines) return prev;
      const lineErrors = { ...(prev.lineErrors ?? {}) };
      const currentLine = { ...(lineErrors[lineId] ?? {}) };
      delete currentLine[field as keyof LineFieldErrors];
      if (Object.keys(currentLine).length === 0) {
        delete lineErrors[lineId];
      } else {
        lineErrors[lineId] = currentLine;
      }
      return {
        ...prev,
        lines: undefined,
        lineErrors: Object.keys(lineErrors).length > 0 ? lineErrors : undefined,
      };
    });
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
    setFieldErrors({});
    setShowEditor(true);
  };

  const validateInvoice = (): { errors: InvoiceFieldErrors; toastMessage: string | null } => {
    const errors: InvoiceFieldErrors = {};
    const messages: string[] = [];

    if (!draftInvoice.billToName.trim()) {
      errors.billToName = 'Customer name is required.';
      messages.push(errors.billToName);
    }
    if (!draftInvoice.billToEmail.trim()) {
      errors.billToEmail = 'Customer email is required.';
      messages.push(errors.billToEmail);
    } else if (!EMAIL_PATTERN.test(draftInvoice.billToEmail.trim())) {
      errors.billToEmail = 'Enter a valid customer email.';
      messages.push(errors.billToEmail);
    }
    if (!draftInvoice.billToPhone.trim()) {
      errors.billToPhone = 'Customer phone is required.';
      messages.push(errors.billToPhone);
    } else if (!isValidPhoneNumber(draftInvoice.billToPhone)) {
      errors.billToPhone = 'Phone number must be exactly 10 digits.';
      messages.push(errors.billToPhone);
    }
    if (!draftInvoice.billToAddress.trim()) {
      errors.billToAddress = 'Customer address is required.';
      messages.push(errors.billToAddress);
    }
    if (!draftInvoice.invoiceNumber.trim()) {
      errors.invoiceNumber = 'Invoice number is required.';
      messages.push(errors.invoiceNumber);
    }
    if (!draftInvoice.invoiceDate) {
      errors.invoiceDate = 'Issue date is required.';
      messages.push(errors.invoiceDate);
    }
    if (!draftInvoice.paymentTerms.trim()) {
      errors.paymentTerms = 'Payment terms are required.';
      messages.push(errors.paymentTerms);
    }
    if (!draftInvoice.paymentMethod) {
      errors.paymentMethod = 'Payment method is required.';
      messages.push(errors.paymentMethod);
    }

    const filledLines = draftInvoice.lines.filter(
      (line) =>
        line.productName.trim() ||
        line.description.trim() ||
        (Number(line.quantity) || 0) > 0 ||
        (Number(line.unitPrice) || 0) > 0,
    );
    if (filledLines.length === 0) {
      errors.lines = 'Add at least one product line.';
      messages.push(errors.lines);
    }

    const lineErrors: Record<number, LineFieldErrors> = {};
    let lineNo = 0;
    for (const line of draftInvoice.lines) {
      const isTouched =
        line.productName.trim() ||
        line.description.trim() ||
        (Number(line.quantity) || 0) > 0 ||
        (Number(line.unitPrice) || 0) > 0 ||
        draftInvoice.lines.length === 1;
      if (!isTouched) continue;
      lineNo += 1;

      const current: LineFieldErrors = {};
      if (!line.productName.trim()) {
        current.productName = 'Product name is required.';
        messages.push(`Product name is required on line ${lineNo}.`);
      }
      if (!line.description.trim()) {
        current.description = 'Description is required.';
        messages.push(`Description is required on line ${lineNo}.`);
      }
      const quantity = Number(line.quantity);
      if (!Number.isFinite(quantity) || quantity < 1) {
        current.quantity = 'Quantity must be at least 1.';
        messages.push(`Quantity must be at least 1 on line ${lineNo}.`);
      }
      const unitPrice = Number(line.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        current.unitPrice = 'Rate must be greater than 0.';
        messages.push(`Rate must be greater than 0 on line ${lineNo}.`);
      }
      if (Object.keys(current).length > 0) {
        lineErrors[line.id] = current;
      }
    }
    if (Object.keys(lineErrors).length > 0) {
      errors.lineErrors = lineErrors;
    }

    return { errors, toastMessage: messages[0] ?? null };
  };

  const saveInvoice = async () => {
    if (saving) return;

    const { errors, toastMessage } = validateInvoice();
    setFieldErrors(errors);
    if (toastMessage) {
      toast.error(toastMessage);
      return;
    }

    const discountRaw = draftInvoice.discount.trim();
    const discountNumeric = discountRaw === '' ? 0 : Number(discountRaw);
    if (discountRaw !== '' && !Number.isFinite(discountNumeric)) {
      toast.error('Discount must be a number between 0 and 100.');
      return;
    }
    if (discountNumeric < 0 || discountNumeric > 100) {
      toast.error('Discount cannot be more than 100%.');
      return;
    }
    const discountPercent = Math.min(100, Math.max(0, discountNumeric));

    const filledLines = draftInvoice.lines.filter(
      (line) =>
        line.productName.trim() ||
        line.description.trim() ||
        (Number(line.quantity) || 0) > 0 ||
        (Number(line.unitPrice) || 0) > 0,
    );

    const payload = {
      invoiceNumber: draftInvoice.invoiceNumber.trim(),
      invoiceDate: draftInvoice.invoiceDate,
      dueDate: draftInvoice.dueDate || undefined,
      paymentTerms: draftInvoice.paymentTerms.trim(),
      paymentMethod: toApiPaymentMethod(draftInvoice.paymentMethod),
      status: toApiBillStatus(draftInvoice.status),
      billToName: draftInvoice.billToName.trim(),
      billToEmail: draftInvoice.billToEmail.trim(),
      billToPhone: draftInvoice.billToPhone.trim(),
      billToAddress: draftInvoice.billToAddress.trim(),
      discountPercent,
      lines: filledLines.map((line) => ({
        productName: line.productName.trim(),
        description: line.description.trim(),
        quantity: Math.max(1, Number(line.quantity) || 1),
        unitPrice: Math.max(0.01, Number(line.unitPrice) || 0.01),
      })),
    };

    setSaving(true);
    try {
      const result = selectedInvoiceId
        ? await updateVendorBill(selectedInvoiceId, payload)
        : await createVendorBill(payload);
      const saved = billToInvoiceForm(result);
      setInvoices((prev) =>
        selectedInvoiceId
          ? prev.map((invoice) => (invoice.id === saved.id ? saved : invoice))
          : [saved, ...prev],
      );
      setSelectedInvoiceId(saved.id);
      setDraftInvoice(saved);
      setFieldErrors({});
      setShowEditor(true);
      toast.success(selectedInvoiceId ? 'Invoice updated.' : 'Invoice saved.');
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim() ? err.message : 'Could not save invoice.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this invoice?');
    if (!shouldDelete) return;
    try {
      await deleteVendorBill(invoiceId);
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
      if (selectedInvoiceId === invoiceId) {
        setSelectedInvoiceId(null);
        setShowEditor(false);
      }
      toast.success('Invoice deleted.');
    } catch {
      toast.error('Could not delete invoice.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <VendorLayout>
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
              className="cursor-pointer rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              New Invoice
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[300px_1fr]">
          <aside className="hide-on-print rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">All Invoices ({invoices.length})</h2>
            {loading ? (
              <p className="mt-3 text-sm text-slate-500">Loading invoices...</p>
            ) : invoices.length === 0 ? (
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
                      setFieldErrors({});
                      setShowEditor(true);
                    }}
                    className={`cursor-pointer w-full rounded-xl border px-4 py-3 text-left transition ${
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
                  className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
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
                  <img src={mednexuxLogo} alt="Mednexux logo" className="h-12 w-auto shrink-0 object-contain" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {draftInvoice.vendorBusinessName ?? 'Mednexux Pharmacy'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {draftInvoice.vendorBusinessLocation ?? 'Kathmandu, Nepal'}
                      {draftInvoice.vendorPhone ? ` | ${draftInvoice.vendorPhone}` : ' | +977 9800000000'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {draftInvoice.vendorEmail ?? 'mednexux.pharmacy@gmail.com'}
                    </p>
                    <p className="text-xs text-slate-500">
                      VAT/PAN: {draftInvoice.vendorPanVatId ?? '123456789'}
                    </p>
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
                      <div>
                        <input name="billToName" value={draftInvoice.billToName} onChange={handleDraftChange} placeholder="Customer name *" required className={fieldInputClass(Boolean(fieldErrors.billToName), 'font-semibold text-slate-900')} />
                        {fieldErrorText(fieldErrors.billToName)}
                      </div>
                      <div>
                        <input name="billToEmail" type="email" value={draftInvoice.billToEmail} onChange={handleDraftChange} placeholder="Email *" required className={fieldInputClass(Boolean(fieldErrors.billToEmail))} />
                        {fieldErrorText(fieldErrors.billToEmail)}
                      </div>
                      <div>
                        <input name="billToPhone" value={draftInvoice.billToPhone} onChange={handleDraftChange} placeholder="Phone (10 digits) *" required {...phoneInputProps} className={fieldInputClass(Boolean(fieldErrors.billToPhone))} />
                        {fieldErrorText(fieldErrors.billToPhone)}
                      </div>
                      <div>
                        <textarea name="billToAddress" value={draftInvoice.billToAddress} onChange={handleDraftChange} rows={3} placeholder="Address *" required className={fieldInputClass(Boolean(fieldErrors.billToAddress))} />
                        {fieldErrorText(fieldErrors.billToAddress)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-700">Invoice Details</p>
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                        <label className="pt-2 text-sm text-slate-600">Invoice no. *</label>
                        <div>
                          <input name="invoiceNumber" value={draftInvoice.invoiceNumber} onChange={handleDraftChange} required className={fieldInputClass(Boolean(fieldErrors.invoiceNumber))} />
                          {fieldErrorText(fieldErrors.invoiceNumber)}
                        </div>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                        <label className="pt-2 text-sm text-slate-600">Issue date *</label>
                        <div>
                          <input name="invoiceDate" type="date" value={draftInvoice.invoiceDate} onChange={handleDraftChange} required className={fieldInputClass(Boolean(fieldErrors.invoiceDate))} />
                          {fieldErrorText(fieldErrors.invoiceDate)}
                        </div>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                        <label className="pt-2 text-sm text-slate-600">Payment terms *</label>
                        <div>
                          <input name="paymentTerms" value={draftInvoice.paymentTerms} onChange={handleDraftChange} required className={fieldInputClass(Boolean(fieldErrors.paymentTerms))} />
                          {fieldErrorText(fieldErrors.paymentTerms)}
                        </div>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                        <label className="pt-2 text-sm text-slate-600">Payment</label>
                        <div>
                          <select name="paymentMethod" value={draftInvoice.paymentMethod} onChange={handleDraftChange} className={fieldInputClass(Boolean(fieldErrors.paymentMethod))}>
                            <option value="e-sewa">e-sewa</option>
                            <option value="khalti">khalti</option>
                            <option value="COD">COD</option>
                          </select>
                          {fieldErrorText(fieldErrors.paymentMethod)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-3 py-2 text-sm font-semibold text-slate-700">Product *</th>
                        <th className="px-3 py-2 text-sm font-semibold text-slate-700">Description *</th>
                        <th className="w-24 px-3 py-2 text-sm font-semibold text-slate-700">Qty *</th>
                        <th className="w-28 px-3 py-2 text-sm font-semibold text-slate-700">Rate *</th>
                        <th className="w-28 px-3 py-2 text-sm font-semibold text-slate-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftInvoice.lines.map((line) => {
                        const lineAmount = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
                        const lineErr = fieldErrors.lineErrors?.[line.id];
                        return (
                          <tr className="border-t border-slate-200 align-top" key={line.id}>
                            <td className="px-3 py-3">
                              <input
                                value={line.productName}
                                onChange={(event) => handleLineChange(line.id, 'productName', event.target.value)}
                                placeholder="Product name"
                                className={fieldInputClass(Boolean(lineErr?.productName))}
                              />
                              {fieldErrorText(lineErr?.productName)}
                            </td>
                            <td className="px-3 py-3">
                              <input
                                value={line.description}
                                onChange={(event) => handleLineChange(line.id, 'description', event.target.value)}
                                placeholder="Line description"
                                className={fieldInputClass(Boolean(lineErr?.description))}
                              />
                              {fieldErrorText(lineErr?.description)}
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={(event) => handleLineChange(line.id, 'quantity', event.target.value)}
                                className={fieldInputClass(Boolean(lineErr?.quantity))}
                              />
                              {fieldErrorText(lineErr?.quantity)}
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                value={line.unitPrice}
                                onChange={(event) => handleLineChange(line.id, 'unitPrice', event.target.value)}
                                className={fieldInputClass(Boolean(lineErr?.unitPrice))}
                              />
                              {fieldErrorText(lineErr?.unitPrice)}
                            </td>
                            <td className="px-3 py-3 text-sm font-semibold text-slate-800">
                              <div className="flex items-center justify-between gap-2">
                                <span>Rs. {lineAmount.toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={() => removeLine(line.id)}
                                  className="cursor-pointer print-hide rounded-md border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
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
                  {fieldErrorText(fieldErrors.lines)}
                </div>
                <button
                  type="button"
                  onClick={addLine}
                  className="cursor-pointer print-hide mt-3 ml-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <span className="text-lg leading-none">+</span>
                  Add line
                </button>

                <div className="mt-5 ml-auto w-full max-w-xs space-y-3">
                  <div className="print-hide">
                    <label className="text-sm font-semibold text-slate-600">Discount (%) <span className="font-normal text-slate-400">(optional)</span></label>
                    <input name="discount" type="number" min="0" max="100" value={draftInvoice.discount} onChange={handleDraftChange} placeholder="0" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600" />
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
              <button
                type="button"
                onClick={() => void saveInvoice()}
                disabled={saving}
                className="cursor-pointer hide-on-print mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : selectedInvoiceId ? 'Save Changes' : 'Save Invoice'}
              </button>
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
    </VendorLayout>
  );
};

export default Bills;