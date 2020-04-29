import { Room } from "colyseus";

export class GameRoom extends Room {
  playerList: any = {};
  currentCardsLeft: Array<any> = [];
  pickedCards: Array<number> = [];
  currentRound: Array<any> = [];
  circleBroken: Boolean = false;

  onCreate (options: any) {
    console.log("Game room created!", options);

    this.populateCardList();

    this.onMessage("message", (client, message) => {
      this.broadcast("messages", `[${this.playerList[client.sessionId]}]: ${message}`);
    });

    this.onMessage("name", (client, message) => {
      this.playerList[client.sessionId] = message;
      this.currentRound.push(client.sessionId);
      this.broadcast("userJoined", `${ message } joined.`);
      this.broadcast("updatePlayerList",  this.getPlayerNameList());
      client.send("updateCardsLeft", this.pickedCards);
      client.send("getTurn", `It's ${this.playerList[this.currentRound[0]]}'s turn!`);
    });

    this.onMessage("getCardResult", (client, message) => {
      if (this.currentRound[0] !== client.sessionId) {
        return;
      }
      let delElementIndex = this.currentRound.indexOf(client.sessionId);
      if (this.currentRound.length && delElementIndex !== -1) {
        this.currentRound.splice(delElementIndex, 1);
      } 
      if (this.pickedCards.length === this.currentCardsLeft.length) {
        this.pickedCards = [];
        this.currentCardsLeft = [];
        this.populateCardList();
        this.broadcast("generateCards", "");
      }
      this.broadcast("displayCardResult", this.currentCardsLeft[parseInt(message)]);
      this.broadcast("drawMessage", `${this.playerList[client.sessionId]} drew a \
        ${this.currentCardsLeft[parseInt(message)].value} of ${this.currentCardsLeft[parseInt(message)].suit}`);
      this.pickedCards.push(parseInt(message));
      this.broadcast("updateCardsLeft", this.pickedCards);
      if (!this.circleBroken) {
        this.checkCircle(this.playerList[client.sessionId]);
      }
      if (!this.currentRound.length) {
        this.currentRound = Object.keys(this.playerList); 
      }
      this.broadcast("getTurn", `It's ${this.playerList[this.currentRound[0]]}'s turn!`);
    });
  }

  onJoin(client: any) {
    client.send("generateCards", "");
  }

  onLeave(client: any) {
    let delElementIndex = this.currentRound.indexOf(client.sessionId);
    if (this.playerList[client.sessionId])
      this.broadcast("userLeft", `${ this.playerList[client.sessionId] } left.`);
    if (this.currentRound[0] === client.sessionId) {
      if (this.currentRound.length > 1) {
        this.broadcast("getTurn", `It's ${this.playerList[this.currentRound[1]]}'s turn!`);
      }
    }
    delete this.playerList[client.sessionId];
    if (this.currentRound.length && delElementIndex !== -1) {
      this.currentRound.splice(delElementIndex, 1);
      if (!this.currentRound.length) {
        this.currentRound = Object.keys(this.playerList); 
        this.broadcast("getTurn", `It's ${this.playerList[this.currentRound[0]]}'s turn!`);
      }
    }
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

  getPlayerNameList() {
    let playerNameList = [];
    for (let id in this.playerList) {
      playerNameList.push(this.playerList[id]);
    }
    return playerNameList;
  }

  checkCircle(playerName: string) {
    let consecutiveCards = 1;
    let previousCard = -1;
    this.pickedCards.sort();
    for (let card = 0; card < this.pickedCards.length; card++) {
      if (previousCard+1 === this.pickedCards[card]) {
        consecutiveCards++;
        if (consecutiveCards >= 6) {
          this.broadcast("circleBroken", `${playerName} has broke the circle!`);
          this.circleBroken = true;
          break;
        }
      } else {
        consecutiveCards = 1;
      }
      previousCard = this.pickedCards[card];
    }
  }
}
