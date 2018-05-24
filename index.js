"use strict";

const chalk = require("chalk");
const Koa = require("koa");
const rc = require("rc");
const json = require("koa-json");

//////
// SERVER CONFIG
//////
const config = rc(`sequelizeexample`, {
  database: `postgres://localhost:5432/sequelize-example`,
  logQuery: false
});

config.PORT = config.PORT || process.env.PORT || 3000;
config.NODE_ENV = config.NODE_ENV || process.env.NODE_ENV || `development`;

const app = new Koa();
app.use(json());

// error middleware
app.use(async function handleError(ctx, next) {
  try {
    await next();
  } catch (error) {
    ctx.status = error.statusCode || error.status || 500;
    ctx.body = error;
    ctx.app.emit(`error`, error, ctx);
  }
});

//////
// DB CONFIG
//////

const Sequelize = require("sequelize");
const formattor = require("formattor");

// Aliases all operators to the equivalent Symbols
// see comment on the new connection
const operatorsAliases = {};
Object.entries(Sequelize.Op).forEach(([key, value]) => {
  operatorsAliases[`$${key}`] = value;
});

function logFormattedQuery(query) {
  console.log(formattor(query, { method: "sql" }));
}

const sequelize = new Sequelize(config.database, {
  logging: config.logQuery ? logFormattedQuery : false,
  // remove sequelize deprecation warnings
  // https://github.com/sequelize/sequelize/issues/8417#issuecomment-341617577
  // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators-security
  operatorsAliases
});

const Basket = sequelize.define(`basket`, {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING
  }
});

const Item = sequelize.define(`item`, {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING
  },
  price: {
    type: Sequelize.FLOAT,
    allowNull: false
  }
});

Item.Basket = Item.belongsTo(Basket);
Basket.Items = Basket.hasMany(Item);

// expose models to koa context

app.context.Basket = Basket;
app.context.Item = Item;

//////
// ROUTING
//////

const router = require("./router");

app.use(router.routes());
app.use(router.allowedMethods());

//////
// BOOT
//////

const getPort = require("get-port");

sequelize
  .authenticate()
  .then(() => {
    console.log(chalk.green(`[DATABASE] connection ok`));
    return sequelize.sync({
      force: true
    });
  })
  .then(() => {
    return Basket.create(
      {
        name: `fruits`,
        items: [
          {
            name: `apples`,
            price: 20
          },
          {
            name: `bananas`,
            price: 35
          }
        ]
      },
      {
        include: [Basket.Items]
      }
    );
  })
  .then(() => {
    return getPort({ port: config.PORT });
  })
  .then(port => {
    const server = app.listen(port, (error, stream) => {
      if (error) {
        console.log(`[SERVER] error`);
        return console.log(error);
      }
      console.log(
        chalk.green(`[SERVER] running`),
        `on port`,
        chalk.cyan(port),
        `on mode`,
        chalk.cyan(config.NODE_ENV)
      );
    });
  })
  .catch(error => {
    console.log(
      chalk.red(`[DATABASE] connection error. Is a postgreSQL DB is running?`)
    );
    console.log(error);
  });
