import "server-only";

export {
  getAlgaPsaIntakeConfig,
  isAlgaPsaIntakeEnabled,
  readAlgaPsaIntakeConfig,
  type AlgaPsaConfigReason,
  type AlgaPsaConfigStatus,
  type AlgaPsaIntakeConfig,
} from "./config";
export {
  ALGA_PSA_EXTERNAL_SYSTEM,
  ALGA_PSA_TIMEOUT_MS,
  AlgaPsaError,
  createIntakeTicket,
  type AlgaIntakeTicket,
  type CreateIntakeTicketInput,
} from "./client";
