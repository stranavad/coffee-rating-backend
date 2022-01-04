const express = require("express");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const router = express.Router();

const pool = require("../index");

router.get("/", getCurrentCoffee);
router.post("/", jsonParser, setCurrentCoffee);

module.exports = router;

function setCurrentCoffee(req, reshttp) {
	console.log('in set current coffee');
	pool.getConnection((err, connection) => {
		const coffeeid = req.body.coffee_id;
		console.log(req.body);
		connection.query(
			`update coffees set current = 0 where current = 1`,
			(err, res) => {
				connection.query(
					`update coffees set current = 1 where id = ${coffeeid}`,
					(err, res) => {
						connection.release();
						// update successfull, return 200
						reshttp.setHeader("Content-Type", "application/json");
						reshttp.end(
							JSON.stringify({
								message: "Current coffee was successfuly set",
								variant: "success",
							})
						);
						return;
					}
				);
			}
		);
	});
}

function getCurrentCoffee(req, reshttp) {
	pool.getConnection((err, connection) => {
		const getCoffee = `
			select
			coffees.name as name, 
			coffees.id as id, 
			coffees.description as description, 
			coffees.url as url,
			coffees.image as image, 
			users_coffees.user_id as user_id, 
			users_coffees.rating as rating, 
			users_coffees.notes as notes,
			users.name as username
			from coffees
			left join users_coffees on coffees.id = users_coffees.coffee_id
			left join users on users.id = users_coffees.user_id
			where current = 1
		`;
		connection.query(getCoffee, (err, res) => {
			connection.release();
			if (res) {
				const fc = res[0];
				let coffee = {
					name: fc.name,
					id: fc.id,
					description: fc.description,
					image: fc.image,
					url: fc.url,
					hasRating: fc.user_id ? true : false,
					ratings: [],
					count: 0,
					sum: 0,
					average: 0,
				};
				res.forEach((item) => {
					coffee.ratings = [
						...coffee.ratings,
						{
							name: item.username,
							id: item.user_id,
							rating: item.rating,
							notes: item.notes,
						},
					];
					coffee.count++;
					coffee.sum += item.rating;
					coffee.average = coffee.sum / coffee.count;
				});
				reshttp.setHeader("Content-Type", "application/json");
				reshttp.end(
					JSON.stringify({
						message: "Current coffee",
						variant: "success",
						coffee,
					})
				);
			} else {
				reshttp.setHeader("Content-Type", "application/json");
				reshttp.end(
					JSON.stringify({
						message: "There is no current coffee",
						variant: "warning",
					})
				);
			}
		});
	});
}