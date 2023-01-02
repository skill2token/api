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

  let { indicator, signature, address } = req.body;

  indicator = indicator.toUpperCase();
  address = address.toUpperCase();

  if (indicator == address) {
    res.sendStatus(400);
    console.log("Error #");
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
    console.log("Error #1");
    return;
  }

  if (!is0xAddress(indicator) || !(await isAtJoinedCollection(indicator))) {
    res.sendStatus(400);
    console.log("Error #2");
    return;
  }

  if (typeof signature != typeof "s2t") {
    res.sendStatus(400);
    console.log("Error #3");
    return;
  }

  try {
    const nIndic =
      indicator.substring(0, 1) + "x" + indicator.substring(1 + "x".length);
    const signerAddr = ethers.utils.verifyMessage(nIndic, signature);
    if (signerAddr.toUpperCase() != address) {
      res.sendStatus(400);
      console.log("Error #4");
      return;
    }
  } catch {
    res.sendStatus(400);
    console.log("Error #5");
    return;
  }
  try {
    await joinedCollection.insertOne({
      _id: address,
      whoIndicated: indicator,
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
  } catch {
    res.sendStatus(400);
    console.log("Error #");
    return;
  }
});

app.listen(5500);
console.log("The application is running! :)");
