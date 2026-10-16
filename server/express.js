const path = require('path');
const crypto = require('crypto');

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookie_parser = require('cookie-parser');

const cors = require('cors');
const sql = require('pg');

// Global variables
const port = 3000;
const app = express();
const bcrypt_rounds = 12;

const jwt_admin_secret      = crypto.randomBytes(64).toString('hex');
const jwt_technician_secret = crypto.randomBytes(64).toString('hex');
const jwt_customer_secret   = crypto.randomBytes(64).toString('hex');

// Middleware
app.use(express.json());  // Allow parsing JSON
app.use(cookie_parser()); // Allow reading cookies

// Allow cross-origin resource sharing
app.use(cors({
	credentials: true,
	origin: true
}));  

// Connect to SQL service
const api = new sql.Pool({
	host: 'db',
	port: 5432,
	user: 'admin',
	password: 'password',
	database: 'api'
});


// Authentication, authorisation
// Require admin authorisation
// Otherwise, redirect to admin login page
const require_auth_admin = async (req, res, next) => {
	let token = (req.cookies) ? req.cookies.jwt : null;
	if (token) {
		jwt.verify(token, jwt_admin_secret, (err, user) => {
			if (err) {
				console.log(tlog(), "Admin auth invalid for", req.ip);
				return res.sendStatus(403);
			}
			else next();
		});
	}
	else {
		console.log(tlog(), "Admin auth requested for", req.ip);
		return res.sendStatus(401);
	}
};

// Require at least technician authorisation
// Same behavior applies here
const require_auth_technician = async (req, res, next) => {
	let token = (req.cookies) ? req.cookies.jwt : null;
	if (token) {
		let valid = false;
		for (let secret of [jwt_admin_secret, jwt_technician_secret]) {
			jwt.verify(token, secret, (err, user) => {valid = !err;});
			if (valid) break;
		}
		
		if (!valid) {
			console.log(tlog(), "Technician auth invalid for", req.ip);
			return res.sendStatus(403);
		}
		else next();
	}
	else {
		console.log(tlog(), "Technician auth requested for", req.ip);
		return res.sendStatus(401);
	}
};

// Require at least customer authorisation
// Same behavior also applies here
const require_auth_customer = async (req, res, next) => {
	let token = (req.cookies) ? req.cookies.jwt : null;
	if (token) {
		let valid = false;
		for (let secret of [jwt_admin_secret, jwt_technician_secret, jwt_customer_secret]) {
			jwt.verify(token, secret, (err, user) => {valid = !err;});
			if (valid) break;
		}
		
		if (!valid) {
			console.log(tlog(), "Customer auth invalid for", req.ip);
			return res.sendStatus(403);
		}
		else next();
	}
	else {
		console.log(tlog(), "Customer auth requested for", req.ip);
		return res.sendStatus(401);
	}
};
 
// Authenticate as admin
app.post("/api/auth/admin", async (req, res) => {
	console.log(tlog(), req.ip, "requested to verify admin auth");
	
	let auth_data = req.body;
	api.query(
		"SELECT * FROM admins WHERE username=$1",
		[auth_data.username],
		(err, results) => {
			if (err) return res.sendStatus(400);
			
			let admin = results.rows[0];
			if (admin)
				bcrypt.compare(auth_data.password, admin.password, (err, valid) => {
					if (valid) {
						let token = (req.cookies) ? req.cookies.jwt : null;
						
						// Skip if token is still valid
						// (just in case the cookie timeout inexplicably lasts longer than the jwt timeout)
						if (token) jwt.verify(token, jwt_admin_secret, (err, user) => {if (err) token = null;});
						if (token) return res.sendStatus(204);
						
						// Generate jwt for client
						else {
							token = jwt.sign({username: auth_data.username}, jwt_admin_secret, {expiresIn: '1h'});
							return res.cookie('jwt', token, {
								maxAge: 1000 * 60 * 60,
								httpOnly: true
							}).sendStatus(200);
						}
					}
					else {
						console.log(tlog(), req.ip, "admin auth invalid for");
						return res.sendStatus(401);
					}
				});
			
			else {
				console.log(tlog(), req.ip, "admin auth invalid for");
				return res.sendStatus(401);
			}
		}
	);
});

