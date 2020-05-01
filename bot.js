const Discord = require("discord.js");
const { performance } = require("perf_hooks");
const { prefix, token } = require("../config.json");
const client = new Discord.Client();
let emoteJoin = "🎮";
let emoteStart = "🟢";
let emoteOK = "🆗";
let emoteThumb = "👌";

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

const allRoles = ["Werewolf", "Villager", "!Seer", "!Witch", "!Hunter", "!Guard", "!Knight"];
//let roles = { Werewolf: 0, Villager: 0, Seer: 0, Witch: 0, Hunter: 0, Guard: 0, Knight: 0 };
let roles = {
    Werewolf: 1,
    Minion: 0,
    Villager: 1,
    Seer: 1,
    Robber: 0,
    Troublemaker: 0,
    Drunk: 1,
    Hunter: 0,
    Mason: 0,
    Insomniac: 0,
    Deppelganger: 0,
};

let badGuys = ["Werewolf", "Minion"];

let description = {
    Werewolf: "",
    Minion: "",
    Villager: "",
    Seer: "",
    Robber: "",
    Troublemaker: "",
    Drunk: "",
    Hunter: "",
    Mason: "",
    Insomniac: "",
    Deppelganger: "",
};

let gameOn = false;
let voteOn = false;

let joinWaitTime = 30000;
let playerTime = 10000; //time for each player's choice
let roundTime = playerTime; //each rounds time, this increments based on which roles are the in game
let discussionTime = 120000; //milliseconds (5mins)

let players = [];
let deck = [];
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
    Deppelganger: false,
};

let votes = [];

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
        Deppelganger: false,
    };
}

let werewolfRoundTimer;
let minionRoundTimer;
let masonsRoundTimer;
let seerRoundTimer;
let robberRoundTimer;
let troublemakerRoundTimer;
let drunkRoundTimer;
let insomniacRoundTimer;
let voteTimer;

