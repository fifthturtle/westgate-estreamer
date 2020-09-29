// jshint esversion:8

"use strict";

const Hapi = require("@hapi/hapi");
const Path = require("path");
const control = require("./lib/control");

const cors = {
  origin: ["*"],
  headers: [
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Methods",
    "Access-Control-Request-Headers",
    "Origin, X-Requested-With, Content-Type",
    "CORELATION_ID",
  ],
  credentials: true,
};

function getAddress() {
  return new Promise((resolve, reject) => {
    require("dns").lookup(require("os").hostname(), function (err, add, fam) {
      if (err) reject(err);
      else resolve(add);
    });
  });
}

const config = {
  port: 5953,
  routes: {
    cors: true,
    files: {
      relativeTo: Path.join(__dirname, "public"),
    },
  },
};
// */

const init = async () => {
  await getAddress()
    .then((res) => {
      console.log("host address is " + res);
      config.host = "0.0.0.0"; //res;
    })
    .catch((err) => {
      console.log("cannot get ip address");
      return;
    });
  const server = Hapi.server(config);
  await server.register(require("@hapi/inert"));

  server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
      return h.file("index.html");
    },
  });

  server.route({
    method: "GET",
    path: "/api/playAmbient",
    config: {
      cors,
    },
    handler: async (request, h) => {
      control.playAmbient();
      return control.getStatusDescription();
    },
  });

  server.route({
    method: "GET",
    path: "/api/playBigShow",
    config: {
      cors,
    },
    handler: async (request, h) => {
      control.playBigShow();
      return control.getStatusDescription();
    },
  });

  server.route({
    method: "GET",
    path: "/api/stopAll",
    config: {
      cors,
    },
    handler: async (request, h) => {
      control.stopAll();
      return control.getStatusDescription();
    },
  });

  server.route({
    method: "GET",
    path: "/api/disable",
    config: {
      cors,
    },
    handler: async (request, h) => {
      control.disableFountain(parseInt(request.query.d));
      return control.getStatusDescription();
    },
  });

  server.route({
    method: "GET",
    path: "/api/status",
    config: {
      cors,
    },
    handler: async (request, h) => {
      return control.getStatusDescription();
    },
  });

  server.route({
    method: "GET",
    path: "/images/{img}",
    config: {
      cors,
    },
    handler: async (request, h) => {
      return h.file(`images/${request.params.img}.png`);
    },
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
