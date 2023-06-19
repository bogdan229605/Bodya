// Require the necessary discord.js classes
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});
let res = '';
const Api_Key = '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';

client.on('ready', async () => {
  console.log('bot is reaady');

  const channelId = '1120362053815771337';
  const messageId = '1120362434172035172 ';
  const emojiName = '✅';
  //chatGP//
  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.log('Канал не найден');
    return;
  }

  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const targetMessage = messages.get(messageId);

    if (targetMessage) {
      const reaction = targetMessage.reactions.cache.find(r => r.emoji.name === emojiName);

      if (reaction) {
        const reactedUsers = await reaction.users.fetch();
        console.log('Пользователи, поставившие реакцию:');
        reactedUsers.forEach(user => {
          console.log(user.tag);
        });
      } else {
        console.log('Реакция не найдена на указанном сообщении');
      }
    } else {
      console.log('Сообщение не найдено в указанном канале');
    }
  } catch (error) {
    console.log('Ошибка при получении сообщений:', error);
  }

  const PORT = 3000;

  app.post('/completions', async (req, res) => {
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Api_Key}`,

        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: req.body.message }]
      })
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', options);
      const data = await response.json();
      res.send(data);
    } catch (e) {
      console.log('first req = ', e);
    }
  });
  app.listen(PORT, () => {
    console.log('Server is running ' + PORT);
  });
});
const messageHistory = [];
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const emojiName = '✅';
  await message.react(emojiName, { count: false });
  await message.react('❌', { count: false });
  messageHistory.push({ role: 'user', content: message.content });
  if (message.mentions.has(client.user)) {
    const getMessages = async () => {
      const options = {
        method: 'POST',
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messageHistory
        }),
        headers: {
          Authorization: `Bearer ${Api_Key}`,
          'Content-Type': 'application/json'
        }
      };
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', options);
        const data = await response.json();

        res = data.choices[0].message;

        await message.reply(res);
        console.log(messageHistory);
        console.log('уже');
      } catch (e) {
        console.log('getMSG', e);
      }
    };

    getMessages();
  }
});
const messageId = '1120362434172035172';
const FirstroleId = '1120346432088588348';
const SecondRoleId = '687238900137066527';
const channelId = '1120362053815771337';
client.on('messageReactionAdd', async (reaction, user) => {
  if (
    messageId === reaction.message.id &&
    reaction.emoji.name === '✅' &&
    reaction.message.channel.id === channelId
  ) {
    try {
      const guild = reaction.message.guild;
      const member = guild.members.cache.get(user.id);
      const channel = guild.channels.cache.get(channelId);

      if (!member) {
        console.log('Участник не найден');
        return;
      }
      const emojiName = '✅';
      const Firstrole = guild.roles.cache.get(FirstroleId);
      const Secondrole = guild.roles.cache.get(SecondRoleId);

      if (!Firstrole) {
        console.log('Роль не найдена');
        return;
      }

      const existingReactions = reaction.message.reactions.cache.filter(
        r => r.emoji.name === emojiName
      );

      existingReactions.each(async r => {
        return await reaction.users.remove(user.id);
      });

      await member.roles.remove(Firstrole);
      await member.roles.add(Secondrole);

      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: false
      });

      console.log(`Пользователю ${member.user.tag} добавлена роль ${Secondrole.name}`);
    } catch (error) {
      console.log('Ошибка при добавлении роли:', error);
    }
  }
  if (
    messageId === reaction.message.id &&
    reaction.emoji.name === '❌' &&
    reaction.message.channel.id === channelId
  ) {
    const guild = reaction.message.guild;
    const member = guild.members.cache.get(user.id);
    try {
      const existingReactions = reaction.message.reactions.cache.filter(r => r.emoji.name === '❌');

      existingReactions.each(async r => {
        return await reaction.users.remove(user.id);
      });

      await member.ban();
      console.log(`${user.tag} забанен.`);
    } catch (error) {
      console.error(`Ошибка при бане пользователя: ${error}`);
    }
  }
});

// ...

client.login('MTExNDI3NDMxODUzMzI2MzM3Mg.GM3oow.Xb_HL74xZdl0YuaYu73nqcNgFcSMejr1av4zAQ');
