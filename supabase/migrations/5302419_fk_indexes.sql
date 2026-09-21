-- Add indexes for foreign-key columns that lacked them (sequential scans on
-- joins/cascades as data grows). Idempotent.
create index if not exists idx_satisfaction_pulses_template
  on public.satisfaction_pulses(template_id);
create index if not exists idx_satisfaction_pulse_schedules_template
  on public.satisfaction_pulse_schedules(template_id);
create index if not exists idx_time_entries_ticket
  on public.time_entries(ticket_id);
create index if not exists idx_project_milestones_phase
  on public.project_milestones(phase_id);
create index if not exists idx_project_dependencies_milestone
  on public.project_dependencies(depends_on_milestone_id);
create index if not exists idx_project_dependencies_blocked_by_project
  on public.project_dependencies(blocked_by_project_id);
create index if not exists idx_training_enrollments_course
  on public.training_enrollments(course_id);
create index if not exists idx_kb_article_generations_source_ticket
  on public.kb_article_generations(source_ticket_id);
create index if not exists idx_ticket_triage_drafts_converted_ticket
  on public.ticket_triage_drafts(converted_ticket_id);
