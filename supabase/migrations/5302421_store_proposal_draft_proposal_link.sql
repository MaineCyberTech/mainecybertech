-- Link the store intake handoff to the first-class proposals stack.
--
-- `store_proposal_drafts` (5302115) held the generated store-pack draft but had
-- no pointer to the `proposals` row (5302059) that enters the approval/publish
-- workflow, so the two were disconnected. Persist the link here rather than
-- adding `quote_request_id` to `proposals`, so the store pack stays additive.
begin;

alter table public.store_proposal_drafts
  add column if not exists proposal_id uuid references public.proposals(id) on delete set null;

create index if not exists store_proposal_drafts_proposal_id_idx
  on public.store_proposal_drafts (proposal_id);

commit;
