-- You Can't Trade trade-level AI reflections.
-- Stores generated AI interpretation separately from human review
-- and deterministic trade intelligence.

pragma foreign_keys = on;

create table if not exists ai_trade_reflections (
    id text primary key not null,
    trade_id text not null references trades(id) on delete cascade,
    summary text not null,
    key_observations_json text not null default '[]',
    action text,
    unknowns_json text not null default '[]',
    evidence_refs_json text not null default '[]',
    model text not null,
    prompt_version text not null,
    contract_version integer not null default 1,
    trade_updated_at text not null,
    created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists ai_trade_reflections_trade_idx
    on ai_trade_reflections(trade_id, created_at desc);