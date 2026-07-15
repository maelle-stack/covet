-- 0001_initial_schema.sql
-- Initial Covet schema: the 19 core entities from docs/05_engineering_architecture.md.
--
-- Conventions
--   * Money: bigint, integer minor units (cents). Never float/numeric-with-rounding.
--   * Timestamps: timestamptz (UTC). Calendar dates: date. Quiet hours: time.
--   * Enum-like fields: text + CHECK constraint. The allowed literals MUST stay
--     in sync with the `as const` arrays in @covet/shared-types (enforced by
--     apps/backend/src/db/schema.test.ts).
--   * Naming: snake_case here <-> camelCase in TypeScript models.
--   * metadata jsonb columns are extensibility-only and MUST NOT carry values
--     that affect money, commitments, notifications, or trust.
--   * RLS: enabled on all user-owned tables. Clients (Supabase anon key) may
--     only SELECT their own rows; all writes go through backend services using
--     the service role, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- users (id matches Supabase auth.users id)
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text,
  timezone text not null default 'UTC',
  locale text not null default 'en-US',
  onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started','account_created','bank_connected','calendar_prompted','quiz_completed','context_captured','completed')),
  primary_archetype text
    check (primary_archetype in ('drifter','spontaneous','keeper','giver','builder')),
  secondary_archetype text
    check (secondary_archetype in ('drifter','spontaneous','keeper','giver','builder')),
  active_goal text
    check (active_goal in ('stop_overspending','build_cushion','pay_down_debt','know_what_i_can_spend','save_for_something','stay_on_track')),
  strictness_level text not null default 'balanced'
    check (strictness_level in ('light','balanced','protective')),
  account_status text not null default 'active'
    check (account_status in ('active','suspended','pending_deletion','deleted'))
);

-- ---------------------------------------------------------------------------
-- user_settings (1:1 with users; defaults favor restraint)
-- ---------------------------------------------------------------------------
create table user_settings (
  user_id uuid primary key references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  quiet_hours_start time not null default '21:00',
  quiet_hours_end time not null default '09:00',
  notification_privacy_level text not null default 'discreet'
    check (notification_privacy_level in ('full_detail','discreet','hidden')),
  daily_pacing_enabled boolean not null default true,
  daily_pacing_notifications_enabled boolean not null default true,
  sale_alerts_enabled boolean not null default false,
  vault_notifications_enabled boolean not null default true,
  review_prompts_enabled boolean not null default true,
  biometric_lock_enabled boolean not null default false,
  calendar_suggestions_enabled boolean not null default true,
  wallet_primary_color text,
  analytics_opt_out boolean not null default false
);

-- ---------------------------------------------------------------------------
-- auth_identities (links to auth provider; no credentials stored here)
-- ---------------------------------------------------------------------------
create table auth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('phone','email','apple')),
  provider_user_id text not null,
  email text,
  phone_number text,
  created_at timestamptz not null default now(),
  last_authenticated_at timestamptz,
  unique (provider, provider_user_id)
);
create index auth_identities_user_id_idx on auth_identities(user_id);

-- ---------------------------------------------------------------------------
-- bank_connections (Plaid items; tokens live in backend secret storage, NOT here)
-- ---------------------------------------------------------------------------
create table bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null default 'plaid' check (provider in ('plaid')),
  provider_item_id text not null unique,
  institution_name text not null,
  status text not null default 'pending'
    check (status in ('pending','active','requires_reauth','error','disconnected')),
  last_successful_sync_at timestamptz,
  last_webhook_at timestamptz,
  requires_reauth boolean not null default false,
  error_code text,
  created_at timestamptz not null default now()
);
create index bank_connections_user_id_idx on bank_connections(user_id);

-- ---------------------------------------------------------------------------
-- accounts (checking feeds Safe to Spend; savings excluded in v1; credit only reduces)
-- ---------------------------------------------------------------------------
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bank_connection_id uuid not null references bank_connections(id) on delete cascade,
  provider_account_id text not null,
  name text not null,
  official_name text,
  type text not null check (type in ('depository','credit','loan','investment','other')),
  subtype text not null check (subtype in ('checking','savings','credit_card','other')),
  mask_last4 text,
  current_balance bigint not null,
  available_balance bigint,
  credit_limit bigint,
  iso_currency_code text not null default 'USD',
  last_synced_at timestamptz,
  status text not null default 'active' check (status in ('active','closed','inactive')),
  unique (bank_connection_id, provider_account_id)
);
create index accounts_user_id_idx on accounts(user_id);

