package com.example.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordEntryRequestDTO {
    @NotBlank
    private String title;

    @NotBlank
    private String loginName;

    private String websiteUrl;

    @NotBlank
    private String password;

    private String notes;
}
