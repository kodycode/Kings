import { Room } from "colyseus";
import { Dictionary } from "express-serve-static-core";

export class GameRoom extends Room {
  playerList: any = {};
  cardCount: any = {};
  currentCards: Array<any> = [];
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
      client.send("getTurn", `It's ${this.playerList[this.currentRound[0]]}'s turn!`);
      client.send("getCardCount", this.cardCount);
    });

    this.onMessage("getCardResult", (client, message) => {
      if (this.currentRound[0] !== client.sessionId) {
        return;
      }
      let delElementIndex = this.currentRound.indexOf(client.sessionId);
      if (this.currentRound.length && delElementIndex !== -1) {
        this.currentRound.splice(delElementIndex, 1);
      } 
      if (this.pickedCards.length === this.currentCards.length) {
        this.pickedCards = [];
        this.currentCards = [];
        this.populateCardList();
        this.broadcast("generateCards", this.pickedCards);
      }
      let cardDrawn = this.currentCards[parseInt(message)];
      this.pickedCards.push(parseInt(message));
      if (!this.circleBroken) {
        this.checkCircle(this.playerList[client.sessionId]);
      }
      if (!this.currentRound.length) {
        this.currentRound = Object.keys(this.playerList); 
      }
      --this.cardCount[cardDrawn.value];
      this.broadcast("displayCardResult", {card: cardDrawn, playerName: this.playerList[client.sessionId]});
      this.broadcast("drawMessage", `${this.playerList[client.sessionId]} drew a \
        ${cardDrawn.value} of ${cardDrawn.suit}`);
      this.broadcast("updateCardsLeft", this.pickedCards);
      this.broadcast("getTurn", `It's ${this.playerList[this.currentRound[0]]}'s turn!`);
      this.broadcast("getCardCount", this.cardCount);
    });
  }

  onJoin(client: any) {
    client.send("generateCards", this.pickedCards);
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

    // create deck of cards
    for (let suit in suits) {
      for (let value in values) {
        this.currentCards.push({"suit": `${suits[suit]}`, "value": `${values[value]}`});
      }
    }

    // randomize deck of cards
    for (let i = this.currentCards.length-1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = this.currentCards[i];
      this.currentCards[i] = this.currentCards[j];
      this.currentCards[j] = temp;
    }

    // create card counter
    for (let i = 0; i < values.length; i++) {
      this.cardCount[values[i]] = 4;
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
      if (this.pickedCards[0] === 0 && this.pickedCards[card] === 51) {
        if (previousCard+1 < this.pickedCards[card])
          consecutiveCards = 1;
        else
          consecutiveCards++;
        let i = 0;
        let tempPreviousCard = -1;
        while (this.pickedCards[i] === tempPreviousCard+1) {
          consecutiveCards++;
          tempPreviousCard = this.pickedCards[i];
          i++;
          if (consecutiveCards >= 6) {
            this.broadcast("circleBroken", `${playerName} has broke the circle!`);
            this.circleBroken = true;
            break;
          }
        }
      } else if (previousCard+1 === this.pickedCards[card]) {
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
