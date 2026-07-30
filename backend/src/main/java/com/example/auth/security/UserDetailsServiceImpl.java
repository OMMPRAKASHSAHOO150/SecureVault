package com.example.auth.security;

import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user;
        try {
            // Attempt to load by ID if numeric (used by JWT token filter)
            Long id = Long.parseLong(usernameOrEmail);
            user = userRepository.findById(id)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + id));
        } catch (NumberFormatException e) {
            // Otherwise load by Email or Username (used by Login AuthenticationManager)
            user = userRepository.findByEmail(usernameOrEmail)
                    .or(() -> userRepository.findByUsername(usernameOrEmail))
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email or username: " + usernameOrEmail));
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(String.valueOf(user.getId())) // Store userId as username in SecurityContext
                .password(user.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole())))
                .disabled(!user.isEmailVerified())
                .accountLocked("BLOCKED".equalsIgnoreCase(user.getStatus()))
                .build();
    }
}
