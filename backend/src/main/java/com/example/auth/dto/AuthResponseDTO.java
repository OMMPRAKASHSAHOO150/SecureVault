package com.example.auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {
    private String accessToken;
    private String refreshToken;
    private long expiresIn; // in seconds
    private UserSummaryDTO user;
}
