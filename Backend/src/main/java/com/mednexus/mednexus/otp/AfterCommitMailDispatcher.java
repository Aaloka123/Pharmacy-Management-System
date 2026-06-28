package com.mednexus.mednexus.otp;

import java.util.concurrent.Executor;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class AfterCommitMailDispatcher {

	private final Executor mailExecutor;

	public AfterCommitMailDispatcher(@Qualifier("mailExecutor") Executor mailExecutor) {
		this.mailExecutor = mailExecutor;
	}

	public void sendAfterCommit(Runnable mailTask) {
		if (TransactionSynchronizationManager.isSynchronizationActive()) {
			TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
				@Override
				public void afterCommit() {
					mailExecutor.execute(mailTask);
				}
			});
			return;
		}
		mailExecutor.execute(mailTask);
	}
}