-- ---------------------------------------------------------------------------
-- transactions (pending reduces Safe to Spend immediately; dedupe via unique key)
-- ---------------------------------------------------------------------------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  provider_transaction_id text not null,
  amount bigint not null, -- positive = money out, negative = money in
  merchant_name text,
  original_description text,
  category text,
  subcategory text,
  date date not null,
  authorized_date date,
  pending boolean not null default false,
  type text not null check (type in ('debit','credit')),
  iso_currency_code text not null default 'USD',
  payment_channel text not null default 'other'
    check (payment_channel in ('online','in_store','other')),
  confidence smallint check (confidence between 0 and 100),
  is_transfer boolean not null default false,
  excluded_from_income boolean not null default false,
  excluded_from_spending boolean not null default false,
  recurring_candidate_id uuid,
  metadata jsonb,
  unique (account_id, provider_transaction_id)
);
create index transactions_user_id_date_idx on transactions(user_id, date desc);
create index transactions_account_id_idx on transactions(account_id);
create index transactions_pending_idx on transactions(user_id) where pending;

-- ---------------------------------------------------------------------------
-- calendar_connections
-- ---------------------------------------------------------------------------
create table calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('google','apple')),
  status text not null default 'pending'
    check (status in ('pending','active','requires_reauth','error','disconnected')),
  last_successful_sync_at timestamptz,
  requires_reauth boolean not null default false,
  selected_calendars text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index calendar_connections_user_id_idx on calendar_connections(user_id);

-- ---------------------------------------------------------------------------
-- calendar_events (virtual events never auto-become commitments)
-- ---------------------------------------------------------------------------
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  calendar_connection_id uuid not null references calendar_connections(id) on delete cascade,
  provider_event_id text not null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  timezone text not null,
  location text,
  classification text not null default 'unknown'
    check (classification in ('virtual','in_person','travel','academic','social','birthday','appointment','unknown')),
  is_virtual boolean not null default false,
  virtual_provider text,
  travel_distance_km_estimate real,
  travel_mode text
    check (travel_mode in ('walking','public_transit','rideshare','driving','train','flight','not_sure')),
  notes_available boolean not null default false,
  spend_candidate boolean not null default false,
  confidence smallint check (confidence between 0 and 100),
  linked_commitment_id uuid,
  metadata jsonb,
  unique (calendar_connection_id, provider_event_id)
);
create index calendar_events_user_id_start_idx on calendar_events(user_id, start_at);

-- ---------------------------------------------------------------------------
-- commitments (hard > semi_hard > soft; gradual protection)
-- ---------------------------------------------------------------------------
create table commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  source text not null
    check (source in ('transaction_detected','calendar','user_entered','onboarding_context','purchase_check')),
  title text not null,
  amount bigint,
  estimated_amount bigint,
  confirmed_amount bigint,
  due_at timestamptz,
  commitment_type text not null
    check (commitment_type in ('rent','essential_bill','insurance','debt_minimum','subscription','event','travel','fee','habit','goal','other')),
  hardness text not null check (hardness in ('hard','semi_hard','soft')),
  status text not null default 'candidate'
    check (status in ('candidate','protected','partial','at_risk','denied','completed','paused')),
  protected_amount bigint not null default 0,
  protection_start_at timestamptz,
  confidence smallint check (confidence between 0 and 100),
  user_confirmed boolean not null default false,
  user_denied boolean not null default false,
  linked_calendar_event_id uuid references calendar_events(id) on delete set null,
  linked_transaction_id uuid references transactions(id) on delete set null,
  linked_recurring_item_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb
);
create index commitments_user_id_due_idx on commitments(user_id, due_at);
create index commitments_user_id_status_idx on commitments(user_id, status);

