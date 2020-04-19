const Discord = require("discord.js");
const { performance } = require("perf_hooks");
const { prefix, token } = require("../config.json");
const client = new Discord.Client();
let emoteJoin = "🎮";
let emoteStart = "🟢";
let emoteThumb = "👌";

let emotePlayerChoice = "🔢";
let emoteMiddleChoice = "🔮";
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
    Minion: 1,
    Villager: 1,
    Seer: 0,
    Robber: 0,
    Troublemaker: 0,
    Drunk: 0,
    Hunter: 0,
    Mason: 0,
    Insomniac: 0,
    Deppelganger: 0,
};
let gameOn = false;

let hostId;
let players = [];
let deck = [];
let exist = {
    loneWolf: false,
    Minion: false,
    Mason: false,
    Seer: false,
    Robber: false,
    Troublemaker: false,
    Drunk: false,
    Insomniac: false,
    Deppelganger: false,
};

function resetExist() {
    exist = {
        loneWolf: false,
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

let playerTime = 10000; //milliseconds (20s)
let discussionTime = 300000; //milliseconds (5mins)

//turns the roles object into an array
function makeRolesArray(roles) {
    let rolesArray = [];
    let werewolves = Array(roles.Werewolf).fill("Werewolf");
    let minion = Array(roles.Minion).fill("Minion");
    let villagers = Array(roles.Villager).fill("Villager");
    let seer = Array(roles.Seer).fill("Seer");
    let robber = Array(roles.Robber).fill("Robber");
    let troublemaker = Array(roles.Troublemaker).fill("Troublemaker");
    //let drunk = Array(roles.Drunk).fill("Drunk");

    rolesArray = werewolves.concat(minion).concat(villagers).concat(seer).concat(robber).concat(troublemaker);

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
    deck = makeRolesArray(roles);
    shuffleDeck(deck);

    for (let i = 0; i < players.length; i++) {
        players[i].role = deck[i];
        if (deck[i] === "Werewolf") {
            wolfCount += 1;
        } else {
            exist[deck[i]] = true;
        }
        console.log(`${players[i].username} got ${players[i].role}`);
    }

    if (wolfCount == 1) {
        exist.loneWolf = true;
    }
}

function playerOptions() {
    let playerOptions = "";
    let number = 0;
    players.forEach((player) => {
        playerOptions += `(${emoteKeycaps[number]} ${player.username})`;
        number += 1;
    });
    return playerOptions;
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
    let everyone = "";
    let count = 0;
    players.forEach((player) => {
        everyone += `(${emoteKeycaps[count]} ${player.username})`;
        count += 1;
    });

    return everyone;
}

function nightFalls(message) {
    message.channel
        .send(`Night falls. Werewolves! Please wake up.`)
        .then((message) => {
            //if there's a lone wolf in the players, ask to pick a card in the middle
            if (exist.loneWolf) {
                let player = players.find((player) => player.role === "Werewolf");
                player.send(`You are a lone wolf! Which of the 3 cards in the middle would you like to take a peek? (Timer: ${playerTime / 1000}s)`).then((dm) => {
                    //show emotes in 1️⃣, 2️⃣, 3️⃣ for the lone wolf to pick
                    dm.react(emoteKeycaps[0])
                        .then(() => dm.react(emoteKeycaps[1]))
                        .then(() => dm.react(emoteKeycaps[2]));

                    //only listen for keycap emojis
                    dm.awaitReactions(keycapsFilter, {
                        max: 1,
                        time: playerTime,
                        errors: ["time"],
                    })
                        .then((collected) => {
                            const wolfReaction = collected.first().emoji.name;

                            if (wolfReaction === emoteKeycaps[0]) {
                                console.log("Wolf picked card 1");
                                dm.reply(`The card is ${deck[deck.length - 3]}`);
                            } else if (wolfReaction === emoteKeycaps[1]) {
                                console.log("Wolf picked card 2");
                                dm.reply(`The card is ${deck[deck.length - 2]}`);
                            } else if (wolfReaction === emoteKeycaps[2]) {
                                console.log("Wolf picked card 3");
                                dm.reply(`The card is ${deck[deck.length - 1]}`);
                            }
                        })
                        .catch((collected) => {
                            console.log("Time out. No action from the werewolf. Game continues");
                            dm.reply(`Time out, no action.`);
                        });
                });
            } else {
                //otherwise, tell all the werewolves each other's teammates
                players.forEach((player) => {
                    if (player.role === "Werewolf") {
                        player.send(`${getTeammate(player)}`);
                    }
                });
            }
        })
        .catch((error) => {
            console.log("Night fall: Sending message failed");
            console.log(error);
        });
}

function minionTurn(message) {
    message.channel.send(`Minion! Please wake up`).then((message) => {
        if (exist.Minion) {
            let player = players.find((player) => player.role === "Minion");
            player.send(`${getWerewolves()}.`);
        }
    });
}

function seerTurn(message) {
    message.channel.send(`Seer! Please wake up.`).then((message) => {
        //if there's a Seer in the players, ask to either see a player's card or pick 2 cards from the center
        if (exist.Seer) {
            let t0 = performance.now(); //start time to keep tract of player's choice time
            let player = players.find((player) => player.role === "Seer");
            player.send(` You may look at another player's card (${emotePlayerChoice}) or 2 cards from the middle (${emoteMiddleChoice}). (Timer: ${playerTime / 1000}s)`).then((dm) => {
                //show emotes in 🔢, 🔮 for the Seer to pick
                dm.react(emotePlayerChoice).then(() => dm.react(emoteMiddleChoice));

                console.log(`Player time ${playerTime}`);

                //only listen for 🔢, 🔮 emojis
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

                            dm.reply(`Select a player to see their card. ${getEveryone()}. (Timer: ${(leftOverTime / 1000).toFixed(0)}s)`).then((dm) => {
                                for (let i = 0; i < players.length; i++) {
                                    dm.react(emoteKeycaps[i]);
                                }

                                console.log(`Player time remaining ${leftOverTime}`);

                                dm.awaitReactions(keycapsFilter, {
                                    max: 1,
                                    time: leftOverTime,
                                    errors: ["time"],
                                })
                                    .then((collected) => {
                                        const seerPlayerChoice = collected.first();
                                        let card = deck[emoteKeycaps.indexOf(seerPlayerChoice.emoji.name)];
                                        dm.reply(`This player's card is ${card}`);
                                        console.log(card);
                                    })
                                    .catch((collected) => {
                                        console.log("Time out. No action from the Seer. Game continues");
                                        dm.reply(`Time out, no player selected.`);
                                    });
                            });
                        } else if (seerReaction.emoji.name === emoteMiddleChoice) {
                            let t1 = performance.now();
                            let timeUsed = t1 - t0;
                            let leftOverTime = playerTime - timeUsed;

                            dm.reply(`Select two cards from the middle. (Timer: ${(leftOverTime / 1000).toFixed(0)}s)`).then((dm) => {
                                for (let i = 0; i < 3; i++) {
                                    dm.react(emoteKeycaps[i]);
                                }

                                console.log(`Player time remaining ${leftOverTime}`);

                                dm.awaitReactions(keycapsFilter, {
                                    max: 1,
                                    time: leftOverTime,
                                    errors: ["time"],
                                })
                                    .then((collected) => {
                                        const seerMiddleChoice = collected.first().emoji.name;

                                        let t2 = performance.now();
                                        let timeUsed = t2 - t1;
                                        let finalTime = leftOverTime - timeUsed;

                                        //depending on which number the seer picks, it shows one of the 3 last cards in the deck
                                        if (seerMiddleChoice === emoteKeycaps[0]) {
                                            console.log("Seer picked card 1");
                                            dm.reply(`The first card is ${deck[deck.length - 3]}. (Timer: ${(finalTime / 1000).toFixed(0)}s)`);
                                        } else if (seerMiddleChoice === emoteKeycaps[1]) {
                                            console.log("Seer picked card 2");
                                            dm.reply(`The second card is ${deck[deck.length - 2]}. (Timer: ${(finalTime / 1000).toFixed(0)}s)`);
                                        } else if (seerMiddleChoice === emoteKeycaps[2]) {
                                            console.log("Seer picked card 3");
                                            dm.reply(`The third card is ${deck[deck.length - 1]}. (Timer: ${(finalTime / 1000).toFixed(0)}s)`);
                                        }
                                    })
                                    .then(() => {
                                        let t2 = performance.now();
                                        let timeUsed = t2 - t1;
                                        let finalTime = leftOverTime - timeUsed;

                                        console.log(`Player time final ${finalTime}`);

                                        dm.awaitReactions(seerFilter, {
                                            max: 1,
                                            time: finalTime,
                                            errors: ["time"],
                                        })
                                            .then((collected) => {
                                                const seerMiddleChoice = collected.first().emoji.name;

                                                if (seerMiddleChoice === emoteKeycaps[0]) {
                                                    console.log("Seer picked card 1");
                                                    dm.reply(`The card is ${deck[deck.length - 3]}`);
                                                } else if (seerMiddleChoice === emoteKeycaps[1]) {
                                                    console.log("Seer picked card 2");
                                                    dm.reply(`The card is ${deck[deck.length - 2]}`);
                                                } else if (seerMiddleChoice === emoteKeycaps[2]) {
                                                    console.log("Seer picked card 3");
                                                    dm.reply(`The card is ${deck[deck.length - 1]}`);
                                                }
                                            })
                                            .catch((collected) => {
                                                console.log("Time out. No action from the Seer. Game continues");
                                                dm.reply(`Time out.`);
                                            });
                                    })
                                    .catch((collected) => {
                                        console.log("Time out. No action from the Seer. Game continues");
                                        dm.reply(`Time out.`);
                                    });
                            });
                        }
                    })
                    .catch((collected) => {
                        console.log("Time out. No action from the seer. Game continues.");
                        dm.reply(`Time out, no action.`);
                    });
            });
        }
    });
}

