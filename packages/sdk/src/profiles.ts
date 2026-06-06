import { ApiClient } from "./client";
import type { Profile } from "./types";

export class ProfilesApi {
  constructor(private client: ApiClient) {}

  list(params?: { ids?: string[] }) {
    const qp: Record<string, string> = {};
    if (params?.ids?.length) qp.ids = params.ids.join(",");
    return this.client.get<Profile[]>("/api/v1/profiles", qp);
  }

  get(id: string) {
    return this.client.get<Profile>(`/api/v1/profiles/${id}`);
  }

  update(id: string, data: { fullName?: string | null; phone?: string | null; title?: string | null }) {
    return this.client.patch<Profile>(`/api/v1/profiles/${id}`, data);
  }

  uploadAvatar(profileId: string, file: File | Blob, fileName?: string) {
    const formData = new FormData();
    formData.append("avatar", file, fileName);
    return this.client.postFormData<{ avatarUrl: string }>(
      `/api/v1/profiles/${profileId}/avatar`,
      formData,
    );
  }
}