// Authenticate as technician
app.post("/api/auth/technician", async (req, res) => {
	console.log(tlog(), req.ip, "requested to verify technician auth");
	
	let auth_data = req.body;
	api.query(
		"SELECT * FROM technicians WHERE email=$1",
		[auth_data.email],
		(err, results) => {
			if (err) return res.sendStatus(400);
			
			let technician = results.rows[0];
			if (technician)
				bcrypt.compare(auth_data.password, technician.password, (err, valid) => {
					if (valid) {
						let token = (req.cookies) ? req.cookies.jwt : null;
						
						// Skip if token is still valid
						// (just in case the cookie timeout inexplicably lasts longer)
						if (token) jwt.verify(token, jwt_technician_secret, (err, user) => {if (err) token = null;});
						if (token) res.sendStatus(204);
						
						// Generate jwt for client
						else {
							token = jwt.sign({id: technician.id}, jwt_technician_secret, {expiresIn: '1h'});
							return res.cookie("jwt", token, {
								maxAge: 1000 * 60 * 60,
								httpOnly: true
							}).sendStatus(200);
						}
					}
					else {
						console.log(tlog(), req.ip, "technician auth invalid");
						return res.sendStatus(401);
					}
				});
			
			else {
				console.log(tlog(), req.ip, "technician auth invalid");
				return res.sendStatus(401);
			}
		}
	);
});

// Authenticate as customer
app.post("/api/auth/customer", async (req, res) => {
	console.log(tlog(), req.ip, "requested to verify customer auth");
	
	let auth_data = req.body;
	api.query(
		"SELECT * FROM customers WHERE email=$1",
		[auth_data.email],
		(err, results) => {
			if (err) return res.sendStatus(400);
			
			let customer = results.rows[0];
			if (customer)
				bcrypt.compare(auth_data.password, customer.password, (err, valid) => {
					if (valid) {
						let token = (req.cookies) ? req.cookies.jwt : null;
						
						// Skip if token is still valid
						// (just in case the cookie timeout inexplicably lasts longer)
						if (token) jwt.verify(token, jwt_customer_secret, (err, user) => {if (err) token = null;});
						if (token) res.sendStatus(204);
						
						// Generate jwt for client
						else {
							token = jwt.sign({id: customer.id}, jwt_customer_secret, {expiresIn: '1h'});
							return res.cookie("jwt", token, {
								maxAge: 1000 * 60 * 60,
								httpOnly: true
							}).sendStatus(200);
						}
					}
					else {
						console.log(tlog(), req.ip, "customer auth invalid");
						return res.sendStatus(401);
					}
				});
			
			else {
				console.log(tlog(), req.ip, "customer auth invalid");
				return res.sendStatus(401);
			}
		}
	);
});

// Deauthenticate
app.post("/api/auth/logout", async (req, res) => {
	console.log(tlog(), req.ip, "requested deauthentication");
	return res.cookie("jwt", "", {
		httpOnly: true
	}).sendStatus(200);
});


// Countries
app.get("/api/countries", async (req, res) => {
	console.log(tlog(), req.ip, "requested country list");
	api.query(
		"SELECT * FROM countries ORDER BY name", [],
		(err, results) => {
			if (err) return res.sendStatus(500);
			res.json(results);
		}
	);
});


// Products
// Access all products
app.get("/api/products", require_auth_customer, async (req, res) => {
	console.log(tlog(), req.ip, "requested product list");
	api.query(
		"SELECT * FROM products ORDER BY code", [],
		(err, results) => {
			if (err) return res.sendStatus(500);
			res.json(results);
		}
	);
});