-- ---------------------------------------------------------------------------
-- recurring_items (bills + subscriptions + lifestyle habits)
-- ---------------------------------------------------------------------------
create table recurring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  merchant_name text,
  amount_estimate bigint,
  cadence text not null
    check (cadence in ('weekly','biweekly','semimonthly','monthly','quarterly','yearly','irregular')),
  next_expected_at timestamptz,
  recurring_type text not null check (recurring_type in ('bill','subscription','habit')),
  hardness text not null check (hardness in ('hard','semi_hard','soft')),
  confidence smallint check (confidence between 0 and 100),
  status text not null default 'detected'
    check (status in ('detected','confirmed','denied','ended')),
  linked_pattern_id uuid,
  last_seen_at timestamptz,
  user_confirmed boolean not null default false,
  user_paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb
);
create index recurring_items_user_id_idx on recurring_items(user_id);
create index recurring_items_next_expected_idx on recurring_items(user_id, next_expected_at);

-- link deferred until both tables exist
alter table commitments
  add constraint commitments_linked_recurring_item_fk
  foreign key (linked_recurring_item_id) references recurring_items(id) on delete set null;

-- ---------------------------------------------------------------------------
-- patterns (never product truth automatically; typed entity refs, no blobs)
-- ---------------------------------------------------------------------------
create table patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null
    check (type in ('recurring_bill','subscription','lifestyle_habit','payday_cadence','category_spike','merchant_repeat','seasonal_context','transfer_pattern','social_spending','other')),
  description text not null,
  confidence smallint not null check (confidence between 0 and 100),
  evidence_summary text not null,
  status text not null default 'detected'
    check (status in ('detected','suggested','confirmed','denied','expired')),
  first_detected_at timestamptz not null,
  last_detected_at timestamptz not null,
  confirmed_at timestamptz,
  denied_at timestamptz,
  -- array of {entityType, entityId}; shape fixed by @covet/shared-types EntityRef
  related_entities jsonb not null default '[]'
);
create index patterns_user_id_status_idx on patterns(user_id, status);

alter table recurring_items
  add constraint recurring_items_linked_pattern_fk
  foreign key (linked_pattern_id) references patterns(id) on delete set null;

-- ---------------------------------------------------------------------------
-- archetype_results
-- ---------------------------------------------------------------------------
create table archetype_results (
  user_id uuid primary key references users(id) on delete cascade,
  primary_archetype text not null
    check (primary_archetype in ('drifter','spontaneous','keeper','giver','builder')),
  secondary_archetype text not null
    check (secondary_archetype in ('drifter','spontaneous','keeper','giver','builder')),
  quiz_version text not null,
  -- array of {questionId, answerId}; shape fixed by @covet/shared-types
  answers jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- safe_to_spend_snapshots (immutable engine outputs; append-only)
-- ---------------------------------------------------------------------------
create table safe_to_spend_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount bigint not null,
  pay_cycle_start date not null,
  pay_cycle_end date not null,
  days_until_next_income integer,
  daily_pace bigint,
  internal_projected_pace bigint,
  status text not null
    check (status in ('YOURE_GOOD','TAKE_IT_EASY','WAIT_UNTIL_PAYDAY','LETS_NOT')),
  confidence_score smallint not null check (confidence_score between 0 and 100),
  external_confidence_label text not null
    check (external_confidence_label in ('high','medium','still_learning')),
  -- immutable copies of ProtectedCommitmentRef[] taken at calculation time;
  -- the commitments table remains the source of truth
  protected_hard_commitments jsonb not null default '[]',
  protected_soft_commitments jsonb not null default '[]',
  debt_pressure_level text not null
    check (debt_pressure_level in ('healthy','normal','elevated','high','severe','critical')),
  obligation_pressure_level text not null
    check (obligation_pressure_level in ('normal','high')),
  emergency_floor_applied bigint not null,
  behavior_buffer_applied bigint not null,
  major_change_flags text[] not null default '{}',
  explanation_summary text not null,
  last_calculated_at timestamptz not null default now(),
  stale_after timestamptz not null,
  inputs_hash text not null
);
create index sts_snapshots_user_latest_idx on safe_to_spend_snapshots(user_id, last_calculated_at desc);

