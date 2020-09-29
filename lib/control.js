// jshint: esversion:8

const SerialPort = require("serialport");
const fs = require("fs-extra");

const port = new SerialPort("COM3");

/*
const port = {
  write(data) {
    console.log("port", data);
  },
};
// */

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
let statusIndex = 0;

function sendCommand(cmd, show = 1) {
  show = show.toString();
  while (show.length < 3) show = "0" + show;
  let toSend = "H-" + cmd + show;
  port.write(toSend, (err) => {
    console.log("port error");
  });
}

function playShow(show) {
  let cmd = show.song ? PLAY_ONCE : PLAY_LOOP;
  let showNum = night ? show.night : show.day;
  sendCommand(cmd, showNum);
}

function playAmbient() {
  if (statusIndex === BIG_SHOW) return;
  stopAll();
  setTimeout(() => {
    playShow(shows[0]);
    statusIndex = AMBIENT;
  }, 3000);
}

function playBigShow() {
  stopAll();
  setTimeout(() => {
    playShow(shows[1]);
    statusIndex = BIG_SHOW;
  }, 3000);
}

function stopAll() {
  statusIndex = 0;
  sendCommand(STOP_ALL);
  setTimeout(() => {
    sendCommand(PLAY_ONCE, NULL_SHOW);
  }, 1000);
}

/*
port.on("data", (data) => {
  const buffer = Buffer.from(data).toJSON();
  console.log("Buffer", buffer);
});
// */

function checkTime() {
  const d = new Date();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  if (hours === 11 && minutes === 0) {
    night = false;
    playAmbient();
  }
  if (hours === 18 && minutes === 32) {
    night = true;
    playAmbient();
  }
  if (hours === 0 && minutes === 0) {
    stopAll();
  }
}

checkTime();
setInterval(checkTime, 1000 * 60);

module.exports = {
  shows() {
    return shows;
  },
  playShow,
  playAmbient,
  playBigShow,
  stopAll,
  getStatusDescription() {
    const status = statusDescription[statusIndex];
    return { status };
  },
};
