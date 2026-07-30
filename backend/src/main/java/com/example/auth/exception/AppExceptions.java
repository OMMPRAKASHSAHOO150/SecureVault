package com.example.auth.exception;

public class AppExceptions {

    public static class UserAlreadyExistsException extends RuntimeException {
        public UserAlreadyExistsException(String message) {
            super(message);
        }
    }

    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException(String message) {
            super(message);
        }
    }

    public static class TokenException extends RuntimeException {
        public TokenException(String message) {
            super(message);
        }
    }

    public static class AccountNotVerifiedException extends RuntimeException {
        public AccountNotVerifiedException(String message) {
            super(message);
        }
    }
}
