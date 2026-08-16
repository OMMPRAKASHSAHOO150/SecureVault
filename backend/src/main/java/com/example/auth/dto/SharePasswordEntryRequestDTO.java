package com.example.auth.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SharePasswordEntryRequestDTO {
    @NotNull
    private Long passwordEntryId;

    @NotNull
    private String permission; // VIEW_ONLY, EDIT_ACCESS, FULL_MANAGEMENT

    private Long recipientUserId;
    private String recipientEmail;
}