-- ---------------------------------------------------------------------------
-- purchase_checks
-- ---------------------------------------------------------------------------
create table purchase_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  input_type text not null check (input_type in ('text','link','screenshot')),
  raw_input text not null,
  parsed_item_name text,
  parsed_merchant text,
  parsed_price bigint,
  parsed_url text,
  screenshot_asset_id text,
  decision text not null check (decision in ('yes','wait','no')),
  decision_reason text not null,
  safe_to_spend_before bigint not null,
  safe_to_spend_after_hypothetical bigint not null,
  related_vault_id uuid,
  status_at_decision text not null
    check (status_at_decision in ('YOURE_GOOD','TAKE_IT_EASY','WAIT_UNTIL_PAYDAY','LETS_NOT')),
  created_at timestamptz not null default now(),
  follow_up_at timestamptz
);
create index purchase_checks_user_id_idx on purchase_checks(user_id, created_at desc);
create index purchase_checks_follow_up_idx on purchase_checks(follow_up_at) where follow_up_at is not null;

-- ---------------------------------------------------------------------------
-- vaults (reduce Safe to Spend only when actively protected)
-- ---------------------------------------------------------------------------
create table vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  target_amount bigint not null,
  current_protected_amount bigint not null default 0,
  desired_by_date date,
  status text not null default 'saved'
    check (status in ('saved','active','achieved','archived')),
  actively_protected boolean not null default false,
  source text not null default 'user_entered'
    check (source in ('user_entered','purchase_check')),
  merchant text,
  url text,
  image_asset_id text,
  affordability_date date,
  last_recalculated_at timestamptz,
  affordability_alerts_enabled boolean not null default true,
  sale_alerts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vaults_user_id_idx on vaults(user_id);

alter table purchase_checks
  add constraint purchase_checks_related_vault_fk
  foreign key (related_vault_id) references vaults(id) on delete set null;

-- ---------------------------------------------------------------------------
-- notifications (generated only by the Notification Engine)
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  candidate_event_id uuid not null,
  trigger_type text not null
    check (trigger_type in ('status_change','safe_to_spend_increase','safe_to_spend_decrease','commitment_protected','commitment_at_risk','purchase_check_follow_up','vault_affordability','sale_alert','pattern_confirmation','calendar_event_confirmation','repetitive_behavior','soft_commitment_pause','connection_health','security')),
  severity text not null check (severity in ('note','nudge','review','protect')),
  title text not null,
  body text not null,
  privacy_body text not null,
  created_at timestamptz not null default now(),
  scheduled_for timestamptz,
  sent_at timestamptz,
  quiet_hours_applied boolean not null default false,
  batched_event_ids uuid[] not null default '{}',
  suppressed_reason text
    check (suppressed_reason in ('seen_in_app_recently','dismissed_in_app','duplicate_warning','below_materiality','preference_disabled','daily_cap_reached','quiet_hours_expired')),
  status_before text check (status_before in ('YOURE_GOOD','TAKE_IT_EASY','WAIT_UNTIL_PAYDAY','LETS_NOT')),
  status_after text check (status_after in ('YOURE_GOOD','TAKE_IT_EASY','WAIT_UNTIL_PAYDAY','LETS_NOT')),
  safe_to_spend_before bigint,
  safe_to_spend_after bigint,
  related_commitment_id uuid references commitments(id) on delete set null,
  related_vault_id uuid references vaults(id) on delete set null,
  related_pattern_id uuid references patterns(id) on delete set null,
  related_purchase_check_id uuid references purchase_checks(id) on delete set null,
  action_type text not null default 'none'
    check (action_type in ('approve_deny','confirm','review','none')),
  user_response text check (user_response in ('opened','approved','denied','dismissed'))
);
create index notifications_user_id_created_idx on notifications(user_id, created_at desc);
create index notifications_scheduled_idx on notifications(scheduled_for)
  where scheduled_for is not null and sent_at is null;

