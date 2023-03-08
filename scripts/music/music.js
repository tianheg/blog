const fs = require('fs')
const ejs = require('ejs')
const unescape = require("lodash.unescape");

// http://localhost:3000/playlist/track/all?id=967686417
// 获取我喜欢歌单全部歌曲详情
let songs = []

fs.readFile("./scripts/music/likelist.json", "utf8", (err, data) => {
  if (err) console.log(err);
  const jsonData = JSON.parse(data);
  songs = jsonData.songs.map((song) => {
    if (song.ar.length == 2) {
      return {
        name: song.name,
        artists: `${song.ar[0].name}, ${song.ar[1].name}`,
      };
    }
    if (song.ar.length == 3) {
      return {
        name: song.name,
        artists: `${song.ar[0].name}, ${song.ar[1].name}, ${song.ar[2].name}`,
      };
    }
    return {
      name: song.name,
      artists: song.ar[0].name,
    };
  });
  // console.log(songs)
  ejs.renderFile(
    "./scripts/music/template.ejs",
    { songs },
    { rmWhitespace: true },
    function (err, org) {
      if (err) throw err;
      fs.writeFile("./content/music.org", unescape(org), function (err) {
        if (err) throw err;
        console.log("Org-mode file generated!");
      });
    }
  );
});

