package com.example.auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterResponseDTO {
    private String message;
    private Long userId;
    private String email;
    private boolean emailVerified;
}
