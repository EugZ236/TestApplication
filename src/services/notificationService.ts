import api from "./api";

export interface GroupNotificationRequest {
  title: string;
  body: string;
  teamId: string;
}

export interface MemberNotificationRequest {
  title: string;
  body: string;
  userId: string;
}

const notificationService = {
  sendGroupNotification: async (request: GroupNotificationRequest) => {
    console.log("Sending notification with request:", request);
    const response = await api.post(
      "/api/Notification/send-group",
      request,
    );
    return response.data;
  },
  sendMemberNotification: async (request: MemberNotificationRequest) => {
    console.log("Sending notification with request:", request);
    const response = await api.post(
      "/api/Notification/send-member",
      request,
    );
    return response.data;
  },
};

export default notificationService;
