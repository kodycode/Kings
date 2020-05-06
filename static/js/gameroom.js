var roomInstance = undefined;
var host = window.document.location.host.replace(/:.*/, '');

var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : ''));

const resetChatGrowingWrapper = function (windowType) {
  let chatGrowDiv = document.getElementById('chat-growing-wrapper');
  let messageContainer = document.querySelector('#message-container');
  let chatInput = document.querySelector(".bx--text-input");
  chatGrowDiv.style.height = (messageContainer.clientHeight + chatInput.clientHeight) + "px";
}

const resetPlayerGrowingWrapper = function (windowType) {
  let playerGrowDiv = document.getElementById('player-growing-wrapper');
  let messageContainer = document.querySelector('#message-container');
  let chatInput = document.querySelector(".bx--text-input");
  playerGrowDiv.style.height = (messageContainer.clientHeight + chatInput.clientHeight) + "px";
}

const generateCards = function(pickedCards) {
  let circleContainer = document.querySelector("#circle-list");
  let cards = "";
  let degrees = 270;
  for (let i = 0; i < 52; i++) {
    if (pickedCards.indexOf(i) === -1)
      cards += `<li><div class="card" style="transform: rotate(${degrees}deg);" onclick="cardClicked(event)" index="${i}"></div></li>`;
    else
    cards += `<li><div class="card-null" style="transform: rotate(${degrees}deg);" onclick="cardClicked(event)" index="${i}"></div></li>`;
    degrees += 6.92;
  }
  circleContainer.innerHTML = cards;
}

function cardClicked(e) {
  document.querySelector("#card-description img").setAttribute("src", "");
  roomInstance.send("getCardResult", e.target.getAttribute("index"));
};

function hideWindow(windowType) {
  if (windowType === "chat") {
    let chatGrowWrapper = document.getElementById('chat-growing-wrapper');
    if (chatGrowWrapper.clientHeight) {
      chatGrowWrapper.style.height = 0;
    } else {
      resetChatGrowingWrapper();
    }
  } else {
    let playerGrowWrapper = document.getElementById('player-growing-wrapper');
    if (playerGrowWrapper.clientHeight) {
      playerGrowWrapper.style.height = 0;
    } else {
      resetPlayerGrowingWrapper();
    }
  }
}

function adjustWindowSizes() {
  resetChatGrowingWrapper();
  resetPlayerGrowingWrapper();
}

function resizeEvent() {
  adjustWindowSizes();
}

adjustWindowSizes();

outerHeight = window.outerHeight;
outerWidth = window.outerWidth;

var resizeTimer;
window.onresize = function(){
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    adjustWindowSizes()
  }, 250);
};

