require("dotenv").config();

import { ethers } from "ethers";

const cors = require("cors");

import express from "express";
const app = express();

const { request } = require("undici");

const { MongoClient } = require("mongodb");
const MONGO_URI = process.env.MONGO_URI;
const botToken = process.env.BOT_TOKEN;
const client = new MongoClient(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const port = 5500;
const guildId = "997897262942400542";
const roleId = "1060973992778936330";
const database = client.db("whitelist");
const indicatorsCollection = database.collection("indicators");
const joinedCollection = database.collection("joined");

app.use(cors());
app.use(express.json());

app.post("/whitelist", async function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");

  let { indicator, signature, address, tokenType, accessToken } = req.body;
  //#region ETH Verifications
  indicator = indicator.toUpperCase();
  address = address.toUpperCase();

  if (indicator == address) {
    res.sendStatus(400);
    return;
  }

  const isAtJoinedCollection = async (id: string) => {
    if (id == "0X0000000000000000000000000000000000000000") {
      return true;
    }
    return await joinedCollection.findOne({ _id: id });
  };

  const isAtIndicatorCollection = async (id: string) => {
    return await indicatorsCollection.findOne({ _id: id });
  };

  const is0xAddress = (address: any) => {
    const nAddr =
      address.substring(0, 1) + "x" + address.substring(1 + "x".length);
    return ethers.utils.isAddress(nAddr) && address.startsWith("0X");
  };

  if (!is0xAddress(address) || (await isAtJoinedCollection(address))) {
    res.sendStatus(400);
    return;
  }

  if (!is0xAddress(indicator) || !(await isAtJoinedCollection(indicator))) {
    res.sendStatus(400);
    return;
  }

  if (typeof signature != typeof "s2t") {
    res.sendStatus(400);
    return;
  }
  //#endregion
  //#region Discord Verifications
  try {
    const user = await request("https://discord.com/api/users/@me", {
      method: "GET",
      headers: {
        authorization: `${tokenType} ${accessToken}`,
      },
    });
    if (user.statusCode != 200) {
      res.sendStatus(user.statusCode);
      return;
    }
    const userBody = await user.body.json();
    const dcId = userBody.id;
    if (await joinedCollection.findOne({ discordId: dcId })) {
      res.sendStatus(400);
      return;
    }
    const enterGuild = await request(
      `https://discord.com/api/guilds/${guildId}/members/${dcId}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
        }),
      }
    );
    if (enterGuild.statusCode != 201 && enterGuild.statusCode != 204) {
      res.sendStatus(enterGuild.statusCode);
      return;
    }
    const addRole = await request(
      `https://discord.com/api/guilds/${guildId}/members/${dcId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (addRole.statusCode != 204) {
      res.sendStatus(addRole.statusCode);
      return;
    }
    //#endregion
    const nIndic =
      indicator.substring(0, 1) + "x" + indicator.substring(1 + "x".length);
    const signerAddr = ethers.utils.verifyMessage(nIndic, signature);
    if (signerAddr.toUpperCase() != address) {
      res.sendStatus(400);
      return;
    }
    await joinedCollection.insertOne({
      _id: address,
      whoIndicated: indicator,
      discordId: dcId,
    });
    if (await isAtIndicatorCollection(indicator)) {
      await indicatorsCollection.findOneAndUpdate(
        { _id: indicator },
        { $inc: { howManyIndicated: 1 } }
      );
      res.sendStatus(201);
      return;
    } else {
      await indicatorsCollection.insertOne({
        _id: indicator,
        howManyIndicated: 1,
      });
      res.sendStatus(201);
      return;
    }
  } catch (error) {
    res.sendStatus(400);
    return;
  }
});

app.listen(port);
console.log("The application is running! :)");
