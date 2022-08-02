require("dotenv").config();

import { ethers } from "ethers";

const cors = require("cors");

import express from "express";
const app = express();

const { MongoClient } = require("mongodb");
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const database = client.db("whitelist");
const indicatorsCollection = database.collection("indicators");
const joinedCollection = database.collection("joined");

app.use(cors());
app.use(express.json());
app.post("/whitelist", async function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");

  const { indicator, signature, address } = req.body;

  const isAtJoinedCollection = async (id: string) => {
    return await joinedCollection.findOne({ _id: id });
  };

  const isAtIndicatorCollection = async (id: string) => {
    return await indicatorsCollection.findOne({ _id: id });
  };

  const is0xAddress = (address: any) => {
    return ethers.utils.isAddress(address) && address.startsWith("0X");
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

  try {
    const signerAddr = ethers.utils.verifyMessage(indicator, signature);
    if (signerAddr.toUpperCase() != address.toUpperCase()) {
      res.sendStatus(400);
      return;
    }
  } catch {
    res.sendStatus(400);
    return;
  }
  try {
    await joinedCollection.insertOne({
      _id: address.toUpperCase(),
      whoIndicated: indicator.toUpperCase(),
    });
    if (await isAtIndicatorCollection(indicator)) {
      await indicatorsCollection.findOneAndUpdate(
        { _id: indicator.toUpperCase() },
        { $inc: { howManyIndicated: 1 } }
      );
      res.sendStatus(201);
      return;
    } else {
      await indicatorsCollection.insertOne({
        _id: indicator.toUpperCase(),
        howManyIndicated: 1,
      });
      res.sendStatus(201);
      return;
    }
  } catch {
    res.sendStatus(400);
    return;
  }
});

app.listen(5500);
console.log("The application is running! :)");
