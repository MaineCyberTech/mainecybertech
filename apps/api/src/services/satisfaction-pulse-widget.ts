import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { logAuditEvent } from "../services/audit";

export interface SatisfactionPulseRecord {
  id: string;
  organization_id: string;
  subject: string;
  question: string | null;
  rating: number;
  feedback: string | null;
  source: string;
  source_entity_id: string | null;
  template_id: string | null;
  status: string;
  sent_at: string | null;
  responded_at: string | null;
  send_at: string | null;
  scheduled_for: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SatisfactionPulseTemplate {
  id: string;
  organization_id: string;
  name: string;
  subject: string;
  question: string | null;
  default_rating: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SatisfactionPulseSchedule {
  id: string;
  organization_id: string;
  template_id: string | null;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  frequency: string | null;
  cron_expression: string | null;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function listSatisfactionPulses(
  organizationId: string,
  options: {
    status?: string;
    source?: string;
    sourceEntityId?: string;
    page: number;
    limit: number;
  },
) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("satisfaction_pulses")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (options.status) query = query.eq("status", options.status);
  if (options.source) query = query.eq("source", options.source);
  if (options.sourceEntityId) query = query.eq("source_entity_id", options.sourceEntityId);

  const from = (options.page - 1) * options.limit;
  const to = from + options.limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new AppError("DB_ERROR", error.message, 500);

  return success({
    items: data ?? [],
    total: count ?? 0,
    page: options.page,
    limit: options.limit,
  });
}

export async function getSatisfactionPulse(organizationId: string, id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("satisfaction_pulses")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (error) throw new AppError("NOT_FOUND", "Satisfaction pulse not found", 404);
  return success(data);
}

export async function createSatisfactionPulse(
  organizationId: string,
  userId: string,
  input: {
    subject: string;
    question?: string | null;
    rating?: number;
    feedback?: string | null;
    source?: string;
    sourceEntityId?: string | null;
    templateId?: string | null;
    sendAt?: string | null;
    scheduledFor?: string | null;
  },
) {
  const supabase = getSupabaseAdmin();

  const { data: record, error } = await supabase
    .from("satisfaction_pulses")
    .insert({
      organization_id: organizationId,
      subject: input.subject,
      question: input.question,
      rating: input.rating ?? 5,
      feedback: input.feedback,
      source: input.source ?? "ticket",
      source_entity_id: input.sourceEntityId,
      template_id: input.templateId,
      status: "pending",
      send_at: input.sendAt,
      scheduled_for: input.scheduledFor,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "satisfaction_pulse.created",
    entityType: "satisfaction_pulse",
    entityId: record.id,
    metadata: { subject: input.subject, source: input.source ?? "ticket" },
  });

  return success(record);
}

export async function updateSatisfactionPulse(
  organizationId: string,
  userId: string,
  id: string,
  input: Partial<SatisfactionPulseRecord>,
) {
  const supabase = getSupabaseAdmin();

  const { data: current, error: currentError } = await supabase
    .from("satisfaction_pulses")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (currentError) throw new AppError("NOT_FOUND", "Satisfaction pulse not found", 404);

  const updateData: Record<string, unknown> = { ...input };
  delete updateData.id;
  delete updateData.organization_id;
  delete updateData.created_at;

  const { data, error } = await supabase
    .from("satisfaction_pulses")
    .update(updateData)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "satisfaction_pulse.updated",
    entityType: "satisfaction_pulse",
    entityId: id,
    metadata: { before: current, after: data },
  });

  return success(data);
}

export async function respondSatisfactionPulse(
  organizationId: string,
  id: string,
  rating: number,
  feedback?: string | null,
) {
  const supabase = getSupabaseAdmin();

  const { data: current, error: currentError } = await supabase
    .from("satisfaction_pulses")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (currentError) throw new AppError("NOT_FOUND", "Satisfaction pulse not found", 404);

  const { data, error } = await supabase
    .from("satisfaction_pulses")
    .update({
      rating,
      feedback,
      status: "responded",
      responded_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: current.created_by,
    action: "satisfaction_pulse.responded",
    entityType: "satisfaction_pulse",
    entityId: id,
    metadata: { rating, feedback },
  });

  return success(data);
}