//turns the roles object into an array
function makeDeck(roles) {
    let rolesArray = [];
    let werewolves = Array(roles.Werewolf).fill("Werewolf");
    let minion = Array(roles.Minion).fill("Minion");
    let villagers = Array(roles.Villager).fill("Villager");
    let seer = Array(roles.Seer).fill("Seer");
    let robber = Array(roles.Robber).fill("Robber");
    let troublemaker = Array(roles.Troublemaker).fill("Troublemaker");
    let drunk = Array(roles.Drunk).fill("Drunk");

    rolesArray = werewolves.concat(minion).concat(villagers).concat(seer).concat(robber).concat(troublemaker).concat(drunk);

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

//this assign the roles by shuffling the rolesArray
function assignRoles(players) {
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
    } else {
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

function halfTimeReminder(player, time) {
    player.send(`(${millisecondsToSeconds(time)}s remaining).`);
}

function millisecondsToSeconds(milliseconds) {
    return (milliseconds / 1000).toFixed(0);
}

async function werewolfTurn(message) {
    message.channel.send(`Night falls. Werewolves! Please wake up.`);

    //if there's a lone wolf in the players, ask to pick a card in the middle
    if (exist.loneWolf) {
        let player = players.find((player) => player.role === "Werewolf");
        let timeReminder = setTimeout(() => {
            halfTimeReminder(player, playerTime / 2);
        }, playerTime / 2);

        const dm = player.send(`You are a Lone Wolf! Which of the 3 cards in the middle would you like to take a peek? (Timer: ${millisecondsToSeconds(playerTime)}s)`);
        //show emotes in 1️⃣, 2️⃣, 3️⃣ for the lone wolf to pick
        await dm.react(emoteKeycaps[0]);
        await dm.react(emoteKeycaps[1]);
        await dm.react(emoteKeycaps[2]);

        //only listen for keycap emojis
        const collected = await dm.awaitReactions(keycapsFilter, {
            max: 1,
            time: playerTime,
            errors: ["time"],
        });

        try {
            clearTimeout(timeReminder);
            const wolfReaction = collected.first().emoji.name;

            if (wolfReaction === emoteKeycaps[0]) {
                dm.reply(`The card is ${deck[deck.length - 3]}`);
                console.log(`${player.username} (Lone Wolf) picked card 1 from the middle`);
            } else if (wolfReaction === emoteKeycaps[1]) {
                dm.reply(`The card is ${deck[deck.length - 2]}`);
                console.log(`${player.username} (Lone Wolf) picked card 2 from the middle`);
            } else if (wolfReaction === emoteKeycaps[2]) {
                dm.reply(`The card is ${deck[deck.length - 1]}`);
                console.log(`${player.username} (Lone Wolf) picked card 3 from the middle`);
            }
        } catch (error) {
            console.log(`Time out. ${player.username} (Lone Wolf) did not pick a card from the middle`);
            dm.reply(`Time out. You decided not to pick a card from the middle.`);
        }
    } else {
        //otherwise, tell all the werewolves each other's teammates
        players.forEach((player) => {
            if (player.role === "Werewolf") {
                player.send(`${getTeammate(player)}`);
            }
        });
    }
}

function minionTurn(message) {
    message.channel.send(`Minion! Please wake up`);

    if (exist.Minion) {
        let player = players.find((player) => player.role === "Minion");
        if (exist.loneWolf) {
            player.send(`${getWerewolves()}. Assist this player to win the game.`);
        } else if (exist.Werewolf) {
            player.send(`${getWerewolves()}. Assist them to win the game.`);
        } else {
            player.send(`There are no Werewolves! Survive to win!`);
        }
    }
}

//TODO
function seerTurn(message) {
    message.channel.send(`Seer! Please wake up.`).then((message) => {
        //if there's a Seer in the players, ask to either see a player's card or pick 2 cards from the center
        if (exist.Seer) {
            let timeReminder = setTimeout(() => {
                halfTimeReminder(player, playerTime / 2);
            }, playerTime / 2);

            let t0 = performance.now(); //start time to keep tract of player's choice time
            let player = players.find((player) => player.role === "Seer");
            player.send(`You may look at another player's card (${emotePlayerChoice}) or 2 cards from the middle (${emoteMiddleChoice}). (Timer: ${millisecondsToSeconds(playerTime)}s)`).then((dm) => {
                //show emotes in 🔮, 🃏 for the Seer to pick
                dm.react(emotePlayerChoice).then(() => dm.react(emoteMiddleChoice));

                //only listen for 🔮, 🃏 emojis
                dm.awaitReactions(seerFilter, {
                    max: 1,
                    time: playerTime,
                    errors: ["time"],
                })
                    .then((collected) => {
                        const seerReaction = collected.first();

                        if (seerReaction.emoji.name === emotePlayerChoice) {
                            let t1 = performance.now();
                            let timeUsed = t1 - t0;
                            let leftOverTime = playerTime - timeUsed;

                            dm.reply(`Select a player to see their card.${getEveryone()}(Timer: ${millisecondsToSeconds(leftOverTime)}s)`).then((dm) => {
                                for (let i = 0; i < players.length; i++) {
                                    dm.react(emoteKeycaps[i]);
                                }

                                dm.awaitReactions(keycapsFilter, {
                                    max: 1,
                                    time: leftOverTime,
                                    errors: ["time"],
                                })
                                    .then((collected) => {
                                        clearTimeout(timeReminder);
                                        const seerPlayerChoice = collected.first();
                                        let index = emoteKeycaps.indexOf(seerPlayerChoice.emoji.name);
                                        let card = deck[index];
                                        dm.reply(`${players[index].username} is (${card})`);
                                        console.log(`${player.username} (Seer) checked card ${index + 1}, ${card}`);
                                    })
                                    .catch((collected) => {
                                        console.log(`Time out. ${player.username} (Seer) did not select a player`);
                                        dm.reply(`Time out. You decided to not select.`);
                                    });
                            });
                        } else if (seerReaction.emoji.name === emoteMiddleChoice) {
                            let t1 = performance.now();
                            let timeUsed = t1 - t0;
                            let leftOverTime = playerTime - timeUsed;

                            dm.reply(`Select two cards from the middle. (Timer: ${millisecondsToSeconds(leftOverTime)}s)`).then((dm) => {
                                for (let i = 0; i < 3; i++) {
                                    dm.react(emoteKeycaps[i]);
                                }

                                dm.awaitReactions(keycapsFilter, {
                                    max: 1,
                                    time: leftOverTime,
                                    errors: ["time"],
                                })
                                    .then((collected) => {
                                        const seerMiddleChoice1 = collected.first().emoji.name;

                                        let t2 = performance.now();
                                        let timeUsed = t2 - t1;
                                        let finalTime = leftOverTime - timeUsed;

                                        //depending on which number the seer picks, it shows one of the 3 last cards in the deck
                                        if (seerMiddleChoice1 === emoteKeycaps[0]) {
                                            dm.reply(`The first card is (${deck[deck.length - 3]}). (Timer: ${millisecondsToSeconds(finalTime)}s)`);
                                            console.log(`${player.username} (Seer) picked card 1, ${deck[deck.length - 3]}`);
                                        } else if (seerMiddleChoice1 === emoteKeycaps[1]) {
                                            dm.reply(`The second card is (${deck[deck.length - 2]}). (Timer: ${millisecondsToSeconds(finalTime)}s)`);
                                            console.log(`${player.username} (Seer) picked card 2, ${deck[deck.length - 2]}`);
                                        } else if (seerMiddleChoice1 === emoteKeycaps[2]) {
                                            dm.reply(`The third card is (${deck[deck.length - 1]}). (Timer: ${millisecondsToSeconds(finalTime)}s)`);
                                            console.log(`${player.username} (Seer) picked card 3, ${deck[deck.length - 1]}`);
                                        }
                                    })
                                    .then(() => {
                                        let t2 = performance.now();
                                        let timeUsed = t2 - t1;
                                        let finalTime = leftOverTime - timeUsed;

                                        dm.awaitReactions(keycapsFilter, {
                                            max: 1,
                                            time: finalTime,
                                            errors: ["time"],
                                        })
                                            .then((collected) => {
                                                clearTimeout(timeReminder);
                                                const seerMiddleChoice2 = collected.first().emoji.name;

                                                if (seerMiddleChoice2 === emoteKeycaps[0]) {
                                                    dm.reply(`The first card is (${deck[deck.length - 3]}).`);
                                                    console.log(`${player.username} (Seer) picked card 1, ${deck[deck.length - 3]}`);
                                                } else if (seerMiddleChoice2 === emoteKeycaps[1]) {
                                                    dm.reply(`The second card is (${deck[deck.length - 2]}).`);
                                                    console.log(`${player.username} (Seer) picked card 2, ${deck[deck.length - 2]}`);
                                                } else if (seerMiddleChoice2 === emoteKeycaps[2]) {
                                                    dm.reply(`The third card is (${deck[deck.length - 1]}).`);
                                                    console.log(`${player.username} (Seer) picked card 3, ${deck[deck.length - 1]}`);
                                                }
                                            })
                                            .catch((collected) => {
                                                console.log(`Time out. ${player.username} (Seer) didn't pick a second card from the middle.`);
                                                dm.reply(`Time out. You decided to not pick a second card from the middle.`);
                                            });
                                    })
                                    .catch((collected) => {
                                        console.log(`Time out. ${player.username} (Seer) didn't pick any cards from the middle`);
                                        dm.reply(`Time out. You decided not to pick any cards from the middle.`);
                                    });
                            });
                        }
                    })
                    .catch((collected) => {
                        console.log(`Time out. Seer (${player.username}) did nothing.`);
                        dm.reply(`Time out. You decided to take no action.`);
                    });
            });
        }
    });
}

async function robberTurn(message) {
    message.channel.send(`Robber! Please wake up`);

    if (exist.Robber) {
        let timeReminder = setTimeout(() => {
            halfTimeReminder(player, playerTime / 2);
        }, playerTime / 2);

        let player = players.find((player) => player.role === "Robber");
        const dm = player.send(`You may exchange your card another player's card${getEveryone()}and then view that card. (Timer: ${millisecondsToSeconds(playerTime)}s)`);
        for (let i = 0; i < players.length; i++) {
            dm.react(emoteKeycaps[i]);
        }

        const collected = await dm.awaitReactions(keycapsFilter, {
            max: 1,
            time: playerTime,
            errors: ["time"],
        });

        try {
            clearTimeout(timeReminder);
            const robberPlayerChoice = collected.first().emoji.name;
            console.log(`${player.username} robbed ${robberPlayerChoice}`);
            let indexChoice = emoteKeycaps.indexOf(robberPlayerChoice);
            let indexSelf = deck.indexOf(player.role);
            let card = deck[indexChoice];

            //exchanging roles
            console.log(`${player.username} (${player.role}) exchanged with ${players[indexChoice].username} (${players[indexChoice].role}) `);
            player.role = card;
            players[indexChoice].role = "Robber";
            console.log(`${player.username} is now (${player.role}) and ${players[indexChoice].username} is now (${players[indexChoice].role}) `);

            //Also exchange the cards in the deck
            deck[indexChoice] = "Robber";
            deck[indexSelf] = card;

            dm.reply(`You have exchanged your card with this player. You are now the (${card}) and ${robberPlayerChoice} ${players[indexChoice].username} is now the (Robber)`);
        } catch (error) {
            console.log(`Time out. Robber (${player.username}) did nothing.`);
            dm.reply(`Time out. You decided to not rob anyone. No exchange.`);
        }
    }
}

//TODO: need work
async function troublemakerTurn(message) {
    message.channel.send(`Troublemaker! Please wake up`);

    if (exist.Troublemaker) {
        let timeReminder = setTimeout(() => {
            halfTimeReminder(player, playerTime / 2);
        }, playerTime / 2);

        let t0 = performance.now();
        let player = players.find((player) => player.role === "Troublemaker");
        const dm = await player.send(`You may swap cards between two players${getEveryone()}(Timer: ${millisecondsToSeconds(playerTime)}s)`);
        for (let i = 0; i < players.length; i++) {
            dm.react(emoteKeycaps[i]);
        }

        let p1, p2;

        //TODO: make this simpler
        dm.awaitReactions(keycapsFilter, {
            max: 1,
            time: playerTime,
            errors: ["time"],
        })
            .then((collected) => {
                const troublemakerChoice = collected.first().emoji.name;

                let t1 = performance.now();
                let timeUsed = t1 - t0;
                let leftOverTime = playerTime - timeUsed;

                p1 = troublemakerChoice;
                console.log(`${player.username} (Troublemaker) selected ${troublemakerChoice}`);
                dm.reply(`Select another card. (Timer: ${millisecondsToSeconds(leftOverTime)}s)`);
            })
            .then(() => {
                let t1 = performance.now();
                let timeUsed = t1 - t0;
                let leftOverTime = playerTime - timeUsed;

                dm.awaitReactions(keycapsFilter, {
                    max: 1,
                    time: leftOverTime,
                    errors: ["time"],
                })
                    .then((collected) => {
                        clearTimeout(timeReminder);
                        const troublemakerChoice = collected.first().emoji.name;

                        p2 = troublemakerChoice;
                        console.log(`${player.username} (Troublemaker) selected ${troublemakerChoice}`);

                        let index1 = emoteKeycaps.indexOf(p1);
                        let index2 = emoteKeycaps.indexOf(p2);
                        let temp = players[index1].role;

                        console.log(`${players[index1].username} (${players[index1].role}) has been swapped with ${players[index2].username} (${players[index2].role})`);
                        players[index1].role = players[index2].role;
                        players[index2].role = temp;
                        console.log(`${players[index1].username} is now (${players[index1].role}) and ${players[index2].username} is now (${players[index2].role})`);

                        //Also exchange the cards in the deck
                        deck[index1] = players[index1].role;
                        deck[index2] = players[index2].role;

                        dm.reply(`Player ${p1} and ${p2} have been swapped`);
                        console.log(`Troublemaker selected ${troublemakerChoice}`);
                    })
                    .catch((collected) => {
                        console.log(`Time out. ${player.username} (Troublemaker) did not select a second player.`);
                        dm.reply(`Time out. No swap.`);
                    });
            })
            .catch((collected) => {
                console.log(`Time out. ${player.username} (Troublemaker) did nothing.`);
                dm.reply(`Time out. No swap.`);
            });
    }
}

async function drunkTurn(message) {
    message.channel.send(`Drunk! Please wake up`);

    if (exist.Drunk) {
        let timeReminder = setTimeout(() => {
            halfTimeReminder(player, playerTime / 2);
        }, playerTime / 2);

        let player = players.find((player) => player.role === "Drunk");
        const dm = await player.send(`You must exchange your card with a card in the middle without knowing the role. If non-selected, a random card will be exchanged. (Timer: ${millisecondsToSeconds(playerTime)}s)`);
        for (let i = 0; i < 3; i++) {
            dm.react(emoteKeycaps[i]);
        }

        const collected = await dm.awaitReactions(keycapsFilter, {
            max: 1,
            time: playerTime,
            errors: ["time"],
        });

        try {
            clearTimeout(timeReminder);
            const drunkPlayerChoice = collected.first().emoji.name;
            let card;
            let number;
            let indexChoice;
            let indexSelf = deck.indexOf(player.role);

            if (drunkPlayerChoice === emoteKeycaps[0]) {
                console.log("Drunk picked card 1");
                number = 1;
                indexChoice = deck.length - 3;
            } else if (drunkPlayerChoice === emoteKeycaps[1]) {
                console.log("Drunk picked card 2");
                number = 2;
                indexChoice = deck.length - 2;
            } else if (drunkPlayerChoice === emoteKeycaps[2]) {
                console.log("Drunk picked card 3");
                number = 3;
                indexChoice = deck.length - 1;
            }

            card = deck[indexChoice];

            console.log(`${player.username} (${player.role}) exchanged with card ${number} (${card}) from the middle`);
            player.role = card;

            //Also exchange the cards in the deck
            deck[indexChoice] = "Drunk";
            deck[indexSelf] = card;

            console.log(`${player.username} is now (${player.role}) and the middle card ${number} is now ${deck[indexChoice]}`);
            dm.reply(`You have exchanged your card with the card ${drunkPlayerChoice} from the middle.`);
        } catch {
            console.log(`Time out. ${player.username} (Robber) did nothing. Random card exchanged.`);
            let randomPick = Math.floor(Math.random() * 3) + 1;
            let indexRandom = deck.length - randomPick;
            let card;
            let indexSelf = deck.indexOf(player.role);

            card = deck[indexRandom];

            console.log(`${player.username} (${player.role}) exchanged with card ${randomPick} (${card}) from the middle`);
            player.role = card;

            //Also exchange the cards in the deck
            deck[indexRandom] = "Drunk";
            deck[indexSelf] = card;

            console.log(`${player.username} is now (${player.role}) and the middle card ${randomPick} is now (${deck[indexRandom]})`);
            dm.reply(`Time out. Card ${randomPick} in the middle has been switched with you.`);
        }
    }
}

function voteTurn(message) {
    //refresh which roles exist in each player's hand
    refreshExist();

    message.channel.send(`Vote who you think is the werewolf! Press ${emoteOK} to confirm${getEveryone()}(Discusstion time:  ${millisecondsToSeconds(discussionTime)}s)`).then((vote) => {
        voteOn = true;
        for (let i = 0; i < players.length; i++) {
            vote.react(emoteKeycaps[i]);
        }
        vote.react(emoteOK);
        votes = Array(players.length).fill(0);

        const filter = (reaction, user) => emoteOK === reaction.emoji.name && !user.bot;
        const collected = vote.awaitReactions(filter, {
            max: players.length,
            time: discussionTime,
            errors: ["time"],
        });

        try {
            message.channel.send(`Everyone voted! The results are...`);
            const reaction = collected.first().emoji.name;
            if (reaction === emoteOK) {
                let highestVote = Math.max(...votes);
                let votedOut = players[votes.indexOf(highestVote)];

                //special case when all bad guys are in the middle
                if (highestVote === 0 && !exist.Werewolf && !exist.Minion) {
                    message.channel.send(`There are no Werewolves! ${getGoodGuys()}win!`);
                } else if (votedOut.role === "Werewolf") {
                    message.channel.send(`${votedOut.username} is a Werewolf!${getGoodGuys()}win!`);
                    //special condition for minion and no werewolves
                } else if (votedOut.role === "Minion" && !exist.Werewolf) {
                    message.channel.send(`${votedOut.username} is not a Werewolf! There are no Werewolves!${getGoodGuys()}win!`);
                } else {
                    message.channel.send(`${votedOut.username} is not a Werewolf!${getBadGuys()}win!`);
                }
            }
        } catch (error) {
            message.channel.send(`Discussion time is up! The results are...`);
            let highestVote = Math.max(...votes);
            let votedOut = players[votes.indexOf(highestVote)];

            //special case when all bad guys are in the middle
            if (highestVote === 1 && !exist.Werewolf && !exist.Minion) {
                message.channel.send(`There are no Werewolves! ${getGoodGuys()}win!`);
            } else if (votedOut.role === "Werewolf") {
                message.channel.send(`${votedOut.username} is a Werewolf!${getGoodGuys()}win!`);
                //special condition for minion and no werewolves
            } else if (votedOut.role === "Minion" && !exist.Werewolf) {
                message.channel.send(`${votedOut.username} is not a Werewolf! There are no Werewolves!${getGoodGuys()}win!`);
            } else {
                message.channel.send(`${votedOut.username} is not a Werewolf!${getBadGuys()}win!`);
            }
        }
    });
}

async function oneNightUltimateWerewolf(message, hostId) {
    let welcomeMessage = await message.channel.send(`Welcome to the Werewolf Game!\nPress the controller to join. Then the host can press the green circle to start.`);
    try {
        await welcomeMessage.react(emoteJoin);
        await welcomeMessage.react(emoteStart);

        //filter only the host can start the game
        const filter = (reaction, user) => reaction.emoji.name === emoteStart && !user.bot && user.id === hostId;
        await welcomeMessage.awaitReactions(filter, {
            max: 1,
            time: joinWaitTime, //5 mins of wait time
            errors: ["time"],
        });

        try {
            welcomeMessage.delete();
            message.channel.send(`Game start! Players: ${players}`); //ping all players the game has started

            //assigning roles
            assignRoles(players);

            //send roles to each player
            message.channel.send(`Please check your pm for your role. Game starting in ${millisecondsToSeconds(playerTime)}s`);
            players.forEach((player) => {
                player.send(`Your role is...${player.role}! ${getRoleDescription(player.role)}`); //TODO: provide role description
            });

            //night falls
            if (roles.Werewolf) {
                werewolfRoundTimer = setTimeout(function () {
                    werewolfTurn(message);
                }, roundTime);
                roundTime += playerTime;
                console.log(`Werewolf time: ${millisecondsToSeconds(roundTime)}s`);
            }

            //minion wakes up to see who the werewolves are
            if (roles.Minion) {
                minionRoundTimer = setTimeout(function () {
                    minionTurn(message);
                }, roundTime);
                roundTime += playerTime;
                console.log(`Minion time: ${millisecondsToSeconds(roundTime)}s`);
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

            //lastly ask everyone to vote
            voteTimer = setTimeout(function () {
                voteTurn(message);
            }, roundTime);
        } catch (error) {
            console.log("Time out. No action after 5mins");
            console.log("game terminated");
            gameOn = false;
            players = [];
        }
    } catch {
        console.log(`error`);
        gameOn = false;
    }
}

client.on("message", (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot || message.channel.type == "dm") return;

    const args = message.content.slice(prefix.length).split(" ");
    const command = args.shift().toLowerCase();

    if (command === `play`) {
        //only one game at a time
        if (!gameOn) {
            //pass host id so only the host can start the game
            oneNightUltimateWerewolf(message, message.author.id);
            gameOn = true;
        } else {
            message.channel.send(`A game already exists. Type '${prefix} stop' to terminate current session.`);
        }
    } else if (command === `players`) {
        console.log(players.forEach((player) => player.username));
        if (players.length) {
            message.channel.send(players.forEach((player) => player.username));
        } else {
            message.channel.send("No players.");
        }
    } else if (command === `stop`) {
        //TODO: add a confirm reaction check
        message.channel.send("Game terminated.");
        console.log("game terminated");
        gameOn = false;
        voteOn = false;
        players = [];
        roundTime = playerTime;
        votes = [];
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
    } else if (command === `playerRoles`) {
        players.forEach((player) => console.log(`${player.username} (${player.role})`));
    } else if (command === `deck`) {
        console.log(deck);
    } else if (command === `setRoles`) {
        //TODO: make a better way
    }
});

client.on("messageReactionAdd", (reaction, user) => {
    let userEmojiReaction = reaction.emoji.name;
    if (userEmojiReaction === emoteJoin && !user.bot) {
        console.log(`${user.username} was added. id: ${user.id}`);
        players.push(user);
    } else if (emoteKeycaps.includes(userEmojiReaction) && !user.bot && voteOn) {
        console.log(`${userEmojiReaction} got selected`);
        votes[emoteKeycaps.indexOf(userEmojiReaction)] += 1;
        console.log(votes);
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
    } else if (emoteKeycaps.includes(userEmojiReaction) && !user.bot && voteOn) {
        console.log(`${userEmojiReaction} got selected`);
        votes[emoteKeycaps.indexOf(userEmojiReaction)] -= 1;
        console.log(votes);
    }
});

client.login(token);