function robberTurn(message) {
    message.channel.send(`Robber! Please wake up`).then((message) => {
        if (exist.Robber) {
            let player = players.find((player) => player.role === "Robber");
            player.send(`You may exchange your card another player's card ${getEveryone()}, and then view that card. (Timer: ${playerTime / 1000}s)`).then((dm) => {
                for (let i = 0; i < players.length; i++) {
                    dm.react(emoteKeycaps[i]);
                }

                dm.awaitReactions(keycapsFilter, {
                    max: 1,
                    time: playerTime,
                    errors: ["time"],
                })
                    .then((collected) => {
                        const robberPlayerChoice = collected.first();
                        let index = emoteKeycaps.indexOf(robberPlayerChoice.emoji.name);
                        let card = deck[index];

                        console.log(`${player.username} (${player.role}) exchanged with ${players[index].username} (${players[index].role}) `);
                        player.role = card;
                        players[index].role = "Robber";
                        console.log(`${player.username} is now (${player.role}) and ${players[index].username} is now (${players[index].role}) `);

                        dm.reply(`You have exchanged your card with this player. You are now the ${card} and this player is now the Robber`);
                    })
                    .catch((collected) => {
                        console.log("Time out. No action from the Robber. Game continues");
                        dm.reply(`Time out, no exchange.`);
                    });
            });
        }
    });
}