export async function deleteSatisfactionPulse(organizationId: string, userId: string, id: string) {
  const supabase = getSupabaseAdmin();

  const { data: current, error: currentError } = await supabase
    .from("satisfaction_pulses")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (currentError) throw new AppError("NOT_FOUND", "Satisfaction pulse not found", 404);

  const { error } = await supabase
    .from("satisfaction_pulses")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", id);

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "satisfaction_pulse.deleted",
    entityType: "satisfaction_pulse",
    entityId: id,
    metadata: { subject: current.subject },
  });

  return success({ deleted: true });
}

export async function exportSatisfactionPulses(
  organizationId: string,
  options: {
    status?: string;
    source?: string;
    format: "csv" | "json";
  },
) {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("satisfaction_pulses")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (options.status) query = query.eq("status", options.status);
  if (options.source) query = query.eq("source", options.source);

  const { data, error } = await query.limit(10000);
  if (error) throw new AppError("DB_ERROR", error.message, 500);

  return success(data ?? []);
}

export async function listTemplates(organizationId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("satisfaction_pulse_templates")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new AppError("DB_ERROR", error.message, 500);
  return success(data ?? []);
}

export async function getTemplate(organizationId: string, id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("satisfaction_pulse_templates")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (error) throw new AppError("NOT_FOUND", "Template not found", 404);
  return success(data);
}

export async function createTemplate(
  organizationId: string,
  userId: string,
  input: {
    name: string;
    subject: string;
    question?: string | null;
    defaultRating?: number;
    isActive?: boolean;
  },
) {
  const supabase = getSupabaseAdmin();

  const { data: record, error } = await supabase
    .from("satisfaction_pulse_templates")
    .insert({
      organization_id: organizationId,
      name: input.name,
      subject: input.subject,
      question: input.question,
      default_rating: input.defaultRating ?? 5,
      is_active: input.isActive ?? true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "satisfaction_pulse_template.created",
    entityType: "satisfaction_pulse_template",
    entityId: record.id,
    metadata: { name: input.name },
  });

  return success(record);
}

export async function updateTemplate(
  organizationId: string,
  userId: string,
  id: string,
  input: Partial<SatisfactionPulseTemplate>,
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("satisfaction_pulse_templates")
    .update(input)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "satisfaction_pulse_template.updated",
    entityType: "satisfaction_pulse_template",
    entityId: id,
    metadata: input,
  });

  return success(data);
}

export async function deleteTemplate(organizationId: string, userId: string, id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("satisfaction_pulse_templates")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", id);

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "satisfaction_pulse_template.deleted",
    entityType: "satisfaction_pulse_template",
    entityId: id,
  });

  return success({ deleted: true });
}

export async function listSchedules(organizationId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("satisfaction_pulse_schedules")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new AppError("DB_ERROR", error.message, 500);
  return success(data ?? []);
}

export async function createSchedule(
  organizationId: string,
  userId: string,
  input: {
    templateId?: string | null;
    name: string;
    triggerType: string;
    triggerConfig: Record<string, unknown>;
    frequency?: string | null;
    cronExpression?: string | null;
    isActive?: boolean;
  },
) {
  const supabase = getSupabaseAdmin();

  const { data: record, error } = await supabase
    .from("satisfaction_pulse_schedules")
    .insert({
      organization_id: organizationId,
      template_id: input.templateId,
      name: input.name,
      trigger_type: input.triggerType,
      trigger_config: input.triggerConfig,
      frequency: input.frequency,
      cron_expression: input.cronExpression,
      is_active: input.isActive ?? true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "satisfaction_pulse_schedule.created",
    entityType: "satisfaction_pulse_schedule",
    entityId: record.id,
    metadata: { name: input.name, triggerType: input.triggerType },
  });

  return success(record);
}

export async function updateSchedule(
  organizationId: string,
  userId: string,
  id: string,
  input: Partial<SatisfactionPulseSchedule>,
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("satisfaction_pulse_schedules")
    .update(input)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "satisfaction_pulse_schedule.updated",
    entityType: "satisfaction_pulse_schedule",
    entityId: id,
    metadata: input,
  });

  return success(data);
}

export async function deleteSchedule(organizationId: string, userId: string, id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("satisfaction_pulse_schedules")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", id);

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "satisfaction_pulse_schedule.deleted",
    entityType: "satisfaction_pulse_schedule",
    entityId: id,
  });

  return success({ deleted: true });
}