client.joinOrCreate("kings").then(room => {
  roomInstance = room;
  room.onStateChange.once(function(state) {
    console.log("initial room state:", state);
  });

  // new room state
  room.onStateChange(function(state) {
    // this signal is triggered on each patch
  });

  // listen to patches coming from the server
  room.onMessage("messages", function(message) {
    let p = document.createElement("p");
    p.innerText = message;
    p.style.wordWrap = "break-word";
    document.querySelector("#messages").appendChild(p);
    let msg_container = document.querySelector("#message-container");
    msg_container.scrollTop = msg_container.scrollHeight - msg_container.clientHeight;
  });

  room.onMessage("userJoined", function(message) {
    let p = document.createElement("p");
    p.innerText = message;
    p.setAttribute("class", "user-joined");
    document.querySelector("#messages").appendChild(p);
    var msg_container = document.querySelector("#message-container");
    msg_container.scrollTop = msg_container.scrollHeight - msg_container.clientHeight;
  });

  room.onMessage("userLeft", function(message) {
    let p = document.createElement("p");
    p.innerText = message;
    p.setAttribute("class", "user-left");
    document.querySelector("#messages").appendChild(p);
    let msg_container = document.querySelector("#message-container");
    msg_container.scrollTop = msg_container.scrollHeight - msg_container.clientHeight;
  });

  room.onMessage("circleBroken", function(message) {
    let p = document.createElement("p");
    p.innerText = message;
    p.setAttribute("class", "user-broke-circle");
    document.querySelector("#messages").appendChild(p);
    var msg_container = document.querySelector("#message-container");
    msg_container.scrollTop = msg_container.scrollHeight - msg_container.clientHeight;
  });

  room.onMessage("updatePlayerList", function(listOfPlayers) {
    let playerList = document.querySelector("#player-list");
    document.querySelector("#player-list").innerHTML = '';
    for (var i = 0; i < listOfPlayers.length; i++) {
      let li = document.createElement("li");
      li.className = "bx--list__item";
      li.innerHTML = `<p>${listOfPlayers[i]}</p>`;
      document.querySelector("#player-list").appendChild(li);
    }
  });

  room.onMessage("updateCardsLeft", function(undefinedCards) {
    let circleContainer = document.querySelector("#circle-list");
    if (undefinedCards.length) {
      let cardList = document.getElementsByClassName("card");
      for (let i = 0; i < cardList.length; i++) {
        let currentCard = cardList[i];
        for (let j = 0; j < undefinedCards.length; j++) {
          if (parseInt(currentCard.getAttribute("index")) === parseInt(undefinedCards[j])) {
            currentCard.setAttribute("class", "class-null");
          }
        }
      }
    }
  });

  room.onMessage("displayCardResult", function(cardDrawn) {
    let suit = cardDrawn.card.suit;
    let value = cardDrawn.card.value;
    if (!parseInt(value) && value != "Ace") {
      document.querySelector("#card-description img").setAttribute("src", `img/${value}_of_${suit}2.png`);
    } else {
      document.querySelector("#card-description img").setAttribute("src", `img/${value}_of_${suit}.png`);
    }
    document.querySelector("#card-description-text").innerHTML = `<span><p style="color: #A851A9">\
      ${cardDrawn.playerName}</p><p> pulled a ${value} of ${suit}!</p>\
    </span>`;
    document.querySelector("#card-modal-btn").click();
  });

  room.onMessage("drawMessage", function(message) {
    let p = document.createElement("p");
    p.innerText = message;
    p.setAttribute("class", "user-drew-card");
    document.querySelector("#messages").appendChild(p);
    let msg_container = document.querySelector("#message-container");
    msg_container.scrollTop = msg_container.scrollHeight - msg_container.clientHeight;
  });

  room.onMessage("getTurn", function(message) {
    let p = document.createElement("p");
    p.innerText = message;
    p.setAttribute("class", "user-turn");
    document.querySelector("#messages").appendChild(p);
    let msg_container = document.querySelector("#message-container");
    msg_container.scrollTop = msg_container.scrollHeight - msg_container.clientHeight;
  });

  room.onMessage("generateCards", function(pickedCards) {
    generateCards(pickedCards);
  });

  document.querySelector("#username-input-btn").onclick = function(e) {
    e.preventDefault();
    let input = document.querySelector("#username-input");
    if (input.value) {
      // send data to room
      room.send("name", input.value);

      document.querySelector("#username-form").remove();

      let usernameOverlay = document.getElementById("username-overlay");
      usernameOverlay.style.opacity = '0';
      setTimeout(function() {
        usernameOverlay.parentNode.removeChild(usernameOverlay);
      }, 1100);
    }
  }

  document.querySelector("#username-input-btn").ontouchstart = function(e) {
    e.preventDefault();
    let input = document.querySelector("#username-input");
    if (input.value) {
      // send data to room
      room.send("name", input.value);

      document.querySelector("#username-form").remove();

      let usernameOverlay = document.getElementById("username-overlay");
      usernameOverlay.style.opacity = '0';
      setTimeout(function() {
        usernameOverlay.parentNode.removeChild(usernameOverlay);
      }, 500);
    }
  }

  // send username to server on submit
  document.querySelector("#username-form").onkeyup = function(e) {
    let input = document.querySelector("#username-input");
    if (e.key === "Enter" && input.value) {
      // send data to room
      room.send("name", input.value);

      document.querySelector("#username-form").remove();

      let usernameOverlay = document.getElementById("username-overlay");
      usernameOverlay.style.opacity = '0';
      setTimeout(function() {
        usernameOverlay.parentNode.removeChild(usernameOverlay);
      }, 500);
    }
  }

  // send message to room on submit
  document.querySelector("#form").onkeyup = function(e) {
    e.preventDefault();
    let input = document.querySelector("#input");
    if (e.key === "Enter" && input.value) {

      // send data to room
      room.send("message", input.value);

      // clear input
      input.value = "";
    }
  }
});