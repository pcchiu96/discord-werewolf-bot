const Discord = require("discord.js");
const { performance } = require("perf_hooks");
const { prefix, token } = require("../config.json");
const client = new Discord.Client();

let emoteJoin = "🎮";
let emoteStart = "🟢";
let emoteCheckMark = "✅";
let emoteCrossMark = "❌";

let emoteRoles = {
    Werewolf: "🐺",
    Minion: "🧟",
    Villager: "👨",
    Seer: "🧙‍♂️",
    Robber: "🦹",
    Troublemaker: "🤷",
    Drunk: "🍺",
    Hunter: "🔫",
    Mason: "👷",
    Insomniac: "🦉",
    Doppelganger: "🤡",
};

let emotePlayerChoice = "🔮";
let emoteMiddleChoice = "🃏";
let emoteKeycaps = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

const keycapsFilter = (reaction, user) => emoteKeycaps.includes(reaction.emoji.name) && !user.bot && user.id;
const seerFilter = (reaction, user) => [emotePlayerChoice, emoteMiddleChoice].includes(reaction.emoji.name) && !user.bot && user.id;

client.once("ready", () => {
    console.log("Ready!");
});

client.once("reconnecting", () => {
    console.log("Reconnecting!");
});

client.once("disconnect", () => {
    console.log("Disconnect!");
});

let roles = {
    Werewolf: 1,
    Minion: 0,
    Mason: 0,
    Villager: 0,
    Seer: 0,
    Robber: 0,
    Troublemaker: 1,
    Drunk: 0,
    Insomniac: 1,
    Tanner: 0,
    Hunter: 0,
    Doppelganger: 0, //TODO: missing
};

let badGuys = ["Werewolf", "Minion"];

let description = {
    Werewolf: "Survive and don't get voted out!",
    Minion: "",
    Mason: "",
    Villager: "Find out who is Werewolf and vote him/her out!",
    Seer: "",
    Robber: "",
    Troublemaker: "",
    Drunk: "",
    Insomniac: "",
    Tanner: "You hate your job so much that you want to die. Get voted out to win!",
    Hunter: "When you get voted out, you can shoot a player and kill him/her.",
    Doppelganger: "",
};

let gameOn = false;
let voteOn = false;
let hostId = "";

let second = 1000;
let minute = 60 * second;
let joinWaitTime = 5 * minute;
//let playerTime = 30 * second; //time for each player's choice
let playerTime = 10 * second;
let roundTime = playerTime; //each role's round time, this increments based on which roles are the in game
//let discussionTime = 3 * minute;
let discussionTime = 10 * second;

let players = [];
let voted = {};
let deck = [];
let votes = [];
let gameLog = `Game Log:\n`;

let exist = {
    loneWolf: false,
    Werewolf: false,
    Minion: false,
    Mason: false,
    Seer: false,
    Robber: false,
    Troublemaker: false,
    Drunk: false,
    Insomniac: false,
    Tanner: false,
    Hunter: false,
    Doppelganger: false,
};

function resetExist() {
    exist = {
        loneWolf: false,
        Werewolf: false,
        Minion: false,
        Mason: false,
        Seer: false,
        Robber: false,
        Troublemaker: false,
        Drunk: false,
        Insomniac: false,
        Tanner: false,
        Hunter: false,
        Doppelganger: false,
    };
}

let werewolfRoundTimer,
    minionRoundTimer,
    masonsRoundTimer,
    seerRoundTimer,
    robberRoundTimer,
    troublemakerRoundTimer,
    drunkRoundTimer,
    insomniacRoundTimer,
    doppelgangerRoundTimer,
    voteTimer;

//turns the roles object into an array
function makeDeck(roles) {
    let rolesArray = [];
    let werewolves = Array(roles.Werewolf).fill("Werewolf");
    let villagers = Array(roles.Villager).fill("Villager");
    let minion = Array(roles.Minion).fill("Minion");
    let mason = Array(roles.Mason).fill("Mason");
    let seer = Array(roles.Seer).fill("Seer");
    let robber = Array(roles.Robber).fill("Robber");
    let troublemaker = Array(roles.Troublemaker).fill("Troublemaker");
    let drunk = Array(roles.Drunk).fill("Drunk");
    let insomniac = Array(roles.Insomniac).fill("Insomniac");
    let tanner = Array(roles.Tanner).fill("Tanner");
    let hunter = Array(roles.Hunter).fill("Hunter");
    //let doppelganger = Array(roles.Doppelganger).fill("Doppelganger");

    rolesArray = werewolves
        .concat(villagers)
        .concat(minion)
        .concat(mason)
        .concat(seer)
        .concat(robber)
        .concat(troublemaker)
        .concat(drunk)
        .concat(insomniac)
        .concat(tanner)
        .concat(hunter);

    return rolesArray;
}

//this shuffles the roles like a deck of cards for easier random distribution.
function shuffleDeck(rolesArray) {
    let pointer = 0;
    let temp = "";
    for (let i = 0; i < rolesArray.length; i++) {
        pointer = Math.floor(Math.random() * rolesArray.length);
        temp = rolesArray[i];
        rolesArray[i] = rolesArray[pointer];
        rolesArray[pointer] = temp;
    }
}

//assign roles to each player after shuffling the deck
//this also saves which role is handed to which player so the bot knows which player to dm
function assignRoles() {
    let wolfCount = 0;
    deck = makeDeck(roles);
    shuffleDeck(deck);

    for (let i = 0; i < players.length; i++) {
        players[i].role = deck[i];
        if (deck[i] === "Werewolf") {
            wolfCount += 1;
            exist.Werewolf = true;
        } else {
            exist[deck[i]] = true;
        }
        console.log(`${players[i].username} got ${players[i].role}`);
    }

    if (wolfCount == 1) {
        exist.loneWolf = true;
    }
}

//reassign the roles after all swaps have been made
function reassignRoles() {
    let wolfCount = 0;

    for (let i = 0; i < players.length; i++) {
        players[i].role = deck[i];
        if (deck[i] === "Werewolf") {
            wolfCount += 1;
            exist.Werewolf = true;
        } else {
            exist[deck[i]] = true;
        }
        console.log(`${players[i].username} final ${players[i].role}`);
    }

    if (wolfCount == 1) {
        exist.loneWolf = true;
    }
}

//resets the exist roles in each players hand
function refreshExist() {
    resetExist();
    let wolfCount = 0;

    for (let i = 0; i < players.length; i++) {
        if (deck[i] === "Werewolf") {
            wolfCount += 1;
            exist.Werewolf = true;
        } else {
            exist[deck[i]] = true;
        }
    }

    if (wolfCount == 1) {
        exist.loneWolf = true;
    }
}

//gets the player's teammate with the same role
function getTeammate(player) {
    let teammateNames = "";
    let teammateCount = 0;
    players.forEach((teammate) => {
        if (teammate.username !== player.username && teammate.role === player.role) {
            teammateNames += `(${teammate.username})`;
            teammateCount += 1;
        }
    });

    if (teammateCount === 1) {
        teammateNames += " is your teammate";
    } else if (teammateCount > 1) {
        teammateNames += " are your teammates";
    }
    return teammateNames;
}

function getWerewolves() {
    let werewolves = "";
    let count = 0;
    players.forEach((player) => {
        if (player.role === "Werewolf") {
            werewolves += `(${player.username})`;
            count += 1;
        }
    });

    if (count === 1) {
        werewolves += " is the Werewolf";
    } else {
        werewolves += " are the Werewolves";
    }
    return werewolves;
}

//get all the players in the game with their joined number and username
function getEveryone() {
    let everyone = "\n";
    let count = 0;
    players.forEach((player) => {
        everyone += `${emoteKeycaps[count]} ${player.username}\n`;
        count += 1;
    });

    return everyone;
}

function getRoleDescription(role) {
    return description[role];
}

function getGoodGuys() {
    let result = "\nTowns People:\n";
    players.forEach((player) => {
        if (!badGuys.includes(player.role)) {
            result += `${player.username} (${player.role})\n`;
        }
    });
    return result;
}

function getBadGuys() {
    let result = "\nEvil:\n";
    players.forEach((player) => {
        if (badGuys.includes(player.role)) {
            result += `${player.username} (${player.role})\n`;
        }
    });
    return result;
}

function switchCards(index1, index2) {
    let temp = deck[index1];
    deck[index1] = deck[index2];
    deck[index2] = temp;
}

function halfTimeReminder(player, time) {
    player.send(`>>> (${millisecondsToSeconds(time)}s remaining).`);
}

function millisecondsToSeconds(milliseconds) {
    return (milliseconds / 1000).toFixed(0);
}

//TODO: replace halfTimerReminder with this count down
//it edits the message on an interval
async function countDown(message) {
    let counter = 4;
    const m = await message.channel.send(`Count down: ${counter}`);
    let inter = setInterval(() => {
        counter -= 2;
        if (counter === 0) {
            clearTimeout(inter);
            m.delete({ timeout: 1000 });
            console.log(`clear`);
        }
        m.edit(`Count down: ${counter}`);
    }, 2 * 1000);
}

async function werewolfTurn(message) {
    message.channel.send(`>>> Night falls. Werewolves! Please wake up.`);
    if (!exist.Werewolf) return;

    //if there's a lone wolf in the players, ask the lone wolf to pick a card from the middle
    if (exist.loneWolf) {
        let player = players.find((player) => player.role === "Werewolf");
        let timeReminder = setTimeout(() => {
            halfTimeReminder(player, playerTime / 2);
        }, playerTime / 2);

        const dm = await player.send(`>>> You are a Lone Wolf! Which of the 3 cards in the middle would you like to take a peek? (Timer: ${millisecondsToSeconds(playerTime)}s)`);
        //show emotes in 1️⃣, 2️⃣, 3️⃣ for the lone wolf to pick
        for (let i = 0; i < 3; i++) {
            dm.react(emoteKeycaps[i]);
        }

        try {
            //only listen for keycap emojis
            const collected = await dm.awaitReactions(keycapsFilter, {
                max: 1,
                time: playerTime,
                errors: ["time"],
            });

            clearTimeout(timeReminder);
            const loneWolfReaction = collected.first().emoji.name;
            let index;
            let number;

            switch (loneWolfReaction) {
                case emoteKeycaps[0]: //1️⃣
                    index = deck.length - 3;
                    number = 1;
                    break;
                case emoteKeycaps[1]: //2️⃣
                    index = deck.length - 2;
                    number = 2;
                    break;
                case emoteKeycaps[2]: //3️⃣
                    index = deck.length - 1;
                    number = 3;
                    break;
            }
            player.send(`>>> Card ${number} is (${deck[index]})`);
            console.log(`${player.username} (Lone Wolf) picked card ${number} (${deck[index]}) from the middle`);
            gameLog += `${player.username} (Lone Wolf) picked card ${number} (${deck[index]}) from the middle\n`;
        } catch (error) {
            player.send(`>>> Time out. You decided not to pick a card from the middle.`);
            console.log(`Time out. ${player.username} (Lone Wolf) did not pick a card from the middle`);
            gameLog += `Time out. ${player.username} (Lone Wolf) did not pick a card from the middle\n`;
        }
    } else {
        players.forEach((player) => {
            if (player.role === "Werewolf") player.send(`>>> ${getTeammate(player)}`);
        });
    }
}

