# Skill2Token API

[![Gmail](https://img.shields.io/badge/-Gmail-c14438?style=plastic&logo=Gmail&logoColor=white)](mailto:contact@skill2token.com)

## Index

- [Run the Project](#run-the-project)
- [Run Tests](#run-tests)
- [API Explanation](#api-explanation)
- [Style Practices](#style-practices)

### Run the Project

- Create a `.env` file in the folder, and add a variable name `MONGO_URI` containing your access string to the `MongoDB` database.
- To install all the project's dependencies and then run the server, run the following commands:

```console
npm install
npm start
```

- To create a production build, run `npm run build`.

### Run Tests

#### ⚠️ WIP ⚠️

### API Explanation

#### Whitelist Endpoint

- This `POST` API endpoint is used to join the whitelist line.
- It receives 3 required parameters:
  - `indicator`, the person who indicated the one subscribing.
  - `signature`, is the signature of the indicator address by the person subscribing.
  - `address`, the address of the person subscribing.
  - `tokenType` the type of the discord access token.
  - `accessToken` the discord access token.
- There are some rules to follow when using this API:
  - None of those variables can be `null` or `undefined`.
  - Signature has to be a valid signature with precisely the `indicator` address as the message.
  - All of the variables have to be `strings`.
  - `indicator` and `address` have to be valid `Ethereum` addresses.
- There are as well some enviroment variables needed to run the application:
  - `MONGO_URI` is the url for accessing the MongoDB database as an admin.
  - `BOT_TOKEN` is the discord bot token used to invite users into the server and add roles to them.
  
### Style Practices
  
- Try to follow [Google typescript practices](https://google.github.io/styleguide/tsguide.html) as much as you can.
- Before committing any changes, it's important to use the command `npx prettier --write .`, to adequate indentation, among other things, to the rest of the project.