function troublemakerTurn(message) {
    message.channel.send(`Troublemaker! Please wake up`).then((message) => {
        if (exist.Troublemaker) {
            let t0 = performance.now();
            let player = players.find((player) => player.role === "Troublemaker");
            player.send(`You may swap cards between two players ${getEveryone()}. (Timer: ${playerTime / 1000}s)`).then((dm) => {
                for (let i = 0; i < players.length; i++) {
                    dm.react(emoteKeycaps[i]);
                }

                let p1, p2;

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
                        console.log(`Troublemaker selected ${troublemakerChoice}`);
                        dm.reply(`Select another card. (Timer: ${(leftOverTime / 1000).toFixed(0)}s)`);
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
                                const troublemakerChoice = collected.first().emoji.name;

                                p2 = troublemakerChoice;
                                console.log(`Troublemaker selected ${troublemakerChoice}`);

                                let index1 = emoteKeycaps.indexOf(p1);
                                let index2 = emoteKeycaps.indexOf(p2);
                                let temp = players[index1].role;

                                console.log(`${players[index1].username} (${players[index1].role}) has been swapped with ${players[index2].username} (${players[index2].role}) `);
                                players[index1].role = players[index2].role;
                                players[index2].role = temp;
                                console.log(`${players[index1].username} is now (${players[index1].role}) and ${players[index2].username} is now (${players[index2].role}) `);

                                dm.reply(`Player ${p1} and ${p2} have been swapped`);
                                console.log(`Troublemaker selected ${troublemakerChoice}`);
                            })
                            .catch((collected) => {
                                console.log("Time out. No second action from the Troublemaker. Game continues");
                                dm.reply(`Time out. No swap.`);
                            });
                    })
                    .catch((collected) => {
                        console.log("Time out. No action from the Troublemaker. Game continues");
                        dm.reply(`Time out. No swap.`);
                    });
            });
        }
    });
}

