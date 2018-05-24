"use strict";

const Router = require("koa-router");
const Sequelize = require("sequelize");
const squel = require("squel").useFlavour("postgres");
const router = new Router();

//////
// DB HELPERS
//////

//----- HELPERS

// for POSTGRE to be happy
// add double quote around field names
// • quotation.customerId => "quotation"."customerId"
const fieldReg = /([a-zA-Z]*)\.([a-zA-Z]*)/g;
const quote = txt => txt.replace(fieldReg, `"$1"."$2"`);
// make a Sequelize literal for Sequelize to be happy :D
// • and also wrap the query inside parenthesis
//   or the AS will fail
const toLiteral = query => Sequelize.literal(`(${query.toString()})`);

//----- SUB-QUERIES

const ITEM_RELATION = quote(`item.basketId = basket.id`);
const ITEM_ALIAS = [`items`, `item`];

const COUNT_ITEMS = squel
  // don't use squel `autoQuoteAliasNames`
  // • isn't reliable enough for our sub-queries
  .select({ autoQuoteAliasNames: false })
  // force integer on count
  .field(`CAST(COUNT(*) AS int)`)
  .where(ITEM_RELATION)
  .from(...ITEM_ALIAS);

const SUM_ITEMS = squel
  .select({ autoQuoteAliasNames: false })
  .field(quote(`SUM(item.price)`))
  .where(ITEM_RELATION)
  .from(...ITEM_ALIAS);

//////
// ROUTING
//////

router.get(`/`, async (ctx, next) => {
  const { Basket } = ctx;
  const basket = await Basket.findOne({
    where: { name: `fruits` },
    attributes: {
      exclude: [
        `createdAt`, `updatedAt`,
      ]
    },
    include: [{
      association: Basket.Items,
      attributes: [`id`, `name`, `price`],
    }]
  });
  ctx.body = basket;
});

router.get(`/count-and-sum`, async (ctx, next) => {
  const { Basket } = ctx;
  const basket = await Basket.findOne({
    where: { name: `fruits` },
    attributes: {
      include: [
        [toLiteral(COUNT_ITEMS), `itemsCount`],
        [toLiteral(SUM_ITEMS), `totalPrice`]
      ],
      exclude: [
        `createdAt`, `updatedAt`,
      ]
    },
    include: [{
      association: Basket.Items,
      attributes: [`id`, `name`, `price`],
    }]
  });
  ctx.body = basket;
});

module.exports = router;
