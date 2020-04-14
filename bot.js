const Discord = require("discord.js");
const { prefix, token } = require("../config.json");
const allRoles = ["Werewolf", "Villager", "Seer", "Witch", "Hunter"];
let roles = { werewolf: 0, villager: 0 };
const client = new Discord.Client();

console.log(token);

let emoteJoin = "🎮";
let emoteStart = "🟢";
let emoteThumb = "👌";

client.once("ready", () => {
    console.log("Ready!");
});

client.once("reconnecting", () => {
    console.log("Reconnecting!");
});

client.once("disconnect", () => {
    console.log("Disconnect!");
});

let gameOn = false;
let players = [];

//this assign the availables roles in the most balance manner
function assignRoles(players) {
    players.map((player) => {
        player.role = "Villager";
    });
}

client.on("message", (message) => {
    if (message.channel.type == "dm") {
        message.author.send("You are DMing me now!").catch((error) => console.log("Dm error, ignore for now."));
        return;
    }

    if (message.content === `${prefix}play`) {
        if (!gameOn) {
            message.channel
                .send("Welcome to the Werewolf Game! Press the controller to join. Then press the green circle to start.")
                .then((message) => {
                    message.react(emoteJoin).then(() => message.react(emoteStart));
                    const filter = (reaction, user) => {
                        return reaction.emoji.name === emoteStart && !user.bot && user.id === message.author.id; //TODO: test only the host can start game
                    };

                    message
                        .awaitReactions(filter, { max: 1, time: 300000, errors: ["time"] })
                        .then((collected) => {
                            const reaction = collected.first();

                            //change conditon to (reaction.emoji.name === emoteStart && players.length > 3)
                            if (reaction.emoji.name === emoteStart) {
                                message.channel.send(`Game start! Players: ${players}`);
                                //assigning roles
                                assignRoles(players);
                                //send roles to each player

                                message.channel.send(`Please check your pm for your role. Game starting in 15s`);
                                players.map((player) =>
                                    player.send(`Your role is...${player.role}`).then((dm) => {
                                        dm.react(emoteThumb);
                                    })
                                );
                            } else {
                                message.channel.send(`Not enough players. Must be 4 or more. Game terminated`);
                            }
                        })
                        .catch((collected) => {
                            console.log("No action after 5mins");
                            console.log("game terminated");
                            gameOn = false;
                            players = [];
                            message.channel.send("Game terminated.");
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
    } else if (message.content === `${prefix}help`) {
        message.channel.send(
            "The roles are [Werewolf, Villager, Seer, Witch, Hunter], use the command -add <role> to add any of the unique role to the game. If not specified, the game will only have Villagers and Werewolves."
        );
    } else if (message.content === `${prefix}playerRoles`) {
        if (gameOn) {
            if (players[0].role) {
                //players.map((player) => message.channel.send(`${player.username}'s role is...${player.role}`));
                console.log(players.map((player) => message.channel.send(`${player.username}'s role is...${player.role}`)));
            } else {
                message.channel.send("Players roles haven't been set yet. Start the game to assign roles");
            }
        } else {
            console.log("No existing game. Start a game to use this function");
        }
    }
});

client.on("messageReactionAdd", (reaction, user) => {
    if (reaction.emoji.name === emoteJoin && !user.bot) {
        console.log(`${user.username} was added. id: ${user.id}`);
        let { id, username } = user;
        let player = { id: id, username: username };
        players.push(player);
    } else if (reaction.emoji.name === emoteThumb && !user.bot) {
        console.log("Reaction get!");
        setTimeout(function () {
            console.log("I appear after 3s!");
        }, 3000);
    }
    // } else if (reaction.emoji.name === emoteStart && !user.bot) {
    //     console.log("game start!");
    //     reaction.message.delete();
    // }
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
