package com.mednexus.mednexus.bill;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.bill.dto.BillLineRequest;
import com.mednexus.mednexus.bill.dto.BillLineResponse;
import com.mednexus.mednexus.bill.dto.BillResponse;
import com.mednexus.mednexus.bill.dto.CreateBillRequest;
import com.mednexus.mednexus.order.PaymentMethod;
import com.mednexus.mednexus.order.dto.PaymentMethodDto;
import com.mednexus.mednexus.vendor.Vendor;
import com.mednexus.mednexus.vendor.VendorNotFoundException;
import com.mednexus.mednexus.vendor.VendorRepository;

@Service
public class BillService {

	private static final BigDecimal DEFAULT_TAX_PERCENT = new BigDecimal("13.00");

	private final BillRepository billRepository;
	private final VendorRepository vendorRepository;

	@Autowired
	public BillService(BillRepository billRepository, VendorRepository vendorRepository) {
		this.billRepository = billRepository;
		this.vendorRepository = vendorRepository;
	}

	@Transactional(readOnly = true)
	public List<BillResponse> listForVendor(Long vendorId) {
		return billRepository.findByVendorIdWithLines(vendorId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public BillResponse getForVendor(Long vendorId, Long billId) {
		Bill bill = billRepository.findByIdAndVendorIdWithLines(billId, vendorId)
				.orElseThrow(BillNotFoundException::new);
		return toResponse(bill);
	}

	@Transactional
	public BillResponse create(Long vendorId, CreateBillRequest request) {
		Vendor vendor = vendorRepository.findById(vendorId).orElseThrow(VendorNotFoundException::new);
		if (request.lines().isEmpty()) {
			throw new IllegalArgumentException("At least one line item is required");
		}

		String invoiceNumber = resolveInvoiceNumber(vendorId, request.invoiceNumber());
		BillTotals totals = calculateTotals(request.lines(), request.discountPercent());

		Bill bill = new Bill();
		bill.setVendor(vendor);
		bill.setInvoiceNumber(invoiceNumber);
		bill.setInvoiceDate(request.invoiceDate());
		bill.setDueDate(request.dueDate());
		bill.setPaymentTerms(blankToDefault(request.paymentTerms(), "Net 15"));
		bill.setPaymentMethod(toPaymentMethod(request.paymentMethod()));
		bill.setStatus(request.status());
		bill.setBillToName(request.billToName().trim());
		bill.setBillToEmail(trimToNull(request.billToEmail()));
		bill.setBillToPhone(trimToNull(request.billToPhone()));
		bill.setBillToAddress(trimToNull(request.billToAddress()));
		bill.setVendorBusinessName(blankToDefault(vendor.getBusinessName(), vendor.getName()));
		bill.setVendorPanVatId(trimToNull(vendor.getBusinessPanVatId()));
		bill.setVendorBusinessLocation(trimToNull(vendor.getBusinessLocation()));
		bill.setVendorPhone(trimToNull(vendor.getPhoneNumber()));
		bill.setVendorEmail(trimToNull(vendor.getEmail()));
		bill.setSubtotal(totals.subtotal());
		bill.setTaxPercent(DEFAULT_TAX_PERCENT);
		bill.setTaxAmount(totals.taxAmount());
		bill.setDiscountPercent(totals.discountPercent());
		bill.setDiscountAmount(totals.discountAmount());
		bill.setTotalAmount(totals.totalAmount());

		int sortOrder = 0;
		for (BillLineRequest lineRequest : request.lines()) {
			BillLine line = new BillLine();
			line.setProductName(lineRequest.productName().trim());
			line.setDescription(trimToNull(lineRequest.description()));
			line.setQuantity(lineRequest.quantity());
			line.setUnitPrice(lineRequest.unitPrice().setScale(2, RoundingMode.HALF_UP));
			line.setLineAmount(line.getUnitPrice()
					.multiply(BigDecimal.valueOf(line.getQuantity()))
					.setScale(2, RoundingMode.HALF_UP));
			line.setSortOrder(sortOrder++);
			bill.addLine(line);
		}

		return toResponse(billRepository.save(bill));
	}

	@Transactional
	public BillResponse update(Long vendorId, Long billId, CreateBillRequest request) {
		Bill bill = billRepository.findByIdAndVendorIdWithLines(billId, vendorId)
				.orElseThrow(BillNotFoundException::new);
		if (request.lines().isEmpty()) {
			throw new IllegalArgumentException("At least one line item is required");
		}

		String invoiceNumber = resolveInvoiceNumber(vendorId, request.invoiceNumber(), billId);
		BillTotals totals = calculateTotals(request.lines(), request.discountPercent());

		bill.setInvoiceNumber(invoiceNumber);
		bill.setInvoiceDate(request.invoiceDate());
		bill.setDueDate(request.dueDate());
		bill.setPaymentTerms(blankToDefault(request.paymentTerms(), "Net 15"));
		bill.setPaymentMethod(toPaymentMethod(request.paymentMethod()));
		bill.setStatus(request.status());
		bill.setBillToName(request.billToName().trim());
		bill.setBillToEmail(trimToNull(request.billToEmail()));
		bill.setBillToPhone(trimToNull(request.billToPhone()));
		bill.setBillToAddress(trimToNull(request.billToAddress()));
		bill.setSubtotal(totals.subtotal());
		bill.setTaxPercent(DEFAULT_TAX_PERCENT);
		bill.setTaxAmount(totals.taxAmount());
		bill.setDiscountPercent(totals.discountPercent());
		bill.setDiscountAmount(totals.discountAmount());
		bill.setTotalAmount(totals.totalAmount());

		bill.getLines().clear();
		int sortOrder = 0;
		for (BillLineRequest lineRequest : request.lines()) {
			BillLine line = new BillLine();
			line.setProductName(lineRequest.productName().trim());
			line.setDescription(trimToNull(lineRequest.description()));
			line.setQuantity(lineRequest.quantity());
			line.setUnitPrice(lineRequest.unitPrice().setScale(2, RoundingMode.HALF_UP));
			line.setLineAmount(line.getUnitPrice()
					.multiply(BigDecimal.valueOf(line.getQuantity()))
					.setScale(2, RoundingMode.HALF_UP));
			line.setSortOrder(sortOrder++);
			bill.addLine(line);
		}

		return toResponse(billRepository.save(bill));
	}

	@Transactional
	public void delete(Long vendorId, Long billId) {
		Bill bill = billRepository.findByIdAndVendorIdWithLines(billId, vendorId)
				.orElseThrow(BillNotFoundException::new);
		billRepository.delete(bill);
	}

	private String resolveInvoiceNumber(Long vendorId, String requestedNumber) {
		return resolveInvoiceNumber(vendorId, requestedNumber, null);
	}

	private String resolveInvoiceNumber(Long vendorId, String requestedNumber, Long excludeBillId) {
		if (requestedNumber != null && !requestedNumber.isBlank()) {
			String trimmed = requestedNumber.trim();
			boolean taken = excludeBillId == null
					? billRepository.existsByVendorIdAndInvoiceNumber(vendorId, trimmed)
					: billRepository.existsByVendorIdAndInvoiceNumberAndIdNot(vendorId, trimmed, excludeBillId);
			if (taken) {
				throw new IllegalArgumentException("Invoice number already exists");
			}
			return trimmed;
		}

		long sequence = billRepository.countByVendorId(vendorId) + 1;
		int year = LocalDate.now().getYear();
		String generated;
		do {
			generated = "INV-" + year + "-" + String.format("%03d", sequence);
			sequence++;
		} while (excludeBillId == null
				? billRepository.existsByVendorIdAndInvoiceNumber(vendorId, generated)
				: billRepository.existsByVendorIdAndInvoiceNumberAndIdNot(vendorId, generated, excludeBillId));
		return generated;
	}

	private BillTotals calculateTotals(List<BillLineRequest> lines, BigDecimal discountPercentInput) {
		BigDecimal subtotal = BigDecimal.ZERO;
		for (BillLineRequest line : lines) {
			BigDecimal lineAmount = line.unitPrice()
					.multiply(BigDecimal.valueOf(line.quantity()))
					.setScale(2, RoundingMode.HALF_UP);
			subtotal = subtotal.add(lineAmount);
		}

		BigDecimal discountPercent = discountPercentInput == null
				? BigDecimal.ZERO
				: discountPercentInput.max(BigDecimal.ZERO).min(new BigDecimal("100.00"));
		BigDecimal discountAmount = subtotal
				.multiply(discountPercent)
				.divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
		BigDecimal taxAmount = subtotal
				.multiply(DEFAULT_TAX_PERCENT)
				.divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
		BigDecimal totalAmount = subtotal.add(taxAmount).subtract(discountAmount).max(BigDecimal.ZERO);

		return new BillTotals(subtotal, discountPercent, discountAmount, taxAmount, totalAmount);
	}

	private PaymentMethod toPaymentMethod(PaymentMethodDto dto) {
		return switch (dto) {
			case COD -> PaymentMethod.COD;
			case ESEWA -> PaymentMethod.ESEWA;
			case KHALTI -> PaymentMethod.KHALTI;
		};
	}

	private BillResponse toResponse(Bill bill) {
		List<BillLineResponse> lines = bill.getLines().stream()
				.map(line -> new BillLineResponse(
						line.getId(),
						line.getProductName(),
						line.getDescription(),
						line.getQuantity(),
						line.getUnitPrice(),
						line.getLineAmount(),
						line.getSortOrder()))
				.toList();

		return new BillResponse(
				bill.getId(),
				bill.getInvoiceNumber(),
				bill.getInvoiceDate(),
				bill.getDueDate(),
				bill.getPaymentTerms(),
				bill.getPaymentMethod(),
				bill.getStatus(),
				bill.getBillToName(),
				bill.getBillToEmail(),
				bill.getBillToPhone(),
				bill.getBillToAddress(),
				bill.getVendorBusinessName(),
				bill.getVendorPanVatId(),
				bill.getVendorBusinessLocation(),
				bill.getVendorPhone(),
				bill.getVendorEmail(),
				bill.getSubtotal(),
				bill.getTaxPercent(),
				bill.getTaxAmount(),
				bill.getDiscountPercent(),
				bill.getDiscountAmount(),
				bill.getTotalAmount(),
				bill.getCreatedAt(),
				lines);
	}

	private String blankToDefault(String value, String fallback) {
		if (value == null || value.isBlank()) {
			return fallback;
		}
		return value.trim();
	}

	private String trimToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private record BillTotals(
			BigDecimal subtotal,
			BigDecimal discountPercent,
			BigDecimal discountAmount,
			BigDecimal taxAmount,
			BigDecimal totalAmount) {
	}
}
