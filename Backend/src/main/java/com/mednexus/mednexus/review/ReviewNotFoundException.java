package com.mednexus.mednexus.review;

public class ReviewNotFoundException extends RuntimeException {

	public ReviewNotFoundException() {
		super("Review not found");
	}
}