function minionTurn(message) {
    message.channel.send(`>>> Minion! Please wake up`);
    if (!exist.Minion) return;

    let player = players.find((player) => player.role === "Minion");
    if (exist.loneWolf) return player.send(`>>> ${getWerewolves()}. Assist this player to win the game.`);
    if (exist.Werewolf) return player.send(`>>> ${getWerewolves()}. Assist them to win the game.`);
    return player.send(`>>> There are no Werewolves! Survive to win!`);
}

function masonTurn(message) {
    message.channel.send(`>>> Masons! Please wake up`);
    if (!exist.Mason) return;

    players.forEach((player) => {
        if (player.role === "Mason") player.send(`>>> ${getTeammate(player) ? getTeammate(player) : `You're by yourself!`}`);
    });
}

async function seerTurn(message) {
    message.channel.send(`>>> Seer! Please wake up.`);
    if (!exist.Seer) return;

    let timeReminder = setTimeout(() => {
        halfTimeReminder(player, playerTime / 2);
    }, playerTime / 2);

    let t0 = performance.now(); //start time to keep tract of player's choice time
    let player = players.find((player) => player.role === "Seer");
    const dm = await player.send(
        `>>> You may look at another player's card (${emotePlayerChoice}) or 2 cards from the middle (${emoteMiddleChoice}). (Timer: ${millisecondsToSeconds(playerTime)}s)`
    );
    //show emotes in 🔮, 🃏 for the Seer to pick
    await dm.react(emotePlayerChoice);
    await dm.react(emoteMiddleChoice);

    try {
        //only listen for 🔮, 🃏 emojis
        const collected = await dm.awaitReactions(seerFilter, {
            max: 1,
            time: playerTime,
            errors: ["time"],
        });

        const seerReaction = collected.first();

        if (seerReaction.emoji.name === emotePlayerChoice) {
            let t1 = performance.now();
            let timeUsed = t1 - t0;
            let leftOverTime = playerTime - timeUsed;

            const selectCardMessage = await player.send(`>>> Select a player to see their card.${getEveryone()}(Timer: ${millisecondsToSeconds(leftOverTime)}s)`);
            for (let i = 0; i < players.length; i++) {
                selectCardMessage.react(emoteKeycaps[i]);
            }

            try {
                const collectedPlayerCard = await selectCardMessage.awaitReactions(keycapsFilter, {
                    max: 1,
                    time: leftOverTime,
                    errors: ["time"],
                });

                clearTimeout(timeReminder);
                const seerPlayerChoice = collectedPlayerCard.first();
                let index = emoteKeycaps.indexOf(seerPlayerChoice.emoji.name) + 1;
                let card = deck[index];

                player.send(`>>> ${players[index].username} is (${card})`);
                console.log(`${player.username} (Seer) checked player ${players[index].username} ${card}`);
                gameLog += `${player.username} (Seer) checked player ${players[index].username} ${card}\n`;
            } catch (collected) {
                player.send(`>>> Time out. You decided to not select a player.`);
                console.log(`Time out. ${player.username} (Seer) did not select a player`);
                gameLog += `Time out. ${player.username} (Seer) did not select a player\n`;
            }
        } else if (seerReaction.emoji.name === emoteMiddleChoice) {
            let t1 = performance.now();
            let timeUsed = t1 - t0;
            let leftOverTime = playerTime - timeUsed;

            const twoCardsMessage = await player.send(`>>> Select two cards from the middle. (Timer: ${millisecondsToSeconds(leftOverTime)}s)`);
            for (let i = 0; i < 3; i++) {
                twoCardsMessage.react(emoteKeycaps[i]);
            }

            try {
                const firstCard = await twoCardsMessage.awaitReactions(keycapsFilter, {
                    max: 1,
                    time: leftOverTime,
                    errors: ["time"],
                });

                const seerMiddleChoice1 = firstCard.first().emoji.name;
                let index;
                let number;

                let t2 = performance.now();
                let timeUsed = t2 - t1;
                let finalTime = leftOverTime - timeUsed;

                switch (seerMiddleChoice1) {
                    case emoteKeycaps[0]:
                        index = deck.length - 3;
                        number = 1;
                        break;
                    case emoteKeycaps[1]:
                        index = deck.length - 2;
                        number = 2;
                        break;
                    case emoteKeycaps[2]:
                        index = deck.length - 1;
                        number = 3;
                        break;
                }
                player.send(`>>> Card ${number} is (${deck[index]}). (Timer: ${millisecondsToSeconds(finalTime)}s)`);
                console.log(`${player.username} (Seer) checked card ${number} ${deck[index]} from the middle`);
                gameLog += `${player.username} (Seer) checked card ${number} ${deck[index]} from the middle\n`;

                try {
                    const secondCard = await twoCardsMessage.awaitReactions(keycapsFilter, {
                        max: 1,
                        time: finalTime,
                        errors: ["time"],
                    });

                    clearTimeout(timeReminder);
                    const seerMiddleChoice2 = secondCard.first().emoji.name;
                    let index2;
                    let number2;

                    switch (seerMiddleChoice2) {
                        case emoteKeycaps[0]:
                            index2 = deck.length - 3;
                            number2 = 1;
                            break;
                        case emoteKeycaps[1]:
                            index2 = deck.length - 2;
                            number2 = 2;
                            break;
                        case emoteKeycaps[2]:
                            index2 = deck.length - 1;
                            number2 = 3;
                            break;
                    }
                    player.send(`>>> Card ${number2} is (${deck[index2]}).`);
                    console.log(`${player.username} (Seer) checked card ${number2} ${deck[index2]} from the middle`);
                    gameLog += `${player.username} (Seer) checked card ${number2} ${deck[index2]} from the middle\n`;
                } catch (error) {
                    player.send(`>>> Time out. You decided to not pick a second card from the middle.`);
                    console.log(`Time out. ${player.username} (Seer) didn't pick a second card from the middle.`);
                    gameLog += `Time out. ${player.username} (Seer) didn't pick a second card from the middle\n`;
                }
            } catch (error) {
                player.send(`>>> Time out. You decided not to pick any cards from the middle.`);
                console.log(`Time out. ${player.username} (Seer) didn't pick any cards from the middle`);
                gameLog += `Time out.(${player.username} (Seer) didn't pick any cards from the middle\n`;
            }
        }
    } catch (error) {
        player.send(`>>> Time out. You decided to take no action.`);
        console.log(`Time out. ${player.username} (Seer) did nothing.`);
        gameLog += `Time out. ${player.username} (Seer) did nothing\n`;
    }
}

async function robberTurn(message) {
    message.channel.send(`>>> Robber! Please wake up`);
    if (!exist.Robber) return;

    let timeReminder = setTimeout(() => {
        halfTimeReminder(player, playerTime / 2);
    }, playerTime / 2);

    let indexSelf = players.findIndex((player) => player.role === "Robber");
    let player = players[indexSelf];
    const dm = await player.send(`>>> You may exchange your card another player's card${getEveryone()}and then view that card. (Timer: ${millisecondsToSeconds(playerTime)}s)`);
    for (let i = 0; i < players.length; i++) {
        dm.react(emoteKeycaps[i]);
    }

    try {
        const collected = await dm.awaitReactions(keycapsFilter, {
            max: 1,
            time: playerTime,
            errors: ["time"],
        });

        clearTimeout(timeReminder);
        const robberPlayerChoice = collected.first().emoji.name;
        let indexChoice = emoteKeycaps.indexOf(robberPlayerChoice);
        let cardChoice = deck[indexChoice];
        let cardSelf = deck[indexSelf];

        //Only exchange the cards in the deck
        switchCards(indexChoice, indexSelf);

        player.send(`>>> You have exchanged your card with this player. You are now the (${cardChoice}) and ${players[indexChoice].username} is now the (${cardSelf})`);
        console.log(`${player.username} (Robber) robbed ${players[indexChoice].username} (${cardChoice})`);
        gameLog += `${player.username} (Robber) robbed ${players[indexChoice].username} (${cardChoice})\n`;
    } catch (error) {
        player.send(`>>> Time out. You decided to not rob anyone. No exchange.`);
        console.log(`Time out. ${player.username} (Robber) did nothing.`);
        gameLog += `Time out. ${player.username} (Robber) did nothing.\n`;
    }
}

async function troublemakerTurn(message) {
    message.channel.send(`>>> Troublemaker! Please wake up`);
    if (!exist.Troublemaker) return;

    let timeReminder = setTimeout(() => {
        halfTimeReminder(player, playerTime / 2);
    }, playerTime / 2);

    let t0 = performance.now();
    let player = players.find((player) => player.role === "Troublemaker");
    const dm = await player.send(`>>> You may swap cards between two players${getEveryone()}(Timer: ${millisecondsToSeconds(playerTime)}s)`);
    for (let i = 0; i < players.length; i++) {
        dm.react(emoteKeycaps[i]);
    }

    try {
        const playerOne = await dm.awaitReactions(keycapsFilter, {
            max: 1,
            time: playerTime,
            errors: ["time"],
        });

        const troublemakerChoiceOne = playerOne.first().emoji.name;
        console.log(`${player.username} (Troublemaker) selected ${troublemakerChoiceOne}`);

        let t1 = performance.now();
        let timeUsed = t1 - t0;
        let leftOverTime = playerTime - timeUsed;

        player.send(`>>> Select another card. (Timer: ${millisecondsToSeconds(leftOverTime)}s)`);

        try {
            const playerTwo = await dm.awaitReactions(keycapsFilter, {
                max: 1,
                time: leftOverTime,
                errors: ["time"],
            });

            clearTimeout(timeReminder);
            const troublemakerChoiceTwo = playerTwo.first().emoji.name;
            console.log(`${player.username} (Troublemaker) selected ${troublemakerChoiceTwo}`);

            let index1 = emoteKeycaps.indexOf(troublemakerChoiceOne);
            let index2 = emoteKeycaps.indexOf(troublemakerChoiceTwo);
            let card1 = deck[index1];
            let card2 = deck[index2];

            //Exchange the cards in the deck
            switchCards(index1, index2);

            player.send(`>>> Player ${players[index1].username} and ${players[index2].username} have been swapped`);
            console.log(`${player.username} (Troublemaker) swapped ${players[index1].username} (${card1}) and ${players[index2].username} (${card2})`);
            gameLog += `${player.username} (Troublemaker) swapped ${players[index1].username} (${card1}) and ${players[index2].username} (${card2})\n`;
        } catch (error) {
            player.send(`>>> Time out. No swap.`);
            console.log(`Time out. ${player.username} (Troublemaker) did not select a second player.`);
            gameLog += `Time out. ${player.username} (Troublemaker) did not select a second player\n`;
        }
    } catch (error) {
        player.send(`>>> Time out. No swap.`);
        console.log(`Time out. ${player.username} (Troublemaker) did nothing.`);
        gameLog += `Time out. ${player.username} (Troublemaker) did nothing\n`;
    }
}

async function drunkTurn(message) {
    message.channel.send(`>>> Drunk! Please wake up`);
    if (!exist.Drunk) return;

    let timeReminder = setTimeout(() => {
        halfTimeReminder(player, playerTime / 2);
    }, playerTime / 2);

    let indexSelf = players.findIndex((player) => player.role === "Drunk");
    let player = players[indexSelf];
    const dm = await player.send(
        `>>> You must exchange your card with a card in the middle without knowing the role. If non-selected, a random card will be exchanged. (Timer: ${millisecondsToSeconds(
            playerTime
        )}s)`
    );
    for (let i = 0; i < 3; i++) {
        await dm.react(emoteKeycaps[i]);
    }

    try {
        const collected = await dm.awaitReactions(keycapsFilter, {
            max: 1,
            time: playerTime,
            errors: ["time"],
        });

        clearTimeout(timeReminder);
        const drunkPlayerChoice = collected.first().emoji.name;

        let indexChoice, number, cardChoice;

        switch (drunkPlayerChoice) {
            case emoteKeycaps[0]:
                indexChoice = deck.length - 3;
                number = 1;
                break;
            case emoteKeycaps[1]:
                indexChoice = deck.length - 2;
                number = 2;
                break;
            case emoteKeycaps[2]:
                indexChoice = deck.length - 1;
                number = 3;
                break;
        }

        cardChoice = deck[indexChoice];
        //exchange the cards in the deck
        switchCards(indexChoice, indexSelf);

        player.send(`>>> You have exchanged your card with the card ${drunkPlayerChoice} from the middle.`);
        console.log(`${player.username} (Drunk) exchanged card ${number} (${cardChoice}) from the middle.`);
        gameLog += `${player.username} (Drunk) exchanged card ${number} (${cardChoice}) from the middle\n`;
    } catch {
        let randomPick = Math.floor(Math.random() * 3) + 1;
        let indexRandom = deck.length - randomPick;
        let number = indexRandom + 1;
        let cardRandom = deck[indexRandom];

        //exchange the cards in the deck
        switchCards(indexRandom, indexSelf);

        player.send(`>>> Time out. Card ${number} in the middle has been switched with you.`);
        console.log(`Time out. ${player.username} (Drunk) did nothing. Exchanged card ${number} (${cardRandom}) from the middle.`);
        gameLog += `Time out. ${player.username} (Drunk) did nothing. Exchanged card ${number} (${cardRandom}) from the middle\n`;
    }
}

function insomniacTurn(message) {
    message.channel.send(`>>> Insomniac! Please wake up`);
    if (!exist.Insomniac) return;

    let player = players.find((player) => player.role === "Insomniac");
    let playerIndex = players.indexOf(player);
    let newRole = deck[playerIndex];

    player.send(`>>> You stayed up the entire night. ${player.role !== newRole ? `You have been swapped! Your role is now ${newRole}` : `You are still ${player.role}`}`);
}

async function hunterTurn(message, player) {
    const hunter = await player.send(`>>> Pick a player you would like to shoot.`);
    for (let i = 0; i < players.length; i++) {
        hunter.react(emoteKeycaps[i]);
    }

    try {
        const collected = await hunter.awaitReactions(keycapsFilter, {
            max: 1,
            time: playerTime,
            errors: ["time"],
        });

        let choice = collected.first().emoji.name;

        let index = emoteKeycaps.indexOf(choice);
        let shot = players[index];

        oneHighestVote(message, shot);
    } catch (error) {
        console.log(`Time out. Hunter (${player.username}) did nothing.`);
        player.send(`>>> Time out. You decided to not shoot anyone.`);

        let highestVote = Math.max(...votes);
        let occurrence = getOccurrence(highestVote, votes);
        let highestIndex = votes.indexOf(highestVote);
        let votedOut = players[highestIndex];

        //double highest votes
        if (occurrence === 1) {
            if (votedOut.username === player.username) {
                //find second highest vote player
                let secondHighestIndex = votes.indexOf(highestVote, highestIndex + 1);
                let secondVotedOut = players[secondHighestIndex];
                message.channel.send(`>>> ${player.username} did not shoot anyone!`);
                oneHighestVote(message, secondVotedOut);
            } else {
                //if already the second highest vote player
                message.channel.send(`>>> ${player.username} did not shoot anyone!`);
                oneHighestVote(message, votedOut);
            }
            //otherwise one highest vote
        } else {
            if (!exist.Werewolf) {
                message.channel.send(`>>> ${player.username} did not shoot anyone! Smart! Because there are no werewolves!${getGoodGuys()}win!`);
            } else {
                message.channel.send(`>>> ${player.username} did not shoot anyone!${getBadGuys()}win!`);
            }
        }
    }
}

//gets the highest occurence of the number in array
//if no occurrence, return 0
//if 2 occurrence, return 1
//otherwise return -1
function getOccurrence(number, array) {
    if (number === 0) return -1;
    let occurrence = 0;
    for (let i = 0; i < array.length; i++) {
        if (number === array[i]) {
            occurrence += 1;
        }
    }

    if (occurrence === 1) return 0;
    if (occurrence === 2) return 1;
    return -1;
}

async function voteTurn(message) {
    //refresh which roles exist in each player's hand
    refreshExist();
    //reassign all roles based on the deck
    reassignRoles();

    setTimeout(() => {
        message.channel.send(`>>> (${millisecondsToSeconds(discussionTime / 2)}s remaining).`);
    }, discussionTime / 2);

    message.channel.send(`>>> Check your dm and vote who you think is the werewolf! (Discusstion time:  ${millisecondsToSeconds(discussionTime)}s)`);
    voteOn = true;

    players.forEach(async (player) => {
        let dm = await player.send(`>>> Vote who you think is the werewolf! ${getEveryone()}\nCareful! You can only vote once and there's no turning back.`);
        for (let i = 0; i < players.length; i++) {
            dm.react(emoteKeycaps[i]);
        }
    });

    votes = Array(players.length).fill(0);

    setTimeout(function () {
        message.channel.send(`>>> Discussion time is up! The results are...`);
        let highestVote = Math.max(...votes);
        let occurrence = getOccurrence(highestVote, votes);
        let highestIndex = votes.indexOf(highestVote);
        let votedOut = players[highestIndex];
        console.log(`${votedOut.username} got the highest ${highestVote} vote(s)`);

        //double highest votes
        if (occurrence === 1) {
            let secondHighestIndex = votes.indexOf(highestVote, highestIndex + 1);
            let secondVotedOut = players[secondHighestIndex];
            twoHighestVote(message, votedOut, secondVotedOut);
        } else if (occurrence === 0) {
            //single highest vote
            oneHighestVote(message, votedOut);
            //multiple highest same votes
        } else if (occurrence === -1) {
            if (exist.Werewolf || exist.Minion) {
                message.channel.send(`>>> Not enough votes! ${getBadGuys()}win!.`);
            } else {
                message.channel.send(`>>> Not enough votes! Good thing there are no bad guys!${getGoodGuys()}win!`);
            }
        }

        //TODO: attach vote log
        message.channel.send(`>>> ${gameLog}`);
    }, discussionTime);
}

function twoHighestVote(message, votedOut, secondVotedOut) {
    //tanner overrides all other roles
    if (votedOut.role === "Tanner" || secondVotedOut.role === "Tanner") {
        message.channel.send(`>>> ${votedOut.username} is ${votedOut.role} and ${secondVotedOut.username} is ${secondVotedOut.role}. Only Tanner win!`);
    } else if (votedOut.role === "Werewolf" || secondVotedOut.role === "Werewolf") {
        message.channel.send(`>>> ${votedOut.username} is ${votedOut.role} and ${secondVotedOut.username} is ${secondVotedOut.role}${getGoodGuys()}win!`);
    } else if (!exist.Werewolf && (votedOut.role === "Minion" || secondVotedOut.role === "Minion")) {
        //checks only minion before hunter
        //minion becomes werewolf if there are no werewolves in play
        message.channel.send(
            `>>> ${votedOut.username} is ${votedOut.role} and ${secondVotedOut.username} is ${secondVotedOut.role}. And there are no Werewolves!${getGoodGuys()}win!`
        );
    } else if (votedOut.role === "Hunter" || secondVotedOut.role === "Hunter") {
        let player = players.find((player) => player.role === "Hunter");
        message.channel.send(
            `>>> ${votedOut.username} and ${secondVotedOut.username} got the highest votes. But ${player.username} is Hunter, pick a player that you would like to shoot.`
        );
        hunterTurn(message, votedOut);
    } else if (votedOut.role === "Minion" || secondVotedOut.role === "Minion") {
        message.channel.send(`>>> ${votedOut.username} is ${votedOut.role} and ${secondVotedOut.username} is ${secondVotedOut.role}${getBadGuys()}win!`);
    } else {
        if (!exist.Werewolf) {
            message.channel.send(
                `>>> ${votedOut.username} is ${votedOut.role} and ${secondVotedOut.username} is ${secondVotedOut.role}. There are no werewolves!${getGoodGuys()}lose!`
            );
        } else {
            message.channel.send(`>>> ${votedOut.username} is ${votedOut.role} and ${secondVotedOut.username} is ${secondVotedOut.role}.${getBadGuys()}win!`);
        }
    }
}

function oneHighestVote(message, votedOut) {
    //single highest vote
    if (votedOut.role === "Tanner") {
        //tanner only wins if he's voted out
        message.channel.send(`>>> ${votedOut.username} is a Tanner! Only ${votedOut.username} wins!`);
    } else if (votedOut.role === "Werewolf") {
        message.channel.send(`>>> ${votedOut.username} is a Werewolf!${getGoodGuys()}win!`);
    } else if (votedOut.role === "Hunter") {
        message.channel.send(`>>> ${votedOut.username} is a Hunter! Pick a player you would like to shoot.`);
        hunterTurn(message, votedOut);
    } else if (votedOut.role === "Minion") {
        //minion becomes werewolf if there are no werewolves in play
        if (!exist.Werewolf) {
            message.channel.send(`>>> ${votedOut.username} is the only Minion! And there are no Werewolves!${getGoodGuys()}win!`);
        } else {
            message.channel.send(`>>> ${votedOut.username} is not a Werewolf!${getBadGuys()}win!`);
        }
    } else {
        //any other roles
        if (!exist.Werewolf) {
            message.channel.send(`>>> ${votedOut.username} is not a Werewolf. There are no werewolves!${getGoodGuys()}lose!`);
        } else {
            message.channel.send(`>>> ${votedOut.username} is not a Werewolf.${getBadGuys()}win!`);
        }
    }
}

async function oneNightUltimateWerewolf(message) {
    const welcomeMessage = await message.channel.send(`>>> Welcome to the Werewolf Game!\nPress the controller to join. Then the host can press the green circle to start.`);
    welcomeMessage.react(emoteJoin);
    welcomeMessage.react(emoteStart);

    try {
        //filter only the host can start the game
        const startGameFilter = (reaction, user) => reaction.emoji.name === emoteStart && !user.bot && user.id === hostId;
        await welcomeMessage.awaitReactions(startGameFilter, {
            max: 1,
            time: joinWaitTime, //5 mins of wait time
            errors: ["time"],
        });

        welcomeMessage.delete();

        const roleSelection = await message.channel.send(
            `>>> Please select ${
                players.length + 3
            } roles.\nUse '${prefix} roles' to see all the toggled roles.\nEach roles can also be toggled using '${prefix} add/remove role name'.\nThen the host can press the green circle to start the game.`
        );

        roleSelection.react(emoteStart);
        // roleSelection.react(emoteRoles.Werewolf);
        // roleSelection.react(emoteRoles.Villager);
        // roleSelection.react(emoteRoles.Minion);
        // roleSelection.react(emoteRoles.Seer);
        // roleSelection.react(emoteRoles.Robber);
        // roleSelection.react(emoteRoles.Troublemaker);
        // roleSelection.react(emoteRoles.Drunk);
        // roleSelection.react(emoteRoles.Hunter);
        // roleSelection.react(emoteRoles.Mason);
        // roleSelection.react(emoteRoles.Insomniac);
        // roleSelection.react(emoteRoles.Doppelganger);

        const rolesFilter = (reaction, user) => reaction.emoji.name === emoteStart && !user.bot && user.id === hostId;
        await roleSelection.awaitReactions(rolesFilter, {
            max: 1,
            time: joinWaitTime, //5 mins of wait time
            errors: ["time"],
        });
        roleSelection.delete();

        message.channel.send(`>>> Game started! Players: ${players}`); //ping all players the game has started

        //assigning roles
        assignRoles();

        //send roles to each player
        message.channel.send(`>>> Please check your pm for your role. Game starting in ${millisecondsToSeconds(playerTime)}s`);
        players.forEach((player) => {
            player.send(`>>> Your role is...${player.role}! ${getRoleDescription(player.role)}`);
        });

        //night falls
        if (roles.Werewolf) {
            werewolfRoundTimer = setTimeout(function () {
                werewolfTurn(message);
            }, roundTime);
            console.log(`Werewolf time: ${millisecondsToSeconds(roundTime)}s`);
        }

        //minion wakes up to see who the werewolves are
        if (roles.Minion) {
            minionRoundTimer = setTimeout(function () {
                minionTurn(message);
            }, roundTime);
            console.log(`Minion time: ${millisecondsToSeconds(roundTime)}s`);
        }

        //mason see each other
        if (roles.Mason) {
            masonRoundTimer = setTimeout(function () {
                masonTurn(message);
            }, roundTime);
            console.log(`Mason time: ${millisecondsToSeconds(roundTime)}s`);
        }

        //Werewolf, Minion and Mason can all go at once
        if (roles.Werewolf || roles.Minion || roles.Mason) {
            roundTime += playerTime;
        }

        //ask Seer for 2 cards in the middle or a player
        if (roles.Seer) {
            seerRoundTimer = setTimeout(function () {
                seerTurn(message);
            }, roundTime);
            roundTime += playerTime;
            console.log(`Seer time: ${millisecondsToSeconds(roundTime)}s`);
        }

        //robber switch one card with a player and see the role
        if (roles.Robber) {
            robberRoundTimer = setTimeout(function () {
                robberTurn(message);
            }, roundTime);
            roundTime += playerTime;
            console.log(`Robber time: ${millisecondsToSeconds(roundTime)}s`);
        }

        if (roles.Troublemaker) {
            //troublemaker switches two cards without looking at them
            troublemakerRoundTimer = setTimeout(function () {
                troublemakerTurn(message);
            }, roundTime);
            roundTime += playerTime;
            console.log(`Troublemaker time: ${millisecondsToSeconds(roundTime)}s`);
        }

        //drunk switch one card in the middle without looking at them
        if (roles.Drunk) {
            drunkRoundTimer = setTimeout(function () {
                drunkTurn(message);
            }, roundTime);
            roundTime += playerTime;
            console.log(`Drunk time: ${millisecondsToSeconds(roundTime)}s`);
        }

        //insomniac stays awake and knows if he/she got swapped
        if (roles.Insomniac) {
            insomniacRoundTimer = setTimeout(function () {
                insomniacTurn(message);
            }, roundTime);
            roundTime += playerTime;
            console.log(`Insomniac time: ${millisecondsToSeconds(roundTime)}s`);
        }

        //lastly ask everyone to vote
        voteTimer = setTimeout(function () {
            voteTurn(message);
        }, roundTime + 5000); //extra 5s to let the vote run);
    } catch (error) {
        console.log("Time out. No action after 5mins. Game terminated");
        gameOn = false;
        players = [];
    }
}

client.on("message", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot || message.channel.type == "dm") return;

    const args = message.content.slice(prefix.length + 1).split(/ +/); //including space
    const command = args.shift().toLowerCase();

    if (command === `play`) {
        //only one game at a time
        if (!gameOn) {
            //pass host id so only the host can start the game
            oneNightUltimateWerewolf(message);
            gameOn = true;
            hostId = message.author.id;
        } else {
            message.channel.send(`>>> A game already exists. Type '${prefix} stop' to terminate current session.`);
        }
    } else if (command === `players`) {
        if (players.length) {
            let names = "";
            players.forEach((player) => (names += `${player.username} `));
            message.channel.send(names);
            console.log(names);
        } else {
            message.channel.send("No players.");
        }
    } else if (command === `stop`) {
        //TODO: add a confirm reaction check
        message.channel.send("Game terminated.");
        console.log("game terminated");
        gameOn = false;
        voteOn = false;
        hostId = "";
        players = [];
        gameLog = "";
        roundTime = playerTime;
        votes = [];
        voted = {};
        resetExist();
        clearTimeout(werewolfRoundTimer);
        clearTimeout(seerRoundTimer);
        clearTimeout(minionRoundTimer);
        clearTimeout(masonsRoundTimer);
        clearTimeout(seerRoundTimer);
        clearTimeout(robberRoundTimer);
        clearTimeout(troublemakerRoundTimer);
        clearTimeout(drunkRoundTimer);
        clearTimeout(insomniacRoundTimer);
        clearTimeout(voteTimer);
    } else if (command === `playerroles`) {
        let names = "";
        players.forEach((player) => (names += `${player.username} (${player.role})\n`));
        console.log(names);
    } else if (command === `deck`) {
        console.log(deck);
    } else if (command === `roles`) {
        let rolesString = "";
        let keys = Object.keys(roles);

        keys.forEach((key) => {
            if (roles[key]) {
                rolesString += `${emoteRoles[key]} ${emoteCheckMark.repeat(roles[key])} (${key})\n`;
            } else {
                rolesString += `${emoteRoles[key]} ${emoteCrossMark} (${key})\n`;
            }
        });

        let counter = 5;
        const selfDestruct = await message.channel.send(`>>> ${rolesString}Self Destruct in: ${counter}s`);
        selfDestruct.delete({ timeout: counter * second });
    } else if (command === `add`) {
        if (!args.length) return message.channel.send(`>>> Missing role(s).`);

        let addedRoles = "";
        let roleKeys = Object.keys(roles);

        if (args[0].toLowerCase() === "all") {
            roleKeys.forEach((key) => {
                if (key === "Mason") {
                    roles[key] = 2;
                } else {
                    roles[key] = 1;
                }
            });

            addedRoles += `all roles have been added`;
        } else {
            args.forEach((arg) => {
                let role = arg[0].toUpperCase() + arg.slice(1).toLowerCase(); //converting to proper name
                if (!roleKeys.includes(role)) return (addedRoles += `'${role}' unrecognized\n`);
                if (role === "Werewolf" || role === "Villager") {
                    roles[role] += 1;
                } else if (role === "Mason") {
                    roles[role] = 2;
                } else {
                    roles[role] = 1;
                }
                addedRoles += `'${role}' has been added\n`;
            });
        }
        message.channel.send(`>>> ${addedRoles}`);
    } else if (command === `remove`) {
        if (!args.length) return message.channel.send(`>>> Missing role(s).`);

        let removedRoles = "";
        let roleKeys = Object.keys(roles);

        if (args[0].toLowerCase() === "all") {
            roleKeys.forEach((key) => {
                roles[key] = 0;
            });
            removedRoles += `all roles have been removed`;
        } else {
            args.forEach((arg) => {
                let role = arg[0].toUpperCase() + arg.slice(1).toLowerCase(); //converting to proper name
                if (!roleKeys.includes(role)) return (removedRoles += `'${role}' unrecognized\n`);
                if (role === "Werewolf" || role === "Villager") {
                    if (roles[role] > 0) roles[role] -= 1; //roles limit can't be negative
                } else {
                    roles[role] = 0;
                }
                removedRoles += `'${role}' has been removed\n`;
            });
        }
        message.channel.send(`>>> ${removedRoles}`);
    }
});

