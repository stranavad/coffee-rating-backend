const express = require("express");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const router = express.Router();

const pool = require("../index");

router.post("/", jsonParser, addRating);

module.exports = router;

function addRating(req, reshttp) {
	pool.getConnection((err, connection) => {
		const userid = parseInt(req.body.user_id);
		const coffeeid = req.body.coffee_id;
		const notes = req.body.notes;
		const rating = req.body.rating;
		//console.log(req.body);
		connection.query(
			`select user_id from users_coffees where coffee_id = ${coffeeid} and user_id = ${userid}`, // deciding whether to update or insert
			(err, res) => {
				console.log(err);
				if (res.length !== 0) {
					// updating existing rating
					connection.query(
						`update users_coffees set rating = ${rating}, notes = '${notes}' where coffee_id = ${coffeeid} and user_id = ${userid}`,
						(err, res) => {
							console.log(err);
							connection.release();
							// successfully updated, return 200
							reshttp.setHeader(
								"Content-Type",
								"application/json"
							);
							reshttp.end(
								JSON.stringify({
									message: "Your rating was updated",
									variant: "success",
								})
							);
							return;
						}
					);
				} else {
					// creating new rating ?
					connection.query(
						`select id from coffees where id = ${coffeeid}`,
						(err, res) => {
							console.log(err);
							if (res.length === 1) {
								connection.query(
									`insert into users_coffees (user_id, coffee_id, rating, notes) values (${userid}, ${coffeeid}, ${rating}, '${notes}')`,
									(err, res) => {
										console.log(err);
										connection.release();
										// successfull insert, return 200
										reshttp.setHeader(
											"Content-Type",
											"application/json"
										);
										reshttp.end(
											JSON.stringify({
												message:
													"Your rating was added",
												variant: "success",
											})
										);
										return;
									}
								);
							} else {
								connection.release();
								// coffee doesn't exist
								reshttp.setHeader(
									"Content-Type",
									"application/json"
								);
								reshttp.end(
									JSON.stringify({
										message: "Coffee doesn't exist",
										variant: "error",
									})
								);
								return;
							}
						}
					);
				}
			}
		);
	});
}