// Access specific product
app.get("/api/products/:code", require_auth_customer, async (req, res) => {
	console.log(tlog(), req.ip, "requested product with code", req.params.code);
	api.query(
		"SELECT * FROM products WHERE code=$1 ORDER BY code",
		[req.params.code],
		(err, results) => {
			if (err || results.length < 1) return res.sendStatus(400);
			res.json(results);
		}
	);
});

// Search products
app.post("/api/products/search", require_auth_customer, async (req, res) => {
	let product = req.body;
	console.log(tlog(), req.ip, "requested product search:", product);
	api.query(
		"SELECT * FROM products WHERE\
			code ILIKE $1 AND\
			name ILIKE $2\
		ORDER BY code", [
			'%' + (product.code ?? "") + '%',
			'%' + (product.name ?? "") + '%'
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			res.json(results);
		}
	);
});


// Create new product
app.post("/api/products", require_auth_admin, async (req, res) => {
	let product = req.body;
	console.log(tlog(), req.ip, "requested creation of product:", product);
	api.query(
		"INSERT INTO products VALUES ($1, $2, $3, $4)", [
			product.code,
			product.name,
			product.version,
			product.release_date
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(201);
		}
	);
});

// Update product
app.put("/api/products/:code", require_auth_admin, async (req, res) => {
	let product = req.body;
	console.log(tlog(), req.ip, "requested update to product with code", req.params.code + ':', product);
	api.query(
		"UPDATE products SET code=$2, name=$3, version=$4, release_date=$5 WHERE code=$1", [
			req.params.code,
			product.code,
			product.name,
			product.version,
			product.release_date
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(201);
		}
	);
});

// Delete product
app.delete("/api/products/:code", require_auth_admin, async (req, res) => {
	console.log(tlog(), req.ip, "requested deletion of product with code", req.params.code);
	api.query(
		"DELETE FROM products WHERE code=$1",
		[req.params.code],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(204);
		}
	);
});


// Technicians
// Access all technicians
app.get("/api/technicians", require_auth_technician, async (req, res) => {
	console.log(tlog(), req.ip, "requested technician list");
	api.query(
		"SELECT id, first_name, last_name, email, phone\
		FROM technicians ORDER BY first_name, last_name", [],
		(err, results) => {
			if (err) return res.sendStatus(500);
			res.json(results);
		}
	);
});

// Access specific technician
app.get("/api/technicians/:id", require_auth_technician, async (req, res) => {
	console.log(tlog(), req.ip, "requested technician with id", req.params.id);
	api.query(
		"SELECT id, first_name, last_name, email, phone\
		FROM technicians WHERE id=$1",
		[req.params.id],
		(err, results) => {
			if (err) return res.sendStatus(400);
			res.json(results);
		}
	);
});

// Search technicians
app.post("/api/technicians/search", require_auth_technician, async (req, res) => {
	let technician = req.body;
	console.log(tlog(), req.ip, "requested technician search:", technician);
	api.query(
		"SELECT id, first_name, last_name, email, phone\
		FROM technicians WHERE\
			first_name ILIKE $1 AND\
			last_name ILIKE $2 AND\
			email ILIKE $3 AND\
			phone LIKE $4\
		ORDER BY first_name, last_name", [
			'%' + (technician.first_name ?? "") + '%',
			'%' + (technician.last_name ?? "") + '%',
			'%' + (technician.email ?? "") + '%',
			'%' + (technician.phone ?? "") + '%'
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			res.json(results);
		}
	);
});

// Create new technician
app.post("/api/technicians", require_auth_admin, async (req, res) => {
	let technician = req.body;
	console.log(tlog(), req.ip, "requested creation of technician:", technician);
	api.query(
		"INSERT INTO technicians (first_name, last_name, email, phone, password) VALUES ($1, $2, $3, $4, $5)", [
			technician.first_name,
			technician.last_name,
			technician.email,
			technician.phone,
			bcrypt.hashSync(technician.password, bcrypt_rounds)
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(201);
		}
	);
});

