"use strict";

const Router = require("koa-router");
const Sequelize = require("sequelize");
const squel = require("squel").useFlavour("postgres");
const router = new Router();

//////
// USING RELATIONS
//////

router.get(`/`, async (ctx, next) => {
  const { Basket } = ctx;
  const baskets = await Basket.findAll({
    include: [Basket.Items]
  });
  const result = baskets.map(basket => {
    const withCount = basket.toJSON();
    withCount.itemsCount = withCount.items.length;
    withCount.totalPrice = withCount.items.reduce(
      (total, item) => total + item.price,
      0
    );
    delete withCount.items;
    return withCount;
  });
  ctx.body = result;
});

//////
// SUB-QUERIES
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
const toLiteral = query => Sequelize.literal(`(${quote(query.toString())})`);

//----- SQUEL

const ITEM_RELATION = `item.basketId = basket.id`;
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
  .field(`SUM(item.price)`)
  .where(ITEM_RELATION)
  .from(...ITEM_ALIAS);

//----- ROUTE

router.get(`/sub-queries`, async (ctx, next) => {
  const { Basket } = ctx;
  const basket = await Basket.findAll({
    attributes: {
      include: [
        [toLiteral(COUNT_ITEMS), `itemsCount`],
        [toLiteral(SUM_ITEMS), `totalPrice`]
      ]
    }
  });
  ctx.body = basket;
});

//----- SQUEL WITH A LEANER WRITING

const subQuery = ({ field, parent, relation }) => {
  return toLiteral(
    squel
      .select({ autoQuoteAliasNames: false })
      .field(field)
      .where(`${relation}.${parent}Id = ${parent}.id`)
      .from(`${relation}s`, relation)
  );
};

const GENERATED_COUNT = subQuery({
  field: `CAST(COUNT(*) AS int)`,
  parent: `basket`,
  relation: `item`
});

const GENERATED_SUM = subQuery({
  field: `SUM(item.price)`,
  parent: `basket`,
  relation: `item`
});

router.get(`/generated-sub-queries`, async (ctx, next) => {
  const { Basket } = ctx;
  const basket = await Basket.findAll({
    attributes: {
      include: [[GENERATED_COUNT, `itemsCount`], [GENERATED_SUM, `totalPrice`]]
    }
  });
  ctx.body = basket;
});

module.exports = router;
