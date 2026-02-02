import Toast from "react-native-toast-message";

export const showToast = {
  success: (title: string, message?: string) => {
    Toast.show({
      type: "success",
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: 3000,
    });
  },

  error: (title: string, message?: string) => {
    Toast.show({
      type: "error",
      text1: title,
      text2: message || "Щось пішло не так ❌",
      position: "top",
    });
  },

  info: (title: string, message?: string) => {
    Toast.show({
      type: "info",
      text1: title,
      text2: message,
      position: "top",
    });
  },
};
