package com.mednexus.mednexus.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.mednexus.mednexus.user.Role;

/**
 * Authenticated identity from a validated JWT (no password; not used for DaoAuthenticationProvider).
 */
public class PlatformUser implements UserDetails {

	private static final long serialVersionUID = 1L;

	private final long subjectId;
	private final String email;
	private final Role role;
	private final boolean vendorAccount;

	public PlatformUser(long subjectId, String email, Role role, boolean vendorAccount) {
		this.subjectId = subjectId;
		this.email = email;
		this.role = role;
		this.vendorAccount = vendorAccount;
	}

	public long getSubjectId() {
		return subjectId;
	}

	public boolean isVendorAccount() {
		return vendorAccount;
	}

	public Role getAppRole() {
		return role;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
	}

	@Override
	public String getPassword() {
		return "";
	}

	@Override
	public String getUsername() {
		return email;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return true;
	}
}
