import { ApiClient } from "./client";

export class TrainingHubApi {
  constructor(private client: ApiClient) {}

  courses = {
    list: (params?: { page?: number; limit?: number; organizationId?: string }) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params?.page !== undefined) qp.page = params.page;
      if (params?.limit !== undefined) qp.limit = params.limit;
      if (params?.organizationId) qp.organization_id = params.organizationId;
      return this.client.get("/api/v1/training-hub/courses", qp);
    },
    get: (id: string) => this.client.get(`/api/v1/training-hub/courses/${id}`),
    create: (data: Record<string, unknown>) =>
      this.client.post("/api/v1/training-hub/courses", data),
    update: (id: string, data: Record<string, unknown>) =>
      this.client.patch(`/api/v1/training-hub/courses/${id}`, data),
    remove: (id: string) => this.client.delete(`/api/v1/training-hub/courses/${id}`),
    enroll: (id: string) => this.client.post(`/api/v1/training-hub/courses/${id}/enroll`, {}),
    progress: (id: string, progress: number) =>
      this.client.post(`/api/v1/training-hub/courses/${id}/progress`, { progress }),
  };

  lessons = {
    list: (courseId: string) =>
      this.client.get("/api/v1/training-hub/lessons", { course_id: courseId }),
    get: (id: string) => this.client.get(`/api/v1/training-hub/lessons/${id}`),
    create: (data: Record<string, unknown>) =>
      this.client.post("/api/v1/training-hub/lessons", data),
    update: (id: string, data: Record<string, unknown>) =>
      this.client.patch(`/api/v1/training-hub/lessons/${id}`, data),
    remove: (id: string) => this.client.delete(`/api/v1/training-hub/lessons/${id}`),
  };

  myCourses = () => this.client.get("/api/v1/training-hub/my-courses");
}
