import api from "./api";

export interface NotificationRequest {
  title: string;
  body: string;
  userId: string;
}

const notificationService = {
  sendNotification: async (request: NotificationRequest) => {
    console.log("Sending notification with request:", request);
    const response = await api.post(
      "/api/Notification/SendNotification",
      request,
    );
    return response.data;
  },
};

export default notificationService;
