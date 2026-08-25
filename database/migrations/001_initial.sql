-- VantageForge personal SQLite journal foundation.
-- The local service applies this file on first start.

pragma foreign_keys = on;

create table if not exists trades (
    id text primary key not null,
    schema_version integer not null default 3,
    source text not null default 'TRADINGVIEW',
    status text not null default 'CAPTURED',
    captured_at text not null,
    updated_at text not null,
    symbol text not null default '',
    timeframe text not null default '',
    exchange text not null default '',
    direction text,
    entry real,
    stop_loss real,
    take_profit real,
    chart_anchor_time text,
    chart_anchor_interval text,
    exit_price real,
    result text,
    source_url text,
    screenshot_path text,
    created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    check (direction is null or direction in ('LONG', 'SHORT')),
    check (result is null or result in ('WIN', 'LOSS', 'BE')),
    check (status in ('CAPTURED', 'REVIEWED'))
);

create table if not exists trade_reviews (
    trade_id text primary key not null references trades(id) on delete cascade,
    setup text not null default '',
    session text,
    plan_adherence text,
    execution_tag text,
    notes text not null default '',
    emotions_json text not null default '[]',
    reviewed_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    check (session is null or session in ('ASIA', 'LONDON', 'NEW_YORK', 'OTHER')),
    check (plan_adherence is null or plan_adherence in ('FOLLOWED', 'DEVIATED'))
);

create table if not exists trade_embeddings (
    trade_id text primary key not null references trades(id) on delete cascade,
    content text not null,
    embedding_json text,
    embedding_model text,
    embedding_version text,
    created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists experiments (
    id text primary key not null,
    title text not null,
    behavior text not null,
    hypothesis text not null default '',
    baseline_metric text not null default '',
    target_metric text not null default '',
    sample_target integer not null default 10,
    start_date text not null,
    end_date text,
    status text not null default 'ACTIVE',
    related_pattern_id text,
    notes text not null default '',
    created_at text not null,
    completed_at text,
    check (status in ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'))
);

create index if not exists experiments_status_idx on experiments(status);

create table if not exists ai_insights (
    id text primary key not null,
    insight_type text not null,
    period_start text,
    period_end text,
    source_trade_ids_json text not null default '[]',
    summary text not null,
    action text,
    model text not null,
    prompt_version text not null,
    created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists trades_captured_idx on trades(captured_at desc);
create index if not exists trades_symbol_idx on trades(symbol);
create index if not exists trades_result_idx on trades(result);
create index if not exists reviews_setup_idx on trade_reviews(setup);

-- Provider configuration never contains raw credentials. Tokens live in the OS keyring
-- (or an in-memory session fallback when a keyring is unavailable).
create table if not exists app_settings (
    key text primary key not null,
    value text not null,
    updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists provider_cache (
    trade_id text primary key not null,
    provider text not null,
    provider_record_id text,
    metadata_json text not null,
    touched_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists provider_cache_touched_idx on provider_cache(touched_at asc);

create table if not exists storage_outbox (
    job_id text primary key not null,
    trade_id text not null,
    operation text not null,
    payload_json text not null,
    attempts integer not null default 0,
    status text not null default 'PENDING',
    created_at text not null,
    next_retry_at text not null,
    last_error text,
    check (status in ('PENDING', 'RETRYING', 'FAILED'))
);

create index if not exists storage_outbox_retry_idx on storage_outbox(status, next_retry_at);
