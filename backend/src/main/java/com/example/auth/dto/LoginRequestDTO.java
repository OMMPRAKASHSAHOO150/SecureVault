package com.example.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequestDTO {

    @NotBlank(message = "Email or Username is required")
    private String emailOrUsername;

    @NotBlank(message = "Password is required")
    private String password;
}
