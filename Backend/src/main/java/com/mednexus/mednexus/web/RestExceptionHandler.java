package com.mednexus.mednexus.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.mednexus.mednexus.auth.InvalidGoogleTokenException;
import com.mednexus.mednexus.product.DuplicateProductSkuException;
import com.mednexus.mednexus.product.ProductNotFoundException;
import com.mednexus.mednexus.vendor.VendorNotApprovedException;

@RestControllerAdvice
public class RestExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(RestExceptionHandler.class);

	@ExceptionHandler(DataAccessException.class)
	public ProblemDetail handleDataAccess(DataAccessException ex) {
		log.error("Database access error", ex);
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(
				HttpStatus.INTERNAL_SERVER_ERROR,
				"A database error occurred. Check that MySQL is running and application.properties credentials match your server.");
		pd.setTitle("Database error");
		return pd;
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
		pd.setTitle("Invalid request");
		return pd;
	}

	@ExceptionHandler(InvalidGoogleTokenException.class)
	public ProblemDetail handleInvalidGoogleToken(InvalidGoogleTokenException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
		pd.setTitle("Unauthorized");
		return pd;
	}

	@ExceptionHandler(ProductNotFoundException.class)
	public ProblemDetail handleProductNotFound(ProductNotFoundException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
		pd.setTitle("Not found");
		return pd;
	}

	@ExceptionHandler(DuplicateProductSkuException.class)
	public ProblemDetail handleDuplicateSku(DuplicateProductSkuException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
		pd.setTitle("Conflict");
		return pd;
	}

	@ExceptionHandler(VendorNotApprovedException.class)
	public ProblemDetail handleVendorNotApproved(VendorNotApprovedException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
		pd.setTitle("Forbidden");
		return pd;
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ProblemDetail handleResponseStatus(ResponseStatusException ex) {
		HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
		if (status == null) {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
		}
		String detail = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
		pd.setTitle(status.getReasonPhrase());
		return pd;
	}
}
