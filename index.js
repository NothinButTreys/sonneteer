require('dotenv').config();
//DiscordJS
const Discord = require('discord.js');
const client = new Discord.Client();

//DisTube
const DisTube = require('distube');
const distube = new DisTube(client, { searchSongs: false, omitNewSongsOnly: true });

client.on('ready', () => {
  console.log(`${client.user.tag} has loggged in.`);
});

client.on('message', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(process.env.PREFIX)) return;
  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
  const command = args.shift();

  // Queue status template
  const status = queue =>
    `Volume: \`${queue.volume}%\` | Filter: \`${queue.filter || 'Off'}\` | Loop: \`${
      queue.repeatMode ? (queue.repeatMode == 2 ? 'All Queue' : 'This Song') : 'Off'
    }\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``;

  // DisTube event listeners, more in the documentation page
  distube
    .on('playSong', (message, queue, song) =>
      message.channel.send(
        `Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user.tag}`
      )
    )
    .on('addSong', (message, queue, song) =>
      message.channel.send(
        `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user.tag}`
      )
    )
    .on('playList', (message, queue, playlist, song) =>
      message.channel.send(
        `Play \`${playlist.name}\` playlist (${
          playlist.songs.length
        } songs).\nRequested by: ${song.user.tag}\nNow playing \`${song.name}\` - \`${
          song.formattedDuration
        }\`\n${status(queue)}`
      )
    )
    .on('addList', (message, queue, playlist) =>
      message.channel.send(
        `Added \`${playlist.name}\` playlist (${
          playlist.songs.length
        } songs) to queue\n${status(queue)}`
      )
    )
    // DisTubeOptions.searchSongs = true
    .on('searchResult', (message, result) => {
      let i = 0;
      message.channel.send(
        `**Choose an option from below**\n${result
          .map(song => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``)
          .join('\n')}\n*Enter anything else or wait 60 seconds to cancel*`
      );
    })
    // DisTubeOptions.searchSongs = true
    .on('searchCancel', message => message.channel.send(`Searching canceled`))
    .on('error', (message, e) => {
      console.error(e);
      message.channel.send('An error encountered: ' + e);
    });

  if (command == 'play') {
    if (!args[0]) {
      return message.channel.send('you must state something to play.');
    }
    if (!message.member.voice.channel) {
      return message.channel.send('You are not in a voice channel.');
    }

    distube.play(message, args.join(' '));
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
    message.channel.send('Set autoplay mode to `' + (mode ? 'On' : 'Off') + '`');
  }

  if (['loop', 'repeat'].includes(command)) {
    let mode = distube.setRepeatMode(message, parseInt(args[0]));
    mode = mode ? (mode == 2 ? 'Repeat queue' : 'Repeat song') : 'Off';
    message.channel.send('Set repeat mode to `' + mode + '`');
  }

  if (command == 'queue') {
    let queue = distube.getQueue(message);
    message.channel.send(
      'Current queue:\n' +
        queue.songs
          .map(
            (song, id) =>
              `**${id + 1}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\``
          )
          .join('\n')
    );
  }
});

var express = require('express');
var app = express();
var path = require('path');

app.use(express.static(__dirname + '/'));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './src/index.html'));
});
app.listen(process.env.PORT || 8080);

client.login(process.env.TOKEN);