-- ---------------------------------------------------------------------------
-- insights (>= 25 transactions required before generation; user-specific only)
-- ---------------------------------------------------------------------------
create table insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  insight_type text not null
    check (insight_type in ('spending_shift','habit_observation','timing_observation','merchant_concentration','income_observation','commitment_observation','other')),
  title text not null,
  body text not null,
  evidence_summary text not null,
  confidence smallint not null check (confidence between 0 and 100),
  generated_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active','expired','dismissed')),
  related_transaction_ids uuid[] not null default '{}',
  related_pattern_ids uuid[] not null default '{}',
  related_commitment_ids uuid[] not null default '{}',
  user_feedback text check (user_feedback in ('helpful','not_helpful'))
);
create index insights_user_id_status_idx on insights(user_id, status);

-- ---------------------------------------------------------------------------
-- sync_jobs
-- ---------------------------------------------------------------------------
create table sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  job_type text not null
    check (job_type in ('plaid_sync','calendar_sync','notification_check','financial_recalculation','insight_generation','cleanup')),
  status text not null default 'pending'
    check (status in ('pending','running','succeeded','failed','cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  error_message text,
  retry_count integer not null default 0,
  created_at timestamptz not null default now(),
  metadata jsonb
);
create index sync_jobs_user_id_idx on sync_jobs(user_id);
create index sync_jobs_status_idx on sync_jobs(status) where status in ('pending','running');

-- ---------------------------------------------------------------------------
-- audit_events (append-only; no raw sensitive values)
-- ---------------------------------------------------------------------------
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  event_type text not null
    check (event_type in ('user_created','user_deleted','data_export_requested','data_deletion_requested','bank_connected','bank_disconnected','calendar_connected','calendar_disconnected','engine_recalculated','notification_sent','notification_suppressed','settings_changed','pattern_confirmed','pattern_denied','commitment_confirmed','commitment_denied','vault_activated','auth_event','security_event','other')),
  entity_type text
    check (entity_type in ('user','account','bank_connection','transaction','calendar_connection','calendar_event','commitment','recurring_item','pattern','archetype_result','safe_to_spend_snapshot','purchase_check','vault','notification','insight','sync_job')),
  entity_id uuid,
  created_at timestamptz not null default now(),
  metadata jsonb
);
create index audit_events_user_id_idx on audit_events(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security: clients read only their own rows; writes are
-- backend-service-only (Supabase service role bypasses RLS).
-- ---------------------------------------------------------------------------
alter table users enable row level security;
alter table user_settings enable row level security;
alter table auth_identities enable row level security;
alter table bank_connections enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table calendar_connections enable row level security;
alter table calendar_events enable row level security;
alter table commitments enable row level security;
alter table recurring_items enable row level security;
alter table patterns enable row level security;
alter table archetype_results enable row level security;
alter table safe_to_spend_snapshots enable row level security;
alter table purchase_checks enable row level security;
alter table vaults enable row level security;
alter table notifications enable row level security;
alter table insights enable row level security;
alter table sync_jobs enable row level security;
alter table audit_events enable row level security;

create policy users_select_own on users for select using (id = auth.uid());
create policy user_settings_select_own on user_settings for select using (user_id = auth.uid());
create policy auth_identities_select_own on auth_identities for select using (user_id = auth.uid());
create policy bank_connections_select_own on bank_connections for select using (user_id = auth.uid());
create policy accounts_select_own on accounts for select using (user_id = auth.uid());
create policy transactions_select_own on transactions for select using (user_id = auth.uid());
create policy calendar_connections_select_own on calendar_connections for select using (user_id = auth.uid());
create policy calendar_events_select_own on calendar_events for select using (user_id = auth.uid());
create policy commitments_select_own on commitments for select using (user_id = auth.uid());
create policy recurring_items_select_own on recurring_items for select using (user_id = auth.uid());
create policy patterns_select_own on patterns for select using (user_id = auth.uid());
create policy archetype_results_select_own on archetype_results for select using (user_id = auth.uid());
create policy sts_snapshots_select_own on safe_to_spend_snapshots for select using (user_id = auth.uid());
create policy purchase_checks_select_own on purchase_checks for select using (user_id = auth.uid());
create policy vaults_select_own on vaults for select using (user_id = auth.uid());
create policy notifications_select_own on notifications for select using (user_id = auth.uid());
create policy insights_select_own on insights for select using (user_id = auth.uid());
-- sync_jobs and audit_events are backend/operational: no client select policy.
