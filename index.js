require("dotenv").config();
//DiscordJS
const Discord = require('discord.js')
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.MessageContent
  ]
});

// Create a new DisTube
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const distube = new DisTube(client, {
  leaveOnStop: false,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  plugins: [
    new SpotifyPlugin({
      emitEventsAfterFetching: true
    }),
    new SoundCloudPlugin(),
    new YtDlpPlugin()
  ]
});

client.on('ready', () => {
  console.log(`${client.user.tag} has loggged in.`);
});

client.on('message', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(process.env.PREFIX)) return;
  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
  const command = args.shift();

  if (command == 'play') {
    if (!args[0]) {
      return message.channel.send('you must state something to play.');
    }
    if (!message.member.voice.channel) {
      return message.channel.send('You are not in a voice channel.');
    }

    distube.play(message.member.voice.channel, message.options.song, {
      member: message.member,
      textChannel: message.channel,
      message
    });
  }

  if (command == 'stop') {
    distube.stop(message);
    message.channel.send('You have stopped the music.');
  }

  if (command == 'pause') {
    distube.pause(message);
    message.channel.send('Paused!');
  }

  if (command == 'resume') {
    distube.resume(message);
    message.channel.send('Continued!');
  }

  if (command == 'skip') {
    distube.skip(message);
    message.channel.send('Skipped!');
  }

  if (command == 'autoplay') {
    let mode = distube.toggleAutoplay(message);
    const messageToSend = 'Set autoplay mode to `' + (mode ? 'On' : 'Off') + '`';
    return message.channel.send(messageToSend);
  }

  if (['loop', 'repeat'].includes(command)) {
    let mode = distube.setRepeatMode(message, parseInt(args[0]));
    mode = mode ? (mode == 2 ? 'Repeat queue' : 'Repeat song') : 'Off';
    const messageToSend = 'Set repeat mode to `' + mode + '`';
    return message.channel.send(messageToSend);
  }

  if (command == 'queue') {
    let queue = distube.getQueue(message);
    const messageToSend = 'Current queue:\n' + queue.songs.map((song, id) =>
      `**${id + 1}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\``
    ).join('\n');

    return message.channel.send(messageToSend);
  }
});

// Queue status template
const status = queue =>
  `Volume: \`${queue.volume}%\` | Filter: \`${queue.filter || 'Off'}\` | Loop: \`${
    queue.repeatMode ? (queue.repeatMode == 2 ? 'All Queue' : 'This Song') : 'Off'
  }\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``;

// DisTube event listeners
distube
  .on('playSong', (message, queue, song) => {
    const messageToSend = `Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user.tag}`;
    message.channel.send(messageToSend);
  })

  .on('addSong', (message, queue, song) => {
    const messageToSend = `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user.tag}`;
    message.channel.send(messageToSend);
  })

  .on('playList', (message, queue, playlist, song) => {
    const messageToSend = `Play \`${playlist.name}\` playlist (${
      playlist.songs.length
    } songs).\nRequested by: ${song.user.tag}\nNow playing \`${song.name}\` - \`${
      song.formattedDuration
    }\`\n${status(queue)}`;
    
    return message.channel.send(messageToSend);
  })

  .on('addList', (message, queue, playlist) => {
    const messageToSend = `Added \`${playlist.name}\` playlist (${
      playlist.songs.length
    } songs) to queue\n${status(queue)}`;
    
    return message.channel.send(messageToSend);
  })

  // DisTubeOptions.searchSongs = true
  .on('searchResult', (message, result) => {
    let i = 0;
    const messageToSend = `**Choose an option from below**\n${result
        .map(song => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``)
        .join('\n')}\n*Enter anything else or wait 60 seconds to cancel*`;
    return message.channel.send(messageToSend);
  })

  // DisTubeOptions.searchSongs = true
  .on('searchCancel', message => message.channel.send(`Searching canceled`))
  .on('error', (message, e) => {
    console.error(e);
    const messageToSend = 'An error encountered: ' + e;
    message.channel.send(messageToSend);
  });

const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(__dirname + '/'));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './src/index.html'));
});
app.listen(process.env.PORT || 8080);

client.login(process.env.TOKEN);
