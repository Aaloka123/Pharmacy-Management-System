package com.mednexus.mednexus.chat.dto;

public record ChatMessageDeleteEvent(String eventType, ChatMessageResponse message) {
}
