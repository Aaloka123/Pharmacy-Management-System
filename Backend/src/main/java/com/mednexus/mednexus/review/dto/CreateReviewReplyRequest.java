package com.mednexus.mednexus.review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReviewReplyRequest(@NotBlank @Size(max = 2000) String body) {
}
