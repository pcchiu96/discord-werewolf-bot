const Discord = require("discord.js");
const { prefix, token } = require("../config.json");
const client = new Discord.Client();
let emoteJoin = "🎮";
let emoteStart = "🟢";
let emoteThumb = "👌";

let emoteKeycaps = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

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
    Werewolf: 5,
    Villager: 0,
    Seer: 0,
    Robber: 0,
    Troublemaker: 0,
    Tanner: 0,
    Drunk: 0,
    Hunter: 0,
    Mason: 0,
    Insomniac: 0,
    Minion: 0,
    Deppelganger: 0,
};
let gameOn = false;

let players = [];
let deck = [];
let exist = {
    loneWolf: false,
    Seer: false,
    Robber: false,
    Troublemaker: false,
    Tanner: false,
    Drunk: false,
    Hunter: false,
    Mason: false,
    Insomniac: false,
    Minion: false,
    Deppelganger: false,
};

let startGameTimer;
let roundTimer;
let playerTime = 20000; //milliseconds (20s)
let discussionTime = 300000; //milliseconds (5mins)

//turns the roles object into an array
function makeRolesArray(roles) {
    let rolesArray = [];
    let werewolves = Array(roles.Werewolf).fill("Werewolf");
    let villagers = Array(roles.Villager).fill("Villager");

    rolesArray = werewolves.concat(villagers);

    if (roles.Seer) {
        rolesArray.push("Seer");
    }

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

function getTeammate(players, player) {
    let teammateNames = "";
    let teammateCount = 0;
    players.forEach((teammate) => {
        if (teammate.username !== player.username && teammate.role === player.role) {
            teammateNames += `(${teammate.username})`;
            teammateCount += 1;
        }
    });

    if (teammateCount === 0) {
        teammateNames = "you're a lone werewolf!";
    } else if (teammateCount === 1) {
        teammateNames += " is your teammate";
    } else {
        teammateNames += " are your teammates";
    }
    return teammateNames;
}

function getEveryone(players) {
    let everyone = "";
    let count = 0;
    players.forEach((player) => {
        everyone += `(${emoteKeycaps[count]} ${player.username})`;
        count += 1;
    });

    return everyone;
}

client.on("message", (message) => {
    if (message.channel.type == "dm") {
        message.author.send("You're not supposed to message the bot!").catch((error) => console.log("Dm error, ignore for now."));
        return;
    }

    if (message.content === "test") {
        message.channel
            .send("message1")
            .then((msg) => {
                msg.react(emoteThumb);
                werewolfTimer = setTimeout(function () {
                    console.log("Werewolf times up!");
                    return;
                }, playerTime);
                console.log("message1");
            })
            .then(() => {
                message.channel.send("message2").then(() => {
                    console.log("message2");
                });
            });
    }

    if (message.content === `${prefix}play`) {
        let hostId = message.author.id;
        if (!gameOn) {
            message.channel
                .send(
                    `Welcome to the Werewolf Game! Press the controller to join. Set the roles using "setRoles". Then the host can press the green circle to start.`
                )
                .then((message) => {
                    message.react(emoteJoin).then(() => message.react(emoteStart));

                    message
                        .awaitReactions((reaction, user) => reaction.emoji.name === emoteStart && !user.bot && user.id === hostId, {
                            max: 1,
                            time: 300000,
                            errors: ["time"],
                        })
                        .then((collected) => {
                            const reaction = collected.first();

                            if (reaction.emoji.name === emoteStart) {
                                reaction.message.delete();
                                message.channel.send(`Game start! Players: ${players}`);

                                //assigning roles
                                assignRoles(players);

                                //send roles to each player
                                message.channel.send(`Please check your pm for your role. Game starting in ${playerTime / 1000}s`);
                                players.forEach((player) => {
                                    if (player.role === "Werewolf") {
                                        player.send(`Your role is...${player.role}! And ${getTeammate(players, player)}`);
                                    } else {
                                        player.send(`Your role is...${player.role}`);
                                    }
                                });

                                //Night Falls
                                startGameTimer = setTimeout(function () {
                                    message.channel
                                        .send(`Night falls. Werewolves! Please wake up.`)
                                        .then((message) => {
                                            //if there's a lone wolf in the players, ask him to pick a card in the middle

                                            if (exist.loneWolf) {
                                                players.forEach((player) => {
                                                    if (player.role === "Werewolf") {
                                                        player
                                                            .send(
                                                                `Which of the 3 cards would you like to take a peek? (Timer: ${
                                                                    playerTime / 1000
                                                                }s)`
                                                            )
                                                            .then((dm) => {
                                                                for (let i = 0; i < 3; i++) {
                                                                    dm.react(emoteKeycaps[i]);
                                                                }

                                                                dm.awaitReactions(
                                                                    (reaction, user) =>
                                                                        emoteKeycaps.includes(reaction.emoji.name) && !user.bot && user.id,
                                                                    {
                                                                        max: 1,
                                                                        time: playerTime,
                                                                        errors: ["time"],
                                                                    }
                                                                )
                                                                    .then((collected) => {
                                                                        const wolfReaction = collected.first();

                                                                        if (wolfReaction.emoji.name === emoteKeycaps[0]) {
                                                                            console.log("Wolf picked card 1");
                                                                            dm.reply(`The card is ${deck[deck.length - 3]}`);
                                                                        } else if (wolfReaction.emoji.name === emoteKeycaps[1]) {
                                                                            console.log("Wolf picked card 2");
                                                                            dm.reply(`The card is ${deck[deck.length - 3]}`);
                                                                        } else if (wolfReaction.emoji.name === emoteKeycaps[2]) {
                                                                            console.log("Wolf picked card 3");
                                                                            dm.reply(`The card is ${deck[deck.length - 3]}`);
                                                                        }
                                                                    })
                                                                    .catch((collected) => {
                                                                        console.log(
                                                                            "Time out. No action from the werewolf. Game continues"
                                                                        );
                                                                        dm.reply(`Time out, no action.`);
                                                                    });
                                                            });
                                                    }
                                                });
                                            }
                                        })
                                        .then(() => {
                                            roundTimer = setTimeout(function () {
                                                message.channel
                                                    .send(
                                                        `Seer! Please wake up. You may look at another player's card or two of the center cards.`
                                                    )
                                                    .then((message) => {
                                                        if (exist.Seer) {
                                                            players.forEach((player) => {
                                                                if (player.role === "Seer") {
                                                                    console.log(`${player.username} Hi I'm Seer`);
                                                                }
                                                            });
                                                        } else {
                                                            setTimeout(function () {
                                                                console.log("Werewolf doing nothing");
                                                            }, playerTime);
                                                        }
                                                    });
                                            }, playerTime);
                                        })
                                        .then(() => {
                                            roundTimer = setTimeout(function () {
                                                message.channel.send(`Vote! ${getEveryone(players)}`).then((message) => {
                                                    for (let i = 0; i < players.length; i++) {
                                                        message.react(emoteKeycaps[i]);
                                                    }

                                                    //gather the votes using awaitReaction for 5mins
                                                });
                                            }, playerTime);
                                        })
                                        .catch((error) => {
                                            console.log("What happened?");
                                            console.log(error);
                                        });
                                }, playerTime);
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
            gameOn = true;
        } else {
            message.channel.send("A game already exists. Type -stop to terminate current session.");
        }
    } else if (message.content === `${prefix}players`) {
        console.log(players.map((player) => player.username));
        if (players.length) {
            message.channel.send(players.map((player) => player.username));
        } else {
            message.channel.send("No players.");
        }
    } else if (message.content === `${prefix}stop`) {
        //TODO: add a confirm reaction check
        console.log("game terminated");
        gameOn = false;
        players = [];
        message.channel.send("Game terminated.");
        clearTimeout(startGameTimer);
        clearTimeout(roundTimer);
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
