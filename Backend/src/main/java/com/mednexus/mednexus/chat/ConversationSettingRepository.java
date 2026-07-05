package com.mednexus.mednexus.chat;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationSettingRepository extends JpaRepository<ConversationSetting, ConversationSettingId> {

	Optional<ConversationSetting> findByIdConversationIdAndIdViewerTypeAndIdViewerId(
			Long conversationId,
			MessageSenderType viewerType,
			Long viewerId);

	List<ConversationSetting> findByIdViewerTypeAndIdViewerId(MessageSenderType viewerType, Long viewerId);

	List<ConversationSetting> findByIdConversationIdInAndIdViewerTypeAndIdViewerId(
			Collection<Long> conversationIds,
			MessageSenderType viewerType,
			Long viewerId);
}
