"use strict";

const Router = require("koa-router");
const Sequelize = require("sequelize");
const squel = require("squel").useFlavour("postgres");
const router = new Router();

//////
// DB HELPERS
//////

//----- HELPERS

// add double quote around field names
// • quotation.customerId => "quotation"."customerId"
// • for POSTGRE to be happy
const fieldReg = /([a-zA-Z]*)\.([a-zA-Z]*)/g;
const quote = txt => txt.replace(fieldReg, `"$1"."$2"`);
// make a sequelize literal for Sequelize to be happy :D
// • and also wrap the query inside parenthesis
const toLiteral = query => Sequelize.literal(`(${query.toString()})`);

//----- SUB-QUERIES

const ITEM_RELATION = quote(`item.basketId = basket.id`);
const ITEM_ALIAS = [`items`, `item`];

const COUNT_ITEMS = squel
  // don't use squel `autoQuoteAliasNames`
  // • isn't reliable enough for our sub-queries
  .select({ autoQuoteAliasNames: false })
  .field(`COUNT(*)`)
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
    include: [Basket.Items]
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
      ]
    },
    include: [Basket.Items]
  });
  ctx.body = basket;
});

module.exports = router;
