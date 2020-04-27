import { Room } from "colyseus";

export class GameRoom extends Room {

  onCreate (options: any) {
    console.log("Game room created!", options);

    this.onMessage("type", (client, message) => {
      // handle "type" message
      this.onMessage("message", (client, message) => {
        console.log("ChatRoom received message from", client.sessionId, ":", message);
        this.broadcast("messages", `(${client.sessionId}) ${message}`);
      });
    });
  }

  onJoin(client: any) {
    this.broadcast("messages", `${ client.sessionId } joined.`);
  }

  onLeave(client: any) {
      this.broadcast("messages", `${ client.sessionId } left.`);
  }

  onDispose () {
      console.log("Dispose GameRoom");
  }

}
