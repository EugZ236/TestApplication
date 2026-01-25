import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.0.101:7200/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
