const express = require("express");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const router = express.Router();

const pool = require("../index");

router.get("/", getCoffees);
router.post("/", jsonParser, postCoffee);
router.delete("/", jsonParser, deleteCoffee);
router.get("/coffee", jsonParser, getCoffee);
router.get("/ids-names", getIdsNames);
module.exports = router;

function getIdsNames(req, reshttp) {
	pool.getConnection((err, connection) => {
		connection.query(`select id, name from coffees`, (err, res) => {
			let coffees = {};
			res.forEach((coffee) => (coffees[coffee.name] = coffee.id));
			reshttp.setHeader("Content-Type", "application/json");
			reshttp.end(
				JSON.stringify({
					message: "Coffees Ids Names",
					variant: "success",
					coffees,
				})
			);
		});
	});
}

function getCoffee(req, reshttp) {
	if (req.query.id) {
		pool.getConnection((err, connection) => {
			const getCoffee = `
			select coffees.name as name, coffees.current as current,coffees.id as id, coffees.description as description, coffees.image as image, coffees.url as url, users_coffees.user_id as user_id, users_coffees.rating as rating, users_coffees.notes as notes, users.name as username from coffees left join users_coffees on coffees.id = users_coffees.coffee_id left join users on users.id = users_coffees.user_id where coffees.id = ${req.query.id}
		`;
			connection.query(getCoffee, (err, res) => {
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
					// indexes are for add-rating in frontend
					// for filling correct data into form
					let indexes = {};
					let index = 0;
					console.log(res);
					res.forEach((item) => {
						if (item.user_id) {
							coffee.ratings = [
								...coffee.ratings,
								{
									name: item.username,
									user_id: item.user_id,
									rating: item.rating,
									notes: item.notes,
								},
							];
							indexes[item.user_id] = index;
							index++;
							coffee.count++;
							coffee.sum += item.rating;
							coffee.average = coffee.sum / coffee.count;
						}
					});

					connection.query(
						`select id from coffees where current = 1`,
						(err, res) => {
							connection.release();
							reshttp.setHeader(
								"Content-Type",
								"application/json"
							);
							reshttp.end(
								JSON.stringify({
									message: "Coffee",
									variant: "success",
									coffee,
									indexes,
									currentCoffeeId: res ? res[0].id : false,
								})
							);
						}
					);
				} else {
					reshttp.setHeader("Content-Type", "application/json");
					reshttp.end(
						JSON.stringify({
							message: "There is no coffee with this id",
							variant: "warning",
						})
					);
				}
			});
		});
	} else {
		reshttp.setHeader("Content-Type", "application/json");
		reshttp.end(
			JSON.stringify({
				message: "No id specified",
				variant: "error",
			})
		);
	}
}

function getCoffees(req, reshttp) {
	pool.getConnection((err, connection) => {
		const getCoffees = `
			select
			coffees.name as name,
			coffees.id as id,
			coffees.description as description,
			coffees.url as url,
			coffees.image as image,
			coffees.current as current,
			users_coffees.user_id as user_id,
			users_coffees.notes as notes,
			users_coffees.rating as rating,
			users.name as username
			from coffees
			left join users_coffees on coffees.id = users_coffees.coffee_id
			left join users on users_coffees.user_id = users.id
			`;
		let coffees = {};
		let currentCoffee = 0;
		connection.query(getCoffees, (err, res) => {
			connection.release();
			if (res) {
				res.forEach((item) => {
					if (!(item.id in coffees)) {
						coffees[item.id] = {
							name: item.name,
							id: item.id,
							description: item.description,
							image: item.image,
							url: item.url,
							hasRating: item.user_id ? true : false,
							ratings: [],
							count: 0,
							sum: 0,
							average: 0,
						};
					}
					if (item.user_id) {
						coffees[item.id].ratings = [
							...coffees[item.id].ratings,
							{
								name: item.username,
								user_id: item.user_id,
								rating: item.rating,
								notes: item.notes,
							},
						];
						coffees[item.id].count++;
						coffees[item.id].sum += item.rating;
						coffees[item.id].average =
							coffees[item.id].sum / coffees[item.id].count;
					}
					if (item.current) {
						currentCoffee = item.id;
					}
				});
				// console.log(coffees);
				reshttp.setHeader("Content-Type", "application/json");
				reshttp.status(200);
				reshttp.end(
					JSON.stringify({
						coffees: Object.values(coffees),
						coffee: coffees[currentCoffee]
							? coffees[currentCoffee]
							: {},
					})
				);
				return;
			}
			//console.log(coffees);
			reshttp.setHeader("Content-Type", "application/json");
			reshttp.status(200);
			reshttp.end(
				JSON.stringify({
					coffees: {},
					coffee: {},
				})
			);
		});
	});
}

function postCoffee(req, reshttp) {
	pool.getConnection((err, connection) => {
		console.log(req.body);
		const name = req.body.name;
		const description = req.body.description;
		const image = req.body.image;
		const url = req.body.url;
		//console.log(req);
		connection.query(`select name from coffees`, (err, res) => {
			console.log(res);
			const coffeeNames = res.map((coffee) => coffee.name);
			if (coffeeNames.includes(name)) {
				connection.release();
				// return, coffee already exists
				console.log("already exists");
				reshttp.setHeader("Content-Type", "application/json");
				reshttp.end(
					JSON.stringify({
						message: "Coffee already exists",
						variant: "warning",
					})
				);
				return;
			}
			const insertCoffee = `insert into coffees (name, description, url, image, current) values ('${name}', '${description}', 
			'${url}', '${image}',0)`;
			connection.query(insertCoffee, (err, res) => {
				connection.release();
				// return, successfully added
				console.log("coffee sucessfuly added");
				reshttp.setHeader("Content-Type", "application/json");
				reshttp.end(
					JSON.stringify({
						message: "Coffee successfuly inserted",
						variant: "success",
					})
				);
				return;
			});
		});
	});
}

//postCoffee("third coffee", "description", "url");

function deleteCoffee(req, reshttp) {
	console.log("deleting coffee");
	pool.getConnection((err, connection) => {
		const coffeeid = req.body.coffee_id;
		connection.query("select id from coffees", (err, res) => {
			const ids = res.map((coffee) => coffee.id);
			if (ids.includes(coffeeid)) {
				connection.query(
					`delete from users_coffees where coffee_id =${coffeeid}`,
					(err, res) => {
						connection.query(
							`delete from coffees where id = ${coffeeid}`,
							(err, res) => {
								connection.release();
								// delete successful, return
								reshttp.setHeader(
									"Content-Type",
									"application/json"
								);
								reshttp.end(
									JSON.stringify({
										message:
											"Coffee was successfuly deleted",
										variant: "success",
									})
								);
								return;
							}
						);
					}
				);
			} else {
				connection.release();
				// coffee doesn't exist, return 200
				reshttp.setHeader("Content-Type", "application/json");
				reshttp.end(
					JSON.stringify({
						message: "Coffee doesn't exist",
						variant: "warning",
					})
				);
				return;
			}
		});
	});
}