// Update technician
app.put("/api/technicians/:id", require_auth_admin, async (req, res) => {
	let technician = req.body;
	console.log(tlog(), req.ip, "requested update to technician with id", req.params.id + ':', technician);
	api.query(
		"UPDATE technicians SET first_name=$2, last_name=$3, email=$4, phone=$5, password=$6 WHERE id=$1", [
			req.params.id,
			technician.first_name,
			technician.last_name,
			technician.email,
			technician.phone,
			bcrypt.hashSync(technician.password, bcrypt_rounds)
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(201);
		}
	);
});

// Delete technician
app.delete("/api/technicians/:id", require_auth_admin, async (req, res) => {
	console.log(tlog(), req.ip, "requested deletion of technician with id", req.params.id);
	api.query(
		"DELETE FROM technicians WHERE id=$1",
		[req.params.id],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(204);
		}
	);
});


// Customers
// Access all customers
app.get("/api/customers", require_auth_customer, async (req, res) => {
	console.log(tlog(), req.ip, "requested customer list");
	api.query(
		"SELECT id, first_name, last_name, email, phone, country\
		FROM customers ORDER BY first_name, last_name", [],
		(err, results) => {
			if (err) return res.sendStatus(500);
			res.json(results);
		}
	);
});

// Access specific customer
app.get("/api/customers/:id", require_auth_technician, async (req, res) => {
	console.log(tlog(), req.ip, "requested customer with id", req.params.id);
	api.query(
		"SELECT * FROM customers WHERE id=$1",
		[req.params.id],
		(err, results) => {
			if (err) throw err;//return res.sendStatus(400);
			res.json(results);
		}
	);
});

// Search customers
app.post("/api/customers/search", require_auth_customer, async (req, res) => {
	let customer = req.body;
	console.log(tlog(), req.ip, "requested customer search:", customer);
	api.query(
		"SELECT id, first_name, last_name, email, phone, country\
		FROM customers WHERE\
			first_name ILIKE $1 AND\
			last_name ILIKE $2 AND\
			address ILIKE $3 AND\
			city ILIKE $4 AND\
			state ILIKE $5 AND\
			postcode LIKE $6 AND\
			country LIKE $7 AND\
			email ILIKE $8 AND\
			phone LIKE $9\
		ORDER BY first_name, last_name", [
			'%' + (customer.first_name ?? "") + '%',
			'%' + (customer.last_name ?? "") + '%',
			
			'%' + (customer.address ?? "") + '%',
			'%' + (customer.city ?? "") + '%',
			'%' + (customer.state ?? "") + '%',
			'%' + (customer.postcode ?? "") + '%',
			
			'%' + (customer.country ?? "") + '%',
			'%' + (customer.email ?? "") + '%',
			'%' + (customer.phone ?? "") + '%'
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			res.json(results);
		}
	);
});

// Create new customer
app.post("/api/customers", require_auth_admin, async (req, res) => {
	let customer = req.body;
	console.log(tlog(), req.ip, "requested creation of customer:", customer);
	api.query(
		"INSERT INTO customers (\
			first_name, last_name,\
			address, city, state, postcode,\
			country, email, phone, password\
		)VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [
			customer.first_name,
			customer.last_name,
			
			customer.address,
			customer.city,
			customer.state,
			customer.postcode,
			
			customer.country,
			customer.email,
			customer.phone,
			bcrypt.hashSync(customer.password, bcrypt_rounds)
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(201);
		}
	);
});

// Update customer
app.put("/api/customers/:id", require_auth_admin, async (req, res) => {
	let customer = req.body;
	console.log(tlog(), req.ip, "requested update to customer with id", req.params.id + ':', customer);
	api.query(
		"UPDATE customers SET\
			first_name=$2,\
			last_name=$3,\
			address=$4,\
			city=$5,\
			state=$6,\
			postcode=$7,\
			country=$8,\
			email=$9,\
			phone=$10,\
			password=$11\
		WHERE id=$1", [
			req.params.id,
			
			customer.first_name,
			customer.last_name,
			
			customer.address,
			customer.city,
			customer.state,
			customer.postcode,
			
			customer.country,
			customer.email,
			customer.phone,
			bcrypt.hashSync(customer.password, bcrypt_rounds)
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(201);
		}
	);
});

