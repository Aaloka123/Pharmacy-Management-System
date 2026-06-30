package com.mednexus.mednexus.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mednexus.mednexus.user.Role;

public interface UserRepository extends JpaRepository<User, Long> {

	boolean existsByEmailIgnoreCase(String email);

	Optional<User> findByEmailIgnoreCase(String email);

	Optional<User> findByGoogleId(String googleId);

	Optional<User> findByRefreshTokenHash(String refreshTokenHash);

	List<User> findAllByRoleOrderByIdAsc(Role role);

	long countByRole(Role role);
}
