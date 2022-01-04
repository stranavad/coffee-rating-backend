const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

// Mysql connection
const pool = mysql.createPool({
	host: "139.162.161.156",
	user: "root",
	password: "<Code><Tech> 127521",
	database: "coffee_rating",
	connectionLimit: 5,
});

module.exports = pool;


// routes imports
const coffees = require("./view/coffees");
const currentCoffee = require("./view/currentCoffee");
const ratings = require("./view/ratings");
const users = require("./view/users");

// Coffees
app.use("/coffees", coffees);
// Current Coffee
app.use("/current-coffee", currentCoffee);
// Ratings
app.use("/ratings", ratings);
// Users
app.use("/user", users);

app.listen(3000);