// Delete customer
app.delete("/api/customers/:id", require_auth_admin, async (req, res) => {
	console.log(tlog(), req.ip, "requested deletion of customer with id", req.params.id);
	api.query(
		"DELETE FROM customers WHERE id=$1",
		[req.params.id],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(204);
		}
	);
});


// Incidents
// Access all incidents
app.get("/api/incidents", require_auth_technician, async (req, res) => {
	console.log(tlog(), req.ip, "requested incident list");
	api.query(
		"SELECT * FROM incidents ORDER BY date_opened DESC", [],
		(err, results) => {
			if (err) return res.sendStatus(500);
			res.json(results);
		}
	);
});

// Search incidents
app.post("/api/incidents/search", require_auth_technician, async (req, res) => {
	let incident = req.body;
	let date_condition = ""; // For date_closed
	switch (incident.status) {
		case 1: date_condition = "date_closed IS NULL AND"; break;
		case 2: date_condition = "date_closed IS NOT NULL AND"; break;
	}
	
	// Make sure parameters are present regardless of input
	// FIXME: Normally, I would've just used the ?? operator as usual,
	// but compensating for omission of the below parameters specifically
	// would have been rather tricky, given that default inputs (as implied
	// by the omission) should relax filtering for such parameters.
	incident.customer_id   = (incident.customer_id   ?? 0);
	incident.technician_id = (incident.technician_id ?? 0);
	
	console.log(tlog(), req.ip, "requested incident search:", incident);
	api.query(
		"SELECT * FROM incidents WHERE\
			customer_id>=$1 AND customer_id<=$2 AND\
			product_code ILIKE $3 AND\
			technician_id>=$4 AND technician_id<=$5 AND\
			" + date_condition + "\
			title ILIKE $6\
		ORDER BY date_opened DESC", [
			incident.customer_id,
			(incident.customer_id > 0) ? incident.customer_id : 0x7fffffff,
			'%' + (incident.product_code ?? "") + '%',
			incident.technician_id,
			(incident.technician_id > 0) ? incident.technician_id : 0x7fffffff,
			'%' + (incident.title ?? "") + '%'
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			res.json(results);
		}
	);
});

// Create new incident
app.post("/api/incidents", require_auth_admin, async (req, res) => {
	let incident = req.body;
	console.log(tlog(), req.ip, "requested creation of incident:", incident);
	api.query(
		"INSERT INTO incidents (customer_id, product_code, title, description) VALUES ($1, $2, $3, $4)", [
			incident.customer_id,
			incident.product_code,
			incident.title, incident.description
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(201);
		}
	);
});

// Update incident (assign technician)
app.put("/api/incidents/assign/:id", require_auth_admin, async (req, res) => {
	let incident = req.body;
	console.log(tlog(), req.ip, "requested update to incident (assign to technician with id", req.params.id + ':', incident + ')');
	api.query(
		"UPDATE incidents SET technician_id=$2 WHERE id=$1", [
			req.params.id,
			incident.technician_id
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(201);
		}
	);
});

// Update incident (technician ONLY)
// Other roles do not work, since it explicitly requires role-specific identification
app.put("/api/incidents/:id", require_auth_technician, async (req, res) => {
	let incident = req.body;
	let token = (req.cookies) ? req.cookies.jwt : null;
	console.log(tlog(), req.ip, "requested update to incident id", req.params.id + ':', incident);
	
	// Enforce customer-only authorization
	if (token) {
		jwt.verify(token, jwt_technician_secret, (err, user) => {
			if (err) {
				console.log(tlog(), "JWT invalid for", req.ip);
				return res.sendStatus(403);
			}
			else {
				let technician = jwt.decode(token, {complete: true}).payload;
				console.log(tlog(), req.ip, "with technician id", technician.id);
				
				api.query(
					"UPDATE incidents SET\
						description=$3,\
						date_closed=$4\
					WHERE id=$1 AND technician_id=$2\
					RETURNING *", [
						req.params.id,
						technician.id,
						incident.description,
						incident.date_closed
					],
					(err, results) => {
						console.log(results);
						if (err) return res.sendStatus(400); else
						if (!results.rows[0]) res.sendStatus(403);
						else return res.sendStatus(201);
					}
				);
			}
		});
	}
	else {
		console.log(tlog(), "JWT missing for", req.ip);
		return res.sendStatus(401);
	}
});

