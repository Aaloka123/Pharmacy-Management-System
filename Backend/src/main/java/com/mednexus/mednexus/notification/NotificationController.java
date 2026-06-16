package com.mednexus.mednexus.notification;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.notification.dto.NotificationResponse;
import com.mednexus.mednexus.notification.dto.UnreadCountResponse;
import com.mednexus.mednexus.security.PlatformUser;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated() and !principal.vendorAccount")
public class NotificationController {

	private final NotificationService notificationService;

	@Autowired
	public NotificationController(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	@GetMapping
	public ResponseEntity<List<NotificationResponse>> list(@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(notificationService.listForUser(principal.getSubjectId()));
	}

	@GetMapping("/unread-count")
	public ResponseEntity<UnreadCountResponse> unreadCount(@AuthenticationPrincipal PlatformUser principal) {
		long count = notificationService.unreadCount(principal.getSubjectId());
		return ResponseEntity.ok(new UnreadCountResponse(count));
	}

	@PostMapping("/{id}/read")
	public ResponseEntity<Void> markRead(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id) {
		notificationService.markRead(principal.getSubjectId(), id);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/read-all")
	public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal PlatformUser principal) {
		notificationService.markAllRead(principal.getSubjectId());
		return ResponseEntity.noContent().build();
	}
}
