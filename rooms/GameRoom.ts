import { Room } from "colyseus";

export class GameRoom extends Room {
  playerList: any = {};
  currentCardsLeft: Array<any> = [];
  undefinedIndexes: Array<Number> = [];

  onCreate (options: any) {
    console.log("Game room created!", options);

    this.populateCardList();

    this.onMessage("message", (client, message) => {
      this.broadcast("messages", `[${this.playerList[client.sessionId]}]: ${message}`);
    });

    this.onMessage("name", (client, message) => {
      this.playerList[client.sessionId] = message;
      this.broadcast("userJoined", `${ message } joined.`);
      this.broadcast("updatePlayerList",  this.getPlayerNameList());
      client.send("updateCardsLeft", this.undefinedIndexes);
    });

    this.onMessage("getCardResult", (client, message) => {
      this.broadcast("displayCardResult", this.currentCardsLeft[parseInt(message)]);
      this.broadcast("drawMessage", `${this.playerList[client.sessionId]} drew a \
        ${this.currentCardsLeft[parseInt(message)].value} of ${this.currentCardsLeft[parseInt(message)].suit}`);
      this.undefinedIndexes.push(parseInt(message));
      this.broadcast("updateCardsLeft", this.undefinedIndexes);
    });
  }

  onJoin(client: any) {
    this.playerList[client.sessionId] = '';
  }

  onLeave(client: any) {
      if (this.playerList[client.sessionId])
        this.broadcast("userLeft", `${ this.playerList[client.sessionId] } left.`);
      delete this.playerList[client.sessionId];
      this.broadcast("updatePlayerList", this.getPlayerNameList());
  }

  onDispose () {
      console.log("Dispose GameRoom");
  }

  populateCardList () {
    const suits = ['Hearts', 'Spades', 'Clubs', 'Diamonds'];
    const values = ['Ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'Jack', 'Queen', 'King'];

    for (let suit in suits) {
      for (let value in values) {
        this.currentCardsLeft.push({"suit": `${suits[suit]}`, "value": `${values[value]}`});
      }
    }

    for (let i = this.currentCardsLeft.length-1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = this.currentCardsLeft[i];
      this.currentCardsLeft[i] = this.currentCardsLeft[j];
      this.currentCardsLeft[j] = temp;
    }
  }

  getPlayerNameList () {
    let playerNameList = [];
    for (let id in this.playerList) {
      playerNameList.push(this.playerList[id]);
    }
    return playerNameList;
  }
}
