import * as signalR from "@microsoft/signalr";
import api from "./api";

export interface ShoppingListItem {
  id: number;
  title: string;
  section: string;
  qty: number;
  unit: string;
  note: string;
}

type ShoppingListCallback = (item: ShoppingListItem) => void;
type ItemRemovedCallback = (itemId: number) => void;

class ShoppingListSignalRService {
  private connection: signalR.HubConnection | null = null;
  private currentToken: string | null = null;
  private currentTeamId: number | null = null;
  private itemAddedCallback: ShoppingListCallback | null = null;
  private itemUpdatedCallback: ShoppingListCallback | null = null;
  private itemRemovedCallback: ItemRemovedCallback | null = null;
  private isConnecting = false;

  async connect(token: string, teamId: number): Promise<void> {
    if (!token || !teamId) {
      return;
    }

    // Re-create connection when user token or selected team changes.
    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected &&
      (this.currentToken !== token || this.currentTeamId !== teamId)
    ) {
      await this.connection.stop();
      this.connection = null;
    }

    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    ) {
      console.log("Already connected to SignalR");
      return;
    }

    if (this.isConnecting) {
      console.log("Connection in progress...");
      return;
    }

    this.isConnecting = true;

    try {
      const baseUrl = (api.defaults.baseURL ?? "").replace(/\/$/, "");
      if (!baseUrl) {
        throw new Error("SignalR base URL is not configured");
      }

      this.currentToken = token;
      this.currentTeamId = teamId;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/hubs/shopping-list`, {
          accessTokenFactory: () => this.currentToken ?? "",
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .withHubProtocol(new signalR.JsonHubProtocol())
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Register message handlers
      this.connection.on("ItemAdded", (item: any) => {
        console.log("SignalR: ItemAdded", item);
        const mapped = this.mapItem(item);
        this.itemAddedCallback?.(mapped);
      });

      this.connection.on("ItemUpdated", (item: any) => {
        console.log("SignalR: ItemUpdated", item);
        const mapped = this.mapItem(item);
        this.itemUpdatedCallback?.(mapped);
      });

      this.connection.on("ItemRemoved", (itemId: number) => {
        console.log("SignalR: ItemRemoved", itemId);
        this.itemRemovedCallback?.(itemId);
      });

      this.connection.onreconnected(() => {
        console.log("SignalR reconnected");
      });

      this.connection.onreconnecting(() => {
        console.log("SignalR reconnecting...");
      });

      this.connection.onclose(() => {
        console.log("SignalR disconnected");
      });

      await this.connection.start();
      console.log("SignalR connected:", this.connection.connectionId);
    } catch (error) {
      console.error("Failed to connect to SignalR:", error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    if (this.connection) {
      this.connection
        .stop()
        .catch((err) => console.error("Disconnect error:", err));
      this.connection = null;
      this.currentToken = null;
      this.currentTeamId = null;
      this.itemAddedCallback = null;
      this.itemUpdatedCallback = null;
      this.itemRemovedCallback = null;
    }
  }

  onItemAdded(callback: ShoppingListCallback): void {
    this.itemAddedCallback = callback;
  }

  onItemUpdated(callback: ShoppingListCallback): void {
    this.itemUpdatedCallback = callback;
  }

  onItemRemoved(callback: ItemRemovedCallback): void {
    this.itemRemovedCallback = callback;
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  private mapItem(item: any): ShoppingListItem {
    return {
      id: item.id,
      title: item.name ?? "Продукт",
      section: item.category ?? "",
      qty: item.quantity ?? 1,
      unit: item.unit ?? "шт",
      note: item.note ?? "",
    };
  }
}

export default new ShoppingListSignalRService();
