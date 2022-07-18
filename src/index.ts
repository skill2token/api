require("dotenv").config();

import { ethers } from "ethers";

const cors = require("cors");

import express from "express";
const app = express();

const { MongoClient } = require("mongodb");
const MONGO_URL = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URL, {
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

  if (
    typeof address != typeof "s2t" ||
    !ethers.utils.isAddress(address) ||
    (await joinedCollection.findOne({ _id: address.toUpperCase() }))
  ) {
    res.sendStatus(400);
    return;
  }

  if (
    typeof indicator != typeof "s2t" ||
    !ethers.utils.isAddress(indicator) ||
    indicator.toUpperCase() == address.toUpperCase() ||
    !(await joinedCollection.findOne({ _id: indicator.toUpperCase() }))
  ) {
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
    if (
      !(await indicatorsCollection.findOne({ _id: indicator.toUpperCase() }))
    ) {
      await indicatorsCollection.insertOne({
        _id: indicator.toUpperCase(),
        howManyIndicated: 1,
      });
      res.sendStatus(201);
      return;
    } else {
      await indicatorsCollection.findOneAndUpdate(
        { _id: indicator.toUpperCase() },
        { $inc: { howManyIndicated: 1 } }
      );
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