function voteTurn(message) {
    message.channel.send(`Vote who you think is the werewolf! ${getEveryone()}`).then((vote) => {
        for (let i = 0; i < players.length; i++) {
            vote.react(emoteKeycaps[i]);
        }

        let votes = {
            "1️⃣": 0,
            "2️⃣": 0,
            "3️⃣": 0,
            "4️⃣": 0,
            "5️⃣": 0,
            "6️⃣": 0,
            "7️⃣": 0,
            "8️⃣": 0,
            "9️⃣": 0,
            "🔟": 0,
        };

        //TODO: need a better way to determine max vote
        vote.awaitReactions((reaction, user) => emoteKeycaps.includes(reaction.emoji.name) && !user.bot, {
            max: players.length,
            time: discussionTime,
            errors: ["time"],
        })
            .then((collected) => {
                const reaction = collected.first().emoji.name;
                votes[reaction] += 1;
                console.log(reaction);
            })
            .catch((collected) => {
                //gather the votes and reveal
                console.log(`After 5mins`);
            });
    });
}

function oneNightUltimateWerewolf(message) {
    message.channel
        .send(`Welcome to the Werewolf Game! Press the controller to join. Then the host can press the green circle to start.`)
        .then((welcomeMessage) => {
            welcomeMessage.react(emoteJoin).then(() => welcomeMessage.react(emoteStart));

            welcomeMessage
                //only the host can start the game
                .awaitReactions((reaction, user) => reaction.emoji.name === emoteStart && !user.bot && user.id === hostId, {
                    max: 1,
                    time: 300000, //5 mins of wait time
                    errors: ["time"],
                })
                .then((collected) => {
                    const reaction = collected.first();

                    if (reaction.emoji.name === emoteStart) {
                        welcomeMessage.delete();
                        message.channel.send(`Game start! Players: ${players}`); //ping all players the game has started

                        //assigning roles
                        assignRoles(players);

                        //send roles to each player
                        message.channel.send(`Please check your pm for your role. Game starting in ${playerTime / 1000}s`);
                        players.forEach((player) => {
                            player.send(`Your role is...${player.role}!`); //TODO: provide role description
                        });

                        //night falls
                        werewolfRoundTimer = setTimeout(function () {
                            nightFalls(message);
                        }, playerTime);

                        //minion wakes up to see who the werewolves are
                        minionRoundTimer = setTimeout(function () {
                            minionTurn(message);
                        }, playerTime * 2);

                        //ask Seer for 2 cards in the middle or a player
                        // seerRoundTimer = setTimeout(function () {
                        //     seerTurn(message);
                        // }, playerTime * 2);

                        //robber switch one card with a player and see the role
                        // robberRoundTimer = setTimeout(function () {
                        //     robberTurn(message);
                        // }, playerTime);

                        //troublemaker switches two cards without looking at them
                        // troublemakerRoundTimer = setTimeout(function () {
                        //     troublemakerTurn(message);
                        // }, playerTime);

                        //drunk switch one card in the middle without looking at them
                        // drunkRoundTimer = setTimeout(function () {
                        //     drunkTurn(message);
                        // }, playerTime);

                        //lastly ask everyone to vote
                        voteTimer = setTimeout(function () {
                            voteTurn(message);
                        }, playerTime * 2);
                    }
                })
                .catch((collected) => {
                    console.log("Time out. No action after 5mins");
                    console.log("game terminated");
                    gameOn = false;
                    players = [];
                });
        })
        .catch((error) => {
            console.log(error);
            gameOn = false;
        });
}

