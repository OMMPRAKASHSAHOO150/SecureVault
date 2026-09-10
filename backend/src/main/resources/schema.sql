CREATE TABLE IF NOT EXISTS shared_password_entries (
    id BIGSERIAL PRIMARY KEY
);

ALTER TABLE shared_password_entries ADD COLUMN IF NOT EXISTS accepted boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS login_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id bigint NOT NULL,
    email varchar(255) NOT NULL,
    status varchar(20) NOT NULL,
    attempt_number integer NOT NULL,
    failure_reason varchar(255),
    ip_address varchar(100),
    created_at timestamp NOT NULL DEFAULT current_timestamp
);


