# sequelize-example

a small sequelize example with sub-queries

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [prerequisite](#prerequisite)
- [run the demo](#run-the-demo)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## prerequisite

- [node js](https://nodejs.org/en/) >= 8.11.2
- [PostgreSQL](https://www.postgresql.org/) >=9.6 
  - create a clean __sequelize-example__ database
  - [postgresapp](http://postgresapp.com/) on a mac
  - [postico](https://eggerapps.at/postico/) to visualize

## run the demo

```
yarn install && yarn start
```

All routes will render the same result but handled in a different way :)

- http://localhost:3000/baskets
- http://localhost:3000/baskets/squel
- http://localhost:3000/baskets/generated-squel

## tweaking the configuration

This app use [rc](https://www.npmjs.com/package/rc) for handling configuration

Just duplicate `.sequelizeexample-example` to `.sequelizeexample` and change the values:

- `database`: the full url of your database
  *default*: `postgres://localhost:5432/sequelize-example`
- `logQuery`: if you want to print the SQL queries
  *default*: `false`
