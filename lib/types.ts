export type Tag = {
  label: string;
  color: string;
};

export type Process = {
  id: string;
  numero: string;
  numero_modalidade: string | null;
  numero_convenio: string | null;
  objeto: string;
  status: string;
  cor: string;
  data_sessao: string | null;
  tags: Tag[];
  created_at: string;
  updated_at: string;
};

export type ProcessInput = {
  numero: string;
  numero_modalidade: string | null;
  numero_convenio: string | null;
  objeto: string;
  status: string;
  cor: string;
  data_sessao: string | null;
  tags: Tag[];
};

export type ProcessEventType = "created" | "status_changed" | "updated" | "deleted";

export type ProcessEvent = {
  id: string;
  process_id: string | null;
  process_numero: string;
  process_objeto: string;
  event_type: ProcessEventType;
  actor_email: string | null;
  old_status: string | null;
  new_status: string | null;
  old_cor: string | null;
  new_cor: string | null;
  created_at: string;
};
