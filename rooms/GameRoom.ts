import { Room } from "colyseus";

export class GameRoom extends Room {
  playerList: any = [];
  onCreate (options: any) {
    console.log("Game room created!", options);

    this.onMessage("message", (client, message) => {
      console.log("ChatRoom received message from", client.sessionId, ":", message);
      this.broadcast("messages", `${client.sessionId}: ${message}`);
    });
  }

  onJoin(client: any) {
    this.playerList.push(client.sessionId);
    this.broadcast("messages", `${ client.sessionId } joined.`);
  }

  onLeave(client: any) {
      this.playerList = this.playerList.filter((p: string) => p != client.sessionId);
      this.broadcast("messages", `${ client.sessionId } left.`);
  }

  onDispose () {
      console.log("Dispose GameRoom");
  }

}
