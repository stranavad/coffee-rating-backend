const express = require("express");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const router = express.Router();

const pool = require('../index');

router.get("/", getUsers);
router.post("/", jsonParser, addUser);

module.exports = router;

function getUsers(req, reshttp) {
	pool.getConnection((err, connection) => {
		const getUsers = `
			select
			users.name as name,
			users.id as id, 
			users_coffees.coffee_id as coffee_id,
			users_coffees.rating as rating,
			users_coffees.notes as notes,
			coffees.name as coffee_name
			from users
			left join users_coffees on users.id = users_coffees.user_id 
			left join coffees on users_coffees.coffee_id = coffees.id
		`
		connection.query(getUsers, (err, res) => {
			connection.release();
			let users = {};
			res.forEach((user) => {
				if (!(user.id in users)) {
					users[user.id] = {
						name: user.name,
						id: user.id,
						ratings: []
					}
				}
				if (user.rating) {
					users[user.id].rating = [...users[user.id].ratings, { coffee_id: user.coffee_id, user_id: user.id, coffee_name: users.coffee_name, rating: user.rating, notes: user.notes }];
				}
			})
			// return object = {users: res, message: 'random message'}
			reshttp.setHeader("Content-Type", "application/json");
			reshttp.end(
				JSON.stringify({
					message: "Users",
					users: Object.values(users),
				})
			);
			return;
		});
	});
}

function addUser(req, reshttp) {
	pool.getConnection((err, connection) => {
		const userid = parseInt(req.body.user_id);
		const username = req.body.username;
		connection.query(`select id from users`, (err, res) => {
			if (!res.map((user) => user.id).includes(userid)) {
				connection.query(
					`insert into users (id, name) values (${userid}, '${username}')`,
					(err, res) => {
						connection.release();
						// successful insert, return 200
						reshttp.setHeader("Content-Type", "application/json");
						reshttp.end(
							JSON.stringify({
								message: "User addedd",
								variant: "success",
							})
						);
						return;
					}
				);
			} else {
				connection.release();
				// user already exists
				reshttp.setHeader("Content-Type", "application/json");
				reshttp.end(
					JSON.stringify({
						message: "User logged in",
						variant: "success",
					})
				);
				return;
			}
		});
	});
}
