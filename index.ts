import http from "http";
import serveIndex from 'serve-index';
import express from "express";
import cors from "cors";
import path from 'path';
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import nodeSassMiddleware from "node-sass-middleware";
// import socialRoutes from "@colyseus/social/express"

import { GameRoom } from "./rooms/GameRoom";

const port = Number(process.env.PORT || 7777);
const app = express()

app.use(cors());
app.use(express.json())

const server = http.createServer(app);
const gameServer = new Server({
  server,
  express: app
});

app.use(
  nodeSassMiddleware({
    src: __dirname + '/sass',
    dest: __dirname + '/static',
    debug: true
  })
);

// register your room handlers
gameServer.define('kings', GameRoom).enableRealtimeListing();

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);

app.use('/', express.static(path.join(__dirname, "static")));

app.route('/')
      .get((req, res) => {
        res.sendFile(__dirname + '/static/gameroom.html');
});

app.route('/help')
      .get((req, res) => {
        res.sendFile(__dirname + '/static/help.html');
});

// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${ port }`)
