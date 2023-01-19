import axios from "axios";
import jwtDecode from "jwt-decode";
import { HathoraTransport, TransportType, WebSocketHathoraTransport } from "./transport.js";

export class HathoraClient {
  public static getUserFromToken(token: string): object & { id: string } {
    return jwtDecode(token);
  }

  public constructor(
    private serverUrl: string,
    private appId: string,
    private coordinatorHost: string = "coordinator.hathora.dev"
  ) {}

  public async loginAnonymous(): Promise<string> {
    const res = await axios.post(`https://${this.coordinatorHost}/${this.appId}/login/anonymous`);
    return res.data.token;
  }

  public async loginNickname(nickname: string): Promise<string> {
    const res = await axios.post(`https://${this.coordinatorHost}/${this.appId}/login/nickname`, { nickname });
    return res.data.token;
  }

  public async loginGoogle(idToken: string): Promise<string> {
    const res = await axios.post(`https://${this.coordinatorHost}/${this.appId}/login/google`, { idToken });
    return res.data.token;
  }

  public async create(token: string, data: ArrayBuffer): Promise<string> {
    const res = await axios.post(`https://${this.coordinatorHost}/${this.appId}/create`, data, {
      headers: { Authorization: token, "Content-Type": "application/octet-stream" },
    });
    return res.data.stateId;
  }

  public async connect(
    token: string,
    stateId: string,
    onMessage: (data: ArrayBuffer) => void,
    onClose: (e: { code: number; reason: string }) => void,
    transportType: TransportType = TransportType.WebSocket
  ): Promise<HathoraTransport> {
    const connection = this.getConnectionForTransportType(transportType);
    await connection.connect(stateId, token, onMessage, onClose);
    return connection;
  }

  private getConnectionForTransportType(transportType: TransportType): HathoraTransport {
    if (transportType === TransportType.WebSocket) {
      return new WebSocketHathoraTransport(this.serverUrl);
    }
    throw new Error("Unsupported transport type: " + transportType);
  }
}
