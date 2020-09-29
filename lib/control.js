const SerialPort = require("serialport");
const fs = require("fs-extra");

const port = new SerialPort("COM3");

const AMBIENT = 1;
const BIG_SHOW = 2;
const MAINTENANCE = 4;
const PLAY_LOOP = 1;
const PLAY_ONCE = 6;
const STOP_ALL = 5;
const NULL_SHOW = 45;
const statusDescription = [
  "Nothing",
  "Ambient",
  "Big Show",
  "Song/Show",
  "Maintenance",
];

let night = false;
const shows = JSON.parse(fs.readFileSync("./data/shows.json").toString());

function sendCommand(cmd, show = 1) {
  show = show.toString();
  while (show.length < 3) show = "0" + show;
  let toSend = "H-" + cmd + show;
  port.write(toSend, (err) => {});
}

function playShow(show) {
  let cmd = show.song ? PLAY_ONCE : PLAY_LOOP;
  let showNum = night ? show.night : show.day;
  sendCommand(cmd, showNum);
}

port.on("data", (data) => {
  const buffer = Buffer.from(data).toJSON();
  console.log("Buffer", buffer);
});
