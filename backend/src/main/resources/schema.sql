alter table if exists shared_password_entries
    add column if not exists accepted boolean;

update shared_password_entries
set accepted = false
where accepted is null;

alter table if exists shared_password_entries
    alter column accepted set default false;

alter table if exists shared_password_entries
    alter column accepted set not null;
