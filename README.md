# Overview

This Werewolf bot is very similar to the wild known One Night Ultimate Werewolf. This bot is meant to replace the narrator so all players get to participate and enjoy deceiving and working their brains out.

The game must have 1 role card for each player plus 3 extra role cards before starting the game. The 3 extra role cards will be in the middle facing down, but since this is done over discord, it'll simply be hidden from everyone.

As the game title suggests, the game will only have one night for everyone to act their roles. When the night is over, the village team must vote out a werewolf in a finite time discussion time limit (default 2mins), otherwise, werewolves win.

Each role action and description will be dm to each player during the night. Players can then do their actions by reacting to the bot's message emojis.

# Roles/Rule

The full detail of each roles and complete game rule can be found in the official game manual [Rules](https://www.fgbradleys.com/rules/rules2/OneNightUltimateWerewolf-rules.pdf).

# Setup

1. Install [Node.js and npm](https://www.npmjs.com/get-npm).
2. Create your own bot and get your bot token & client id in [Discord Developers website](https://discord.com/developers/applications/).
   ...Detailed steps to create your own bot can be found in [discordjs.guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot).
3. Add your bot to servers using bot invite links. Paste the link "https://discord.com/oauth2/authorize?client_id=i_am_an_example_client_id&scope=bot" in your desired browser and change value after the "client_id=" to your bot client id from [Discord Developers website](https://discord.com/developers/applications/).
4. Add the bot token to the config.json file where it says "token" : "bot token here".
5. Run the bot by navigating to this folder on your computer in either terminal or cmd and run "node ." command.

# Commands

-   prefix werewolf - starts the game with welcome message in the message channel.
-   prefix join - adds user to the game.
-   prefix leave - removes user from the game.
-   prefix players - shows all the players that have joined the game.
-   prefix roles - shows a list of game roles that are selected.
-   prefix add - this adds game roles to game.
    "prefix add werewolf" will add a werewolf card to the game.
    "prefix add villager villager" will add two villager cards to the game.
-   prefix remove is exactly like add command but removes role cards from the game.
-   prefix stop - terminates the game and removes all joined players.
-   prefix again - play again with the same roles and players after a game has ended.
-   prefix skip - skips the discussion time.