client.on("message", (message) => {
    if (message.channel.type == "dm") {
        message.author.send("You're not supposed to message the bot!").catch((error) => {
            //TODO: fix this error
            //console.log("Dm error, ignore for now.");
        });
        return;
    }

    if (message.content === `${prefix}play`) {
        hostId = message.author.id; //store host id so only the host can start the game

        //only one game at a time
        if (!gameOn) {
            oneNightUltimateWerewolf(message);
            gameOn = true;
        } else {
            message.channel.send("A game already exists. Type -stop to terminate current session.");
        }
    } else if (message.content === `${prefix}players`) {
        console.log(players.forEach((player) => player.username));
        if (players.length) {
            message.channel.send(players.forEach((player) => player.username));
        } else {
            message.channel.send("No players.");
        }
    } else if (message.content === `${prefix}stop`) {
        //TODO: add a confirm reaction check
        console.log("game terminated");
        gameOn = false;
        players = [];
        resetExist();
        message.channel.send("Game terminated.");
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
    } else if (message.content === `${prefix}showRoles`) {
        console.log(roles);
        if (gameOn) {
            message.channel.send(makeRolesArray(roles));
        } else {
            console.log("No existing game. Start a game to use this function");
        }
    } else if (message.content === `${prefix}playerRoles`) {
        if (gameOn) {
            if (players[0].role) {
                //players.map((player) => message.channel.send(`${player.username}'s role is...${player.role}`));
                console.log(players.forEach((player) => message.channel.send(`${player.username}'s role is...${player.role}`)));
            } else {
                message.channel.send("Players roles haven't been set yet. Start the game to assign roles");
            }
        } else {
            console.log("No existing game. Start a game to use this function");
        }
    } else if (message.content.startsWith(`${prefix}deck`)) {
        console.log(deck);
    } else if (message.content.startsWith(`${prefix}setRoles`)) {
        let args = message.content.slice(`${prefix}setRoles`.length + 1).split(" ");
        //console.log(args);

        //use args to set each role
        roles.Werewolf = parseInt(args[0]);
        roles.Villager = parseInt(args[1]);
        roles.Seer = parseInt(args[2]);
        //do the same for the rest of the roles

        message.channel.send(`Werewolves: ${roles.Werewolf}, Villagers: ${roles.Villager} have been set.`);
        console.log(makeRolesArray(roles));
    }
});

client.on("messageReactionAdd", (reaction, user) => {
    if (reaction.emoji.name === emoteJoin && !user.bot) {
        console.log(`${user.username} was added. id: ${user.id}`);
        players.push(user);
    } else if (reaction.emoji.name === emoteThumb && !user.bot) {
        console.log("Reaction get!");
        // setTimeout(function () {
        //     console.log("I appear after 3s!");
        // }, 3000);
    } else if (emoteKeycaps.includes(reaction.emoji.name) && !user.bot) {
        //console.log(`${reaction.emoji.name} got selected`);
    }
});

client.on("messageReactionRemove", (reaction, user) => {
    if (reaction.emoji.name === emoteJoin && !user.bot) {
        console.log(`${user.username} was removed`);
        //players.splice(players.indexOf(user.id), 1);
        players.splice(
            players.findIndex((i) => i.id === user.id),
            1
        );
    }
});

client.login(token);
