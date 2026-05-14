package com.mednexus.mednexus.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.mednexus.mednexus.user.UserRepository;

@Service
public class PlatformUserDetailsService implements UserDetailsService {

	private final UserRepository userRepository;

	public PlatformUserDetailsService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		var user = userRepository.findByEmailIgnoreCase(username.trim())
				.orElseThrow(() -> new UsernameNotFoundException("User not found"));
		return org.springframework.security.core.userdetails.User
				.withUsername(user.getEmail())
				.password(user.getPassword())
				.roles(user.getRole().name())
				.build();
	}
}
