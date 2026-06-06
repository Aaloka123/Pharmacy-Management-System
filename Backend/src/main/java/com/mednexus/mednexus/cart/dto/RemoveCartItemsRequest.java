package com.mednexus.mednexus.cart.dto;

import java.util.List;

public record RemoveCartItemsRequest(List<Long> ids) {
}
