// jshint: esversion:8

const SerialPort = require("serialport");
const fs = require("fs-extra");
const axios = require("axios");

const port = new SerialPort("COM3");

/*
const port = {
  write(data) {
    console.log("port", data);
  },
};
// */

const NOTHING = 0;
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

let statusIndex = 0;
const status = {
  night: false,
  status: statusDescription[statusIndex],
  disabled: false,
  sunset: {},
};
const shows = JSON.parse(fs.readFileSync("./data/shows.json").toString());

function getNightStatus() {
  const sunsetURL = `https://api.sunrise-sunset.org/json?lat=3.5446883&lng=-112.27394679999999&formatted=0`;
  axios
    .get(sunsetURL)
    .then((res) => {
      const sunset = new Date(res.data.results.sunset);
      const sunrise = new Date(res.data.results.sunrise);
      const d = new Date();
      status.sunset.hours = sunset.getHours();
      status.sunset.minutes = sunset.getMinutes();
      status.sunset.display =
        [fh(status.sunset.hours), ft(status.sunset.minutes)].join(":") + " PM";
      status.night = d < sunrise || d > sunset;
    })
    .catch((err) => {
      console.log(err);
    });
}

function setStatus(n) {
  statusIndex = n;
  status.status = statusDescription[statusIndex];
}

function sendCommand(cmd, show = 1) {
  show = show.toString();
  while (show.length < 3) show = "0" + show;
  const toSend = `H-${cmd}${show}`;
  console.log(toSend);
  port.write(toSend, (err) => {
    console.log("port error");
  });
}

function playShow(show) {
  let cmd = show.song ? PLAY_ONCE : PLAY_LOOP;
  let showNum = status.night ? show.night : show.day;
  sendCommand(cmd, showNum);
}

function playAmbient() {
  if (statusIndex === BIG_SHOW) return;
  if (status.disabled) return;
  stopAll();
  setTimeout(() => {
    playShow(shows[0]);
    setStatus(AMBIENT);
  }, 3000);
}

function playBigShow() {
  if (status.disabled) return;
  if (statusIndex === BIG_SHOW) return;
  stopAll();
  setTimeout(() => {
    playShow(shows[1]);
    setStatus(BIG_SHOW);
  }, 3000);
}

function stopAll() {
  setStatus(NOTHING);
  sendCommand(STOP_ALL);
  setTimeout(() => {
    sendCommand(PLAY_ONCE, NULL_SHOW);
  }, 1000);
}

function disableFountain(disable = true) {
  console.log(disable ? "Fountain is disabled" : "Fountain is enabled");
  status.disabled = disable;
  if (status.disabled) stopAll();
}

function ft(n, len = 2) {
  n = n.toString();
  while (n.length < len) n = `0${n}`;
  return n;
}

function fh(n) {
  if (!n) return 12;
  if (n > 12) return n - 12;
}

//*
port.on("data", (data) => {
  const buffer = Buffer.from(data).toJSON();
  console.log("Buffer", buffer);
});
// */

function checkTime() {
  const d = new Date();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const dow = d.getDay();
  const ampm = hours >= 12 ? "PM" : "AM";
  const stopHour = dow === 0 || dow === 6 ? 2 : 0;
  status.time = {
    hours,
    minutes,
    seconds,
    dow,
    display: [fh(hours), ft(minutes), ft(seconds)].join(":") + ` ${ampm}`,
  };
  if (seconds) return;
  if (hours === 11 && minutes === 0) {
    status.night = false;
    playAmbient();
  }
  if (hours === status.sunset.hours && minutes === status.sunset.minutes) {
    status.night = true;
    if (statusIndex === AMBIENT) playAmbient();
  }
  if (hours === stopHour && minutes === 1) stopAll();
  if (hours === 4 && minutes === 30) getNightStatus();
}

getNightStatus();
checkTime();
setInterval(checkTime, 1000);

module.exports = {
  shows() {
    return shows;
  },
  playShow,
  playAmbient,
  playBigShow,
  stopAll,
  disableFountain,
  getStatusDescription() {
    return status;
  },
};
