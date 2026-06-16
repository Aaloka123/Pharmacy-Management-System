package com.mednexus.mednexus.otp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OtpCleanupScheduler {

	private final OtpService otpService;

	@Autowired
	public OtpCleanupScheduler(OtpService otpService) {
		this.otpService = otpService;
	}

	@Scheduled(fixedRate = 300_000)
	void purgeExpiredOtps() {
		otpService.purgeExpiredOtps();
	}
}
