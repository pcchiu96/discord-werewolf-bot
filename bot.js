const Discord = require("discord.js");
const { prefix, token } = require("../config.json");
const werewolf = require("./commands/werewolf");

const client = new Discord.Client();

client.once("ready", () => {
    console.log("Ready!");
});

client.once("reconnecting", () => {
    console.log("Reconnecting!");
});

client.once("disconnect", () => {
    console.log("Disconnect!");
});

client.on("message", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot || message.channel.type == "dm") return;

    const args = message.content.slice(prefix.length + 1).split(/ +/); //including space
    const command = args.shift().toLowerCase();

    if (werewolf[command]) {
        werewolf[command](message, args);
    }
});

client.on("messageReactionAdd", (reaction, user) => {
    werewolf.addPlayer(reaction, user);
});

client.on("messageReactionRemove", (reaction, user) => {
    werewolf.removePlayer(reaction, user);
});

client.login(token);