client.on("messageReactionAdd", (reaction, user) => {
    let userEmojiReaction = reaction.emoji.name;
    if (userEmojiReaction === emoteJoin && !user.bot) {
        console.log(`${user.username} was added. id: ${user.id}`);
        players.push(user);

        console.log(players[0]);
    } else if (emoteKeycaps.includes(userEmojiReaction) && !user.bot && voteOn) {
        //use hashmap to make sure everyone can only have one vote
        let player = players.find((player) => player.username === user.username);
        if (voted[player.username]) return;

        console.log(`${player.username} voted ${userEmojiReaction}`);
        voted[player.username] = true;
        votes[emoteKeycaps.indexOf(userEmojiReaction)] += 1;
        console.log(votes);
    } else if (Object.values(emoteRoles).includes(userEmojiReaction) && !user.bot && user.id === hostId) {
        let keys = Object.keys(emoteRoles);
        let values = Object.values(emoteRoles);
        let role = keys[values.indexOf(userEmojiReaction)];

        if (role === "Mason") {
            roles[role] = 2;
        } else {
            roles[role] += 1;
        }
        console.log(`${role} added`);
    }
});

client.on("messageReactionRemove", (reaction, user) => {
    let userEmojiReaction = reaction.emoji.name;
    if (userEmojiReaction === emoteJoin && !user.bot) {
        console.log(`${user.username} was removed`);
        players.splice(
            players.findIndex((i) => i.id === user.id),
            1
        );
    }
});

client.login(token);