// Delete incident
app.delete("/api/incidents/:id", require_auth_admin, async (req, res) => {
	console.log(tlog(), req.ip, "requested deletion of incident with id", req.params.id);
	api.query(
		"DELETE FROM incidents WHERE id=$1",
		[req.params.id],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(204);
		}
	);
});


// Registrations
// Access all registrations
app.get("/api/registrations", require_auth_technician, async (req, res) => {
	console.log(tlog(), req.ip, "requested registration list");
	api.query(
		"SELECT * FROM registrations ORDER BY date_registered DESC", [],
		(err, results) => {
			if (err) {console.log(err);return res.sendStatus(500);
			}
			res.json(results);
		}
	);
});


// Access all registrations from a customer (customer ONLY)
app.get("/api/registrations/from", require_auth_customer, async (req, res) => {
	let registration = req.body;
	let token = (req.cookies) ? req.cookies.jwt : null;
	console.log(tlog(), req.ip, "requested registration list");
	
	// Enforce customer-only authorization
	if (token) {
		jwt.verify(token, jwt_customer_secret, (err, user) => {
			if (err) {
				console.log(tlog(), "JWT invalid for", req.ip);
				return res.sendStatus(403);
			}
			else {
				let customer = jwt.decode(token, {complete: true}).payload;
				console.log(tlog(), req.ip, "with customer id", customer.id);
				
				api.query(
					"SELECT * FROM registrations\
					WHERE customer_id=$1\
					ORDER BY date_registered DESC",
					[customer.id],
					(err, results) => {
						if (err) return res.sendStatus(400);
						res.json(results);
					}
				);
			}
		});
	}
	else {
		console.log(tlog(), "JWT missing for", req.ip);
		return res.sendStatus(401);
	}
});

// Add new registration (customer ONLY)
app.post("/api/registrations", require_auth_customer, async (req, res) => {
	let registration = req.body;
	let token = (req.cookies) ? req.cookies.jwt : null;
	console.log(tlog(), req.ip, "requested new registration:", registration);
	
	// Enforce customer-only authorization
	if (token) {
		jwt.verify(token, jwt_customer_secret, (err, user) => {
			if (err) {
				console.log(tlog(), "JWT invalid for", req.ip);
				return res.sendStatus(403);
			}
			else {
				let customer = jwt.decode(token, {complete: true}).payload;
				console.log(tlog(), req.ip, "with customer id", customer.id);
				
				api.query(
					"INSERT INTO registrations (customer_id, product_code) VALUES ($1, $2)", [
						customer.id,
						registration.product_code
					],
					(err, results) => {
						if (err) return res.sendStatus(400);
						res.json(results);
					}
				);
			}
		});
	}
	else {
		console.log(tlog(), "JWT missing for", req.ip);
		return res.sendStatus(401);
	}
});

// Delete registration
app.delete("/api/registrations/", require_auth_admin, async (req, res) => {
	let registration  = req.body;
	console.log(tlog(), req.ip, "requested deletion of registration:", registration);
	api.query(
		"DELETE FROM registrations WHERE customer_id=$1 AND product_code=$2", [
			registration.customer_id,
			registration.product_code
		],
		(err, results) => {
			if (err) return res.sendStatus(400);
			return res.sendStatus(204);
		}
	);
});

// Start express application
app.listen(port, () => console.log(tlog(), "Server up on port", port));
const tlog = () => "(" + (new Date()).toISOString() + ")";
