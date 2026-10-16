let
chart_fg_color = getComputedStyle(document.querySelector(':root')).getPropertyValue('color'),
chart_bg_color = 'transparent';

console.log(chart_fg_color, chart_bg_color);

// Identify unique element
function get_id(id) {return document.getElementById(id)};

// Add new element
function elem(tag, classes=[], text="") {
	let e = document.createElement(tag);
	
	if (classes.length > 0)
		e.classList = classes;
	
	if (text !== "")
		e.textContent = text;
	
	return e;
}

// Check validity of an array of inputs
function valid(inputs) {
	for (let input of inputs)
	if (!input.checkValidity())
		return false;
	
	return true;
}

// Debug function to authenticate client
function auth() {
	let auth_data = {
		username: "admin",
		password: "password"
	};
	
	fetch("http://" + location.hostname + ':' + 3000 + "/api/auth/admin", {
		method: "POST",
		credentials: "include",
		body: JSON.stringify(auth_data),
		headers: {"Content-Type": "application/json"}
	});
}

// URL queries
let url_params = new URLSearchParams(location.search);
if (url_params.get('q'))
if (get_id('query'))
	get_id('query').value = url_params.get('q');

if (url_params.get('focus')) {
	let cancel_update = get_id('cancel_update');
	if (cancel_update) {
		cancel_update.hidden = false;
		cancel_update.onclick = () => {
			url_params.set('focus', "");
			location.search = url_params.toString();
		};
	}
	
	if (get_id('add_entry'))    get_id('add_entry').hidden = true;
	if (get_id('update_entry')) get_id('update_entry').hidden = false;
}

// Queries
if (get_id('search_query'))
get_id('search_query').addEventListener('click', () => {
	url_params.set('q', get_id('query').value);
	location.search = url_params.toString();
});


// Load different stuff depending on page
switch (location.pathname) {
	case '/logout.html': {
		fetch("http://" + location.hostname + ':' + 3000 + "/api/auth/logout", {
			method: "POST",
			credentials: "include",
		})
		.then(res => {
			setTimeout(() => {
				location = document.referrer
			}, 5000);
		});
		break;
	}
	
	case '/login_admin.html': {
		get_id('login').addEventListener('click', (e) => {
			let
			username = get_id('username').value,
			password = get_id('password').value;
			
			if (username.length > 0 && password.length > 0) {
				let auth_data = {
					username: username,
					password: password
				};
				
				fetch("http://" + location.hostname + ':' + 3000 + "/api/auth/admin", {
					method: "POST",
					credentials: "include",
					body: JSON.stringify(auth_data),
					headers: {"Content-Type": "application/json"}
				}).then(res => location = document.referrer);
			}
		});
		
		break;
	}
	
	case '/login_technician.html': {
		get_id('login').addEventListener('click', (e) => {
			let
			email = get_id('email').value,
			password = get_id('password').value;
			
			if (email.length > 0 && password.length > 0) {
				let auth_data = {
					email: email,
					password: password
				};
				
				fetch("http://" + location.hostname + ':' + 3000 + "/api/auth/technician", {
					method: "POST",
					credentials: "include",
					body: JSON.stringify(auth_data),
					headers: {"Content-Type": "application/json"}
				}).then(res => location = document.referrer);
			}
		});
		
		break;
	}
	
	case '/login_customer.html': {
		get_id('login').addEventListener('click', (e) => {
			let
			email = get_id('email').value,
			password = get_id('password').value;
			
			if (email.length > 0 && password.length > 0) {
				let auth_data = {
					email: email,
					password: password
				};
				
				fetch("http://" + location.hostname + ':' + 3000 + "/api/auth/customer", {
					method: "POST",
					credentials: "include",
					body: JSON.stringify(auth_data),
					headers: {"Content-Type": "application/json"}
				}).then(res => location = document.referrer);
			}
		});
		
		break;
	}
	
	case '/dashboard_admin.html': {
		let
		countries,
		products,
		technicians,
		customers,
		incidents;
		
		// Load Google Charts JS API
		google.charts.load('current', {'packages': ['corechart', 'bar']});
		
		// Loaded early and synchronized so certain data can be preemptively resolved
		Promise.all([
			// Send GET request to access a range of countries
			fetch("http://" + location.hostname + ':' + 3000 + "/api/countries", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill dropdown with entries
			.then(res => {
				if (!res) return;
				countries = res.rows;
			}),
			
			// Send GET request to access a range of products
			fetch("http://" + location.hostname + ':' + 3000 + "/api/products", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				
				products = res.rows;
				let table = get_id('products');
				
				for (let product of products) {
					let row = elem('tr');
					product.release_date = new Date(product.release_date);
					
					row.append(elem('td', [], product.code));
					row.append(elem('td', [], product.name));
					row.append(elem('td', [], product.version));
					row.append(elem('td', [], product.release_date.toLocaleDateString('sv'))); // Adjust calendar timezone
					
					table.append(row);
				}
			}),
			
			// Send GET request to access a range of technicians
			fetch("http://" + location.hostname + ':' + 3000 + "/api/technicians", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				
				technicians = res.rows;
				let table = get_id('technicians');
				
				for (let technician of technicians) {
					let row = elem('tr');
					row.append(elem('td', [], technician.first_name));
					row.append(elem('td', [], technician.last_name));
					row.append(elem('td', [], technician.email));
					row.append(elem('td', [], technician.phone));
					
					table.append(row);
				}
			}),
			
			// Send GET request to access a range of customers
			fetch("http://" + location.hostname + ':' + 3000 + "/api/customers", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				
				customers = res.rows;
				let table = get_id('customers');
				
				for (let customer of customers) {
					let row = elem('tr');
					row.append(elem('td', [], [customer.first_name, customer.last_name].join(' ')));
					row.append(elem('td', [], customer.email));
					row.append(elem('td', [], customer.phone));
					
					table.append(row);
				}
			}),
			
			// Send POST request to access a range of incidents
			fetch("http://" + location.hostname + ':' + 3000 + "/api/incidents/search", {
				method:  "POST",
				credentials: "include",
				body: JSON.stringify({status: 1}),
				headers: {"Content-Type": "application/json"}
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				incidents = res.rows;
			})
		])
		
		// Load bar chart showing unresolved incidents
		.then(() => {
			google.charts.setOnLoadCallback(() => {
				let data = [['Product Name', 'Unresolved Incidents']];
				for (let product of products) {
					let incident_count = 0;
					for (let incident of incidents)
					if (incident.product_code === product.code)
						incident_count++;
					
					data.push([product.name, incident_count]);
				}
				
				console.log(data);
				
				let gdata = google.visualization.arrayToDataTable(data);
				let options = {
					title: 'Unresolved Product Incidents',
					height: 400,
					chartArea: {width: '50%'},
					hAxis: {
						title: 'Number of Unresolved Incidents',
						minValue: 0,
						textStyle: {color: chart_fg_color},
						titleTextStyle: {color: chart_fg_color}
					},
					vAxis: {
						title: 'Product Name',
						textStyle: {color: chart_fg_color},
						titleTextStyle: {color: chart_fg_color}
					},
					legend: {textStyle: {color: chart_fg_color}},
					titleTextStyle: {color: chart_fg_color},
					backgroundColor: {fill: chart_bg_color}
				};
				
				let chart = new google.visualization.BarChart(get_id('product_incidents'));
				chart.draw(gdata, options);
			});
		})
		
		// Load bar chart showing distribution of incident assignment to technicians
		.then(() => {
			google.charts.setOnLoadCallback(() => {
				let data = [['Technician', 'Assigned Incidents']];
				for (let technician of technicians) {
					let assign_count = 0;
					for (let incident of incidents)
					if (incident.technician_id === technician.id)
						assign_count++;
					
					data.push([[technician.first_name, technician.last_name].join(' '), assign_count]);
				}
				
				console.log(data);
				
				let gdata = google.visualization.arrayToDataTable(data);
				let options = {
					title: 'Technician Incident Assignment Distribution',
					height: 400,
					chartArea: {width: '50%'},
					hAxis: {
						title: 'Number of Open Assigned Incidents',
						minValue: 0,
						textStyle: {color: chart_fg_color},
						titleTextStyle: {color: chart_fg_color}
					},
					vAxis: {
						title: 'Technician',
						textStyle: {color: chart_fg_color},
						titleTextStyle: {color: chart_fg_color}
					},
					legend: {textStyle: {color: chart_fg_color}},
					titleTextStyle: {color: chart_fg_color},
					backgroundColor: {fill: chart_bg_color}
				};
				
				let chart = new google.visualization.BarChart(get_id('technician_assign_distribution'));
				chart.draw(gdata, options);
			});
		})
		
		
		// Load pie chart showing country demographic
		.then(() => {
			google.charts.setOnLoadCallback(() => {
				let data = [['Country', 'Percentage']];
				for (let country of countries) {
					let customer_count = 0;
					for (let customer of customers)
					if (customer.country === country.code)
						customer_count++;
					
					data.push([country.name, customer_count]);
				}
				
				console.log(data);
				
				let gdata = google.visualization.arrayToDataTable(data);
				let options = {
					title: 'Customer Demographic (By Country)',
					height: 400,
					chartArea: {width: '50%'},
					vAxis: {
						title: 'Country',
						textStyle: {color: chart_fg_color},
						titleTextStyle: {color: chart_fg_color}
					},
					legend: {textStyle: {color: chart_fg_color}},
					titleTextStyle: {color: chart_fg_color},
					backgroundColor: {fill: chart_bg_color}
				};
				
				let chart = new google.visualization.PieChart(get_id('customer_country_demo'));
				chart.draw(gdata, options);
			});
		});
		
		break;
	}
	
	case '/dashboard_technician.html': {
		let
		technicians,
		customers,
		incidents;
		
		// Load Google Charts JS API
		google.charts.load('current', {'packages': ['corechart', 'bar']});
		
		Promise.all([
			// Send GET request to access a range of products
			fetch("http://" + location.hostname + ':' + 3000 + "/api/products", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_technician.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				
				products = res.rows;
				let table = get_id('products');
				
				for (let product of products) {
					let row = elem('tr');
					product.release_date = new Date(product.release_date);
					
					row.append(elem('td', [], product.code));
					row.append(elem('td', [], product.name));
					row.append(elem('td', [], product.version));
					row.append(elem('td', [], product.release_date.toLocaleDateString('sv'))); // Adjust calendar timezone
					
					table.append(row);
				}
			}),
			
			// Send GET request to access a range of technicians
			fetch("http://" + location.hostname + ':' + 3000 + "/api/technicians", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_technician.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				technicians = res.rows;
			}),
			
			// Send GET request to access a range of customers
			fetch("http://" + location.hostname + ':' + 3000 + "/api/customers", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_technician.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				customers = res.rows;
			})
		])
		
		.then(() =>
		Promise.resolve(
			// Send POST request to access a range of incidents
			fetch("http://" + location.hostname + ':' + 3000 + "/api/incidents/search", {
				method:  "POST",
				credentials: "include",
				body: JSON.stringify({status: 1}),
				headers: {"Content-Type": "application/json"}
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_technician.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				
				let table = get_id('incidents');
				incidents = res.rows;
				
				for (let incident of incidents) {
					let row = elem('tr');
					incident.release_date = new Date(incident.release_date);
					
					let customer_name;
					for (let customer of customers)
					if (customer.id === incident.customer_id) {
						customer_name = [customer.first_name, customer.last_name].join(' ');
						break;
					}
					
					let technician_name;
					for (let technician of technicians)
					if (technician.id === incident.technician_id) {
						technician_name = [technician.first_name, technician.last_name].join(' ');
						break;
					}
					
					row.append(elem('td', [], incident.id));
					row.append(elem('td', [], customer_name));
					row.append(elem('td', [], incident.product_code));
					row.append(elem('td', [], technician_name));
					row.append(elem('td', [], new Date(incident.date_opened).toLocaleDateString('sv')));
					row.append(elem('td', [], (incident.date_closed) ? new Date(incident.date_closed).toLocaleDateString('sv') : ""));
					row.append(elem('td', [], incident.title));
					
					table.append(row);
				}
			})
		))
		
		// Load bar chart showing unresolved incidents
		.then(() => {
			google.charts.setOnLoadCallback(() => {
				let data = [['Product Name', 'Unresolved Incidents']];
				for (let product of products) {
					let incident_count = 0;
					for (let incident of incidents)
					if (incident.product_code === product.code)
						incident_count++;
					
					data.push([product.name, incident_count]);
				}
				
				console.log(data);
				
				let gdata = google.visualization.arrayToDataTable(data);
				let options = {
					title: 'Unresolved Product Incidents',
					height: 400,
					chartArea: {width: '50%'},
					hAxis: {
						title: 'Number of Unresolved Incidents',
						minValue: 0,
						textStyle: {color: chart_fg_color},
						titleTextStyle: {color: chart_fg_color}
					},
					vAxis: {
						title: 'Product Name',
						textStyle: {color: chart_fg_color},
						titleTextStyle: {color: chart_fg_color}
					},
					legend: {textStyle: {color: chart_fg_color}},
					titleTextStyle: {color: chart_fg_color},
					backgroundColor: {fill: chart_bg_color}
				};
				
				let chart = new google.visualization.BarChart(get_id('product_incidents'));
				chart.draw(gdata, options);
			});
		})
		
		// Load bar chart showing distribution of incident assignment to technicians
		.then(() => {
			google.charts.setOnLoadCallback(() => {
				let data = [['Technician', 'Assigned Incidents']];
				for (let technician of technicians) {
					let assign_count = 0;
					for (let incident of incidents)
					if (incident.technician_id === technician.id)
						assign_count++;
					
					data.push([[technician.first_name, technician.last_name].join(' '), assign_count]);
				}
				
				console.log(data);
				
				let gdata = google.visualization.arrayToDataTable(data);
				let options = {
					title: 'Technician Incident Assignment Distribution',
					height: 400,
					chartArea: {width: '50%'},
					hAxis: {
						title: 'Number of Open Assigned Incidents',
						minValue: 0,
						textStyle: {color: chart_fg_color},
						titleTextStyle: {color: chart_fg_color}
					},
					vAxis: {
						title: 'Technician',
						textStyle: {color: chart_fg_color},
						titleTextStyle: {color: chart_fg_color}
					},
					legend: {textStyle: {color: chart_fg_color}},
					titleTextStyle: {color: chart_fg_color},
					backgroundColor: {fill: chart_bg_color}
				};
				
				let chart = new google.visualization.BarChart(get_id('technician_assign_distribution'));
				chart.draw(gdata, options);
			});
		});
		
		break;
	}
	
	case '/dashboard_customer.html': {
		// Send GET request to access a range of registrations
		Promise.resolve(
			fetch("http://" + location.hostname + ':' + 3000 + "/api/registrations/from", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_customer.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				
				let registrations = res.rows;
				let table = get_id('registrations');
				
				for (let registration of registrations) {
					let row = elem('tr');
					row.append(elem('td', [], registration.product_code));
					row.append(elem('td', [], new Date(registration.date_registered).toLocaleDateString('sv')));
					
					table.append(row);
				}
			})
		);
		
		break;
	}
	
	case '/products.html': {
		// Change HTML layout if editing an existing entry
		if (url_params.get('focus'))
			get_id('intent').innerText = "Edit Product";
		
		// Send GET/POST request to access a range of products
		fetch(
			(url_params.get('q'))
				? "http://" + location.hostname + ':' + 3000 + "/api/products/search"
				: "http://" + location.hostname + ':' + 3000 + "/api/products",
			(url_params.get('q')) ? {
				method:  "POST",
				credentials: "include",
				body: JSON.stringify({"code": url_params.get('q')}),
				headers: {"Content-Type": "application/json"}
			} : {
				method: "GET",
				credentials: "include"
			}
		)
		
		// Check request status
		.then(res => {
			// Proceed to data processing and visualisation
			if (res.ok) return res.json();
			
			// Show alert message for internal server errors
			else if (res.status >= 500)
				alert("Cannot process request due to server error.");
			
			// Redirect to login page if missing or invalid authorisation
			else if (res.status > 400)
				location.pathname = "/login_admin.html";
			
			// Show alert message for bad requests
			else if (res.status === 400)
				alert("Cannot process bad request.");
		})
		
		// Fill table view with entries
		.then(res => {
			if (!res) return;
			
			let entries = res.rows;
			let table = get_id('products');
			
			for (let product of entries) {
				let row = elem('tr');
				product.release_date = new Date(product.release_date);
				
				row.append(elem('td', [], product.code));
				row.append(elem('td', [], product.name));
				row.append(elem('td', [], product.version));
				row.append(elem('td', [], product.release_date.toLocaleDateString('sv'))); // Adjust calendar timezone
				
				let action = elem('td');
				
				let update_entry = elem('button', ['action'], "Edit");
				update_entry.id = product.code;
				
				// More UI changes if editing entry
				if (url_params.get('focus') === update_entry.id) {
					update_entry.disabled = true;
					get_id('code').value = product.code;
					get_id('name').value = product.name;
					get_id('version').value = product.version;
					get_id('release_date').value = product.release_date.toLocaleDateString('sv');
				}
				else update_entry.onclick = (e) => {
					url_params.set('focus', e.target.id);
					location.search = url_params.toString();
				};
				
				let delete_entry = elem('button', ['danger'], "Delete");
				delete_entry.id = product.code;
				delete_entry.onclick = (e) => {
					let code = e.target.id;
					
					// Remove entry from db
					fetch("http://" + location.hostname + ':' + 3000 + "/api/products/" + code, {
						method: "DELETE",
						credentials: "include"
					})
					
					// Check request status
					.then(res => {
						// Update table view by reloading page
						if (res.ok) {
							if (url_params.get('focus') === e.target.id) url_params.set('focus', "");
							location.search = url_params.toString();
						}
						
						// Show alert message for internal server errors
						else if (res.status >= 500)
							alert("Cannot delete product due to server error.");
						
						// Redirect to login page if missing or invalid authorisation
						else if (res.status > 400)
							location.pathname = "/login_admin.html";
						
						// Cannot delete entry; its primary key is already used as foreign key
						else if (res.status === 400)
							alert("Cannot delete product. You must delete the associated incidents and/or registrations first.");
					});
				};
				
				action.append(update_entry);
				action.append(delete_entry);
				row.append(action);
				table.append(row);
			}
		});
		
		// Require valid inputs for submission
		const validate = (e) => {
			let ready = valid([
				get_id('code'),
				get_id('name'),
				get_id('version'),
				get_id('release_date')
			]);
			
			get_id('add_entry').disabled = !ready;
			get_id('update_entry').disabled = !ready;
		};
		
		document.addEventListener('keyup', validate); // For typed input updates
		
		// Add new product
		get_id('add_entry').addEventListener('click', (e) => {
			// Set up request body
			let product = {
				code: get_id('code').value,
				name: get_id('name').value,
				version: parseFloat(get_id('version').value),
				release_date: get_id('release_date').value
			};
			
			// Send POST request
			fetch("http://" + location.hostname + ':' + 3000 + "/api/products", {
				method: "POST",
				credentials: "include",
				body: JSON.stringify(product),
				headers: {"Content-Type": "application/json"}
			})
			
			// Check request status
			.then(res => {
				// Update table view by reloading page
				if (res.ok) location.search = url_params.toString();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot add product due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad request
				else if (res.status === 400)
					alert("Cannot add product due to bad request.");
			});
		});
		
		// Update existing product
		get_id('update_entry').addEventListener('click', (e) => {
			// Set up request body
			let code = url_params.get('focus');
			let product = {
				code: get_id('code').value,
				name: get_id('name').value,
				version: parseFloat(get_id('version').value),
				release_date: new Date(get_id('release_date').value + " UTC") // Inserted UTC to prevent weird timezone offsets
			};
			
			// Send PUT request
			fetch("http://" + location.hostname + ':' + 3000 + "/api/products/" + code, {
				method: "PUT",
				credentials: "include",
				body: JSON.stringify(product),
				headers: {"Content-Type": "application/json"}
			})
			
			.then(res => {
				// Update table view by reloading page
				if (res.ok) {
					url_params.set('focus', "");
					location.search = url_params.toString();
				}
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot update product due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad request
				else if (res.status === 400)
					alert("Cannot update product due to bad request.");
			});
		});
		
		break;
	}
	
	case '/technicians.html': {
		// Change HTML layout if editing an existing entry
		if (url_params.get('focus'))
			get_id('intent').innerText = "Edit Technician";
		
		// Send GET/POST request to access a range of technicians
		fetch(
			(url_params.get('q'))
				? "http://" + location.hostname + ':' + 3000 + "/api/technicians/search"
				: "http://" + location.hostname + ':' + 3000 + "/api/technicians",
			(url_params.get('q')) ? {
				method:  "POST",
				credentials: "include",
				body: JSON.stringify({"last_name": url_params.get('q')}),
				headers: {"Content-Type": "application/json"}
			} : {
				method: "GET",
				credentials: "include"
			}
		)
		
		// Check request status
		.then(res => {
			// Proceed to data processing and visualisation
			if (res.ok) return res.json();
			
			// Show alert message for internal server errors
			else if (res.status >= 500)
				alert("Cannot process request due to server error.");
			
			// Redirect to login page if missing or invalid authorisation
			else if (res.status > 400)
				location.pathname = "/login_admin.html";
			
			// Show alert message for bad requests
			else if (res.status === 400)
				alert("Cannot process bad request.");
		})
		
		// Fill table view with entries
		.then(res => {
			if (!res) return;
			
			let entries = res.rows;
			let table = get_id('technicians');
			
			for (let technician of entries) {
				let row = elem('tr');
				row.append(elem('td', [], technician.first_name));
				row.append(elem('td', [], technician.last_name));
				row.append(elem('td', [], technician.email));
				row.append(elem('td', [], technician.phone));
				
				let action = elem('td');
				
				let update_entry = elem('button', ['action'], "Edit");
				update_entry.id = technician.id;
				
				// More UI changes if editing entry
				if (url_params.get('focus') === update_entry.id)
					update_entry.disabled = true;
				
				else update_entry.onclick = (e) => {
					url_params.set('focus', e.target.id);
					location.search = url_params.toString();
				};
				
				let delete_entry = elem('button', ['danger'], "Delete");
				delete_entry.id = technician.id;
				delete_entry.onclick = (e) => {
					// Remove entry from db
					fetch("http://" + location.hostname + ':' + 3000 + "/api/technicians/" + e.target.id, {
						method: "DELETE",
						credentials: "include"
					})
					
					.then(res => {
						// Update table view by reloading page
						if (res.ok) {
							if (url_params.get('focus') === e.target.id) url_params.set('focus', "");
							location.search = url_params.toString();
						}
						
						// Show alert message for internal server errors
						else if (res.status >= 500)
							alert("Cannot delete technician due to server error.");
						
						// Redirect to login page if missing or invalid authorisation
						else if (res.status > 400)
							location.pathname = "/login_admin.html";
						
						// Cannot delete entry; its primary key is already used as foreign key
						else if (res.status === 400)
							alert("Cannot delete technician. You must delete the associated incidents first.");
					});
				};
				
				action.append(update_entry);
				action.append(delete_entry);
				row.append(action);
				table.append(row);
			}
		});
		
		// Send GET request to access a specific technician
		if (url_params.get('focus'))
		fetch("http://" + location.hostname + ':' + 3000 + "/api/technicians/" + url_params.get('focus'), {
				method: "GET",
				credentials: "include"
			}
		)
		
		// Check request status
		.then(res => {
			// Proceed to data processing and visualisation
			if (res.ok) return res.json();
			
			// Show alert message for internal server errors
			else if (res.status >= 500)
				alert("Cannot process request due to server error.");
			
			// Redirect to login page if missing or invalid authorisation
			else if (res.status > 400)
				location.pathname = "/login_admin.html";
			
			// Show alert message for bad requests
			else if (res.status === 400)
				alert("Cannot process bad request.");
		})
		
		// Fill inputs with technician details
		.then(res => {
			if (!res) return;
			
			let technician = res.rows[0];
			get_id('first_name').value = technician.first_name;
			get_id('last_name').value = technician.last_name;
			get_id('email').value = technician.email;
			get_id('phone').value = technician.phone;
		});
		
		// Require valid inputs for submission
		const validate = (e) => {
			let ready = valid([
				get_id('first_name'),
				get_id('last_name'),
				get_id('email'),
				get_id('phone'),
				get_id('password')
			]);
			
			get_id('add_entry').disabled = !ready;
			get_id('update_entry').disabled = !ready;
		};
		
		document.addEventListener('keyup', validate); // For typed input updates
		
		// Add new technician
		get_id('add_entry').addEventListener('click', (e) => {
			// Set up request body
			let technician = {
				first_name: get_id('first_name').value,
				last_name: get_id('last_name').value,
				email: get_id('email').value,
				phone: get_id('phone').value,
				password: get_id('password').value
			};
			
			// Send POST request
			fetch("http://" + location.hostname + ':' + 3000 + "/api/technicians", {
				method: "POST",
				credentials: "include",
				body: JSON.stringify(technician),
				headers: {"Content-Type": "application/json"}
			})
			
			.then(res => {
				// Update table view by reloading page
				if (res.ok) location.search = url_params.toString();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot add technician due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad request
				else if (res.status === 400)
					alert("Cannot add technician due to bad request.");
			});
		});
		
		// Update existing technician
		get_id('update_entry').addEventListener('click', (e) => {
			// Set up request body
			let technician = {
				first_name: get_id('first_name').value,
				last_name: get_id('last_name').value,
				email: get_id('email').value,
				phone: get_id('phone').value,
				password: get_id('password').value
			};
			
			// Send PUT request
			fetch("http://" + location.hostname + ':' + 3000 + "/api/technicians/" + url_params.get('focus'), {
				method: "PUT",
				credentials: "include",
				body: JSON.stringify(technician),
				headers: {"Content-Type": "application/json"}
			})
			
			.then(res => {
				// Update table view by reloading page
				if (res.ok) {
					url_params.set('focus', "");
					location.search = url_params.toString();
				}
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot update technician due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad request
				else if (res.status === 400)
					alert("Cannot update technician due to bad request.");
			});
		});
		
		break;
	}
	
	case '/customers.html': {
		// Change HTML layout if editing an existing entry
		if (url_params.get('focus'))
			get_id('intent').innerText = "View/Edit Customer";
		
		// Send GET/POST request to access a range of customers
		fetch(
			(url_params.get('q'))
				? "http://" + location.hostname + ':' + 3000 + "/api/customers/search"
				: "http://" + location.hostname + ':' + 3000 + "/api/customers",
			(url_params.get('q')) ? {
				method:  "POST",
				credentials: "include",
				body: JSON.stringify({"last_name": url_params.get('q')}),
				headers: {"Content-Type": "application/json"}
			} : {
				method: "GET",
				credentials: "include"
			}
		)
		
		// Check request status
		.then(res => {
			// Proceed to data processing and visualisation
			if (res.ok) return res.json();
			
			// Show alert message for internal server errors
			else if (res.status >= 500)
				alert("Cannot process request due to server error.");
			
			// Redirect to login page if missing or invalid authorisation
			else if (res.status > 400)
				location.pathname = "/login_admin.html";
			
			// Show alert message for bad requests
			else if (res.status === 400)
				alert("Cannot process bad request.");
		})
		
		// Fill table view with entries
		.then(res => {
			if (!res) return;
			
			let entries = res.rows;
			let table = get_id('customers');
			
			for (let customer of entries) {
				let row = elem('tr');
				row.append(elem('td', [], [customer.first_name, customer.last_name].join(' ')));
				row.append(elem('td', [], customer.email));
				row.append(elem('td', [], customer.phone));
				
				let action = elem('td');
				
				let update_entry = elem('button', ['action'], "View/Edit");
				update_entry.id = customer.id;
				
				// More UI changes if editing entry
				if (url_params.get('focus') === update_entry.id)
					update_entry.disabled = true;
				
				else update_entry.onclick = (e) => {
					url_params.set('focus', e.target.id);
					location.search = url_params.toString();
				};
				
				let delete_entry = elem('button', ['danger'], "Delete");
				delete_entry.id = customer.id;
				delete_entry.onclick = (e) => {
					// Remove entry from db
					fetch("http://" + location.hostname + ':' + 3000 + "/api/customers/" + e.target.id, {
						method: "DELETE",
						credentials: "include"
					})
					
					.then(res => {
						// Update table view by reloading page
						if (res.ok) {
							if (url_params.get('focus') === e.target.id) url_params.set('focus', "");
							location.search = url_params.toString();
						}
						
						// Show alert message for internal server errors
						else if (res.status >= 500)
							alert("Cannot delete customer due to server error.");
						
						// Redirect to login page if missing or invalid authorisation
						else if (res.status > 400)
							location.pathname = "/login_admin.html";
						
						// Cannot delete entry; its primary key is already used as foreign key
						else if (res.status === 400)
							alert("Cannot delete customer. You must delete the associated incidents and registrations first.");
					});
				};
				
				action.append(update_entry);
				action.append(delete_entry);
				row.append(action);
				table.append(row);
			}
		});
		
		// Send GET request to access a range of countries
		fetch("http://" + location.hostname + ':' + 3000 + "/api/countries", {
			method: "GET",
			credentials: "include"
		})
		
		// Check request status
		.then(res => {
			// Proceed to data processing and visualisation
			if (res.ok) return res.json();
			
			// Show alert message for internal server errors
			else if (res.status >= 500)
				alert("Cannot process request due to server error.");
			
			// Redirect to login page if missing or invalid authorisation
			else if (res.status > 400)
				location.pathname = "/login_admin.html";
			
			// Show alert message for bad requests
			else if (res.status === 400)
				alert("Cannot process bad request.");
		})
		
		// Fill dropdown with entries
		.then(res => {
			if (!res) return;
			
			let entries = res.rows;
			let dropdown = get_id('country');
			
			for (let country of entries) {
				let option = elem('option', [], country.name);
				option.value = country.code;
				dropdown.append(option);
			}
		});
		
		// Send GET request to access a specific customer
		if (url_params.get('focus'))
		fetch("http://" + location.hostname + ':' + 3000 + "/api/customers/" + url_params.get('focus'), {
				method: "GET",
				credentials: "include"
			}
		)
		
		// Check request status
		.then(res => {
			// Proceed to data processing and visualisation
			if (res.ok) return res.json();
			
			// Show alert message for internal server errors
			else if (res.status >= 500)
				alert("Cannot process request due to server error.");
			
			// Redirect to login page if missing or invalid authorisation
			else if (res.status > 400)
				location.pathname = "/login_admin.html";
			
			// Show alert message for bad requests
			else if (res.status === 400)
				alert("Cannot process bad request.");
		})
		
		// Fill inputs with customer details
		.then(res => {
			if (!res) return;
			let customer = res.rows[0];
			
			get_id('first_name').value = customer.first_name;
			get_id('last_name').value = customer.last_name;
			
			get_id('address').value = customer.address;
			get_id('city').value = customer.city;
			get_id('state').value = customer.state;
			get_id('postcode').value = customer.postcode;
			
			get_id('country').value = customer.country;
			get_id('email').value = customer.email;
			get_id('phone').value = customer.phone;
		});
		
		// Require valid inputs for submission
		const validate = (e) => {
			let ready = valid([
				get_id('first_name'),
				get_id('last_name'),
				
				get_id('address'),
				get_id('city'),
				get_id('state'),
				get_id('postcode'),
				
				get_id('country'),
				get_id('email'),
				get_id('phone'),
				get_id('password')
			]);
			
			get_id('add_entry').disabled = !ready;
			get_id('update_entry').disabled = !ready;
		};
		
		document.addEventListener('keyup', validate);  // For typed input updates
		document.addEventListener('change', validate); // For dropdown updates
		
		// Add new customer
		get_id('add_entry').addEventListener('click', (e) => {
			// Set up request body
			let customer = {
				first_name: get_id('first_name').value,
				last_name: get_id('last_name').value,
				
				address: get_id('address').value,
				city: get_id('city').value,
				state: get_id('state').value,
				postcode: get_id('postcode').value,
				
				country: get_id('country').value,
				email: get_id('email').value,
				phone: get_id('phone').value,
				password: get_id('password').value
			};
			
			// Send POST request
			fetch("http://" + location.hostname + ':' + 3000 + "/api/customers", {
				method: "POST",
				credentials: "include",
				body: JSON.stringify(customer),
				headers: {"Content-Type": "application/json"}
			})
			
			.then(res => {
				// Update table view by reloading page
				if (res.ok) location.search = url_params.toString();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot add customer due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad request
				else if (res.status === 400)
					alert("Cannot add customer due to bad request.");
			});
		});
		
		// Update existing customer
		get_id('update_entry').addEventListener('click', (e) => {
			// Set up request body
			let customer = {
				first_name: get_id('first_name').value,
				last_name: get_id('last_name').value,
				
				address: get_id('address').value,
				city: get_id('city').value,
				state: get_id('state').value,
				postcode: get_id('postcode').value,
				
				country: get_id('country').value,
				email: get_id('email').value,
				phone: get_id('phone').value,
				password: get_id('password').value
			};
			
			// Send PUT request
			fetch("http://" + location.hostname + ':' + 3000 + "/api/customers/" + url_params.get('focus'), {
				method: "PUT",
				credentials: "include",
				body: JSON.stringify(customer),
				headers: {"Content-Type": "application/json"}
			})
			
			// Check request status
			.then(res => {
				// Update table view by reloading page
				if (res.ok) {
					url_params.set('focus', "");
					location.search = url_params.toString();
				}
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot update customer due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad request
				else if (res.status === 400)
					alert("Cannot update customer due to bad request.");
			});
		});
		
		break;
	}
	
	case '/create_incident.html': {
		// Send GET request to access a range of customers
		// Loaded first so customer names can be resolved in incidents table
		fetch("http://" + location.hostname + ':' + 3000 + "/api/customers", {
			method: "GET",
			credentials: "include"
		})
		
		// Check request status
		.then(res => {
			// Proceed to data processing and visualisation
			if (res.ok) return res.json();
			
			// Show alert message for internal server errors
			else if (res.status >= 500)
				alert("Cannot process request due to server error.");
			
			// Redirect to login page if missing or invalid authorisation
			else if (res.status > 400)
				location.pathname = "/login_admin.html";
			
			// Show alert message for bad requests
			else if (res.status === 400)
				alert("Cannot process bad request.");
		})
		
		// Fill customer dropdown with entries
		.then(res => {
			if (!res) return;
			
			let entries = res.rows;
			let dropdown = get_id('customer_id');
			
			for (let customer of entries) {
				let option = elem('option', [], [customer.first_name, customer.last_name].join(' '));
				option.value = customer.id;
				dropdown.append(option);
			}
		});
		
		// Send GET request to access a range of products
		fetch("http://" + location.hostname + ':' + 3000 + "/api/products", {
			method: "GET",
			credentials: "include"
		})
		
		// Check request status
		.then(res => {
			// Proceed to data processing and visualisation
			if (res.ok) return res.json();
			
			// Show alert message for internal server errors
			else if (res.status >= 500)
				alert("Cannot process request due to server error.");
			
			// Redirect to login page if missing or invalid authorisation
			else if (res.status > 400)
				location.pathname = "/login_admin.html";
			
			// Show alert message for bad requests
			else if (res.status === 400)
				alert("Cannot process bad request.");
		})
		
		// Fill product dropdown with entries
		.then(res => {
			if (!res) return;
			
			let entries = res.rows;
			let dropdown = get_id('product_code');
			
			for (let product of entries) {
				let option = elem('option', [], product.name);
				option.value = product.code;
				dropdown.append(option);
			}
		});
		
		// Require valid inputs for submission
		const validate = (e) => {
			let ready = valid([
				get_id('customer_id'),
				get_id('product_code'),
				get_id('title'),
				get_id('description')
			]);
			
			get_id('add_entry').disabled = !ready;
		};
		
		document.addEventListener('keyup', validate);  // For typed input updates
		document.addEventListener('change', validate); // For dropdown updates
		
		// Add new incident
		get_id('add_entry').addEventListener('click', (e) => {
			// Set up request body
			let incident = {
				customer_id: get_id('customer_id').value,
				product_code: get_id('product_code').value,
				title: get_id('title').value,
				description: get_id('description').value
			};
			
			// Send POST request
			fetch("http://" + location.hostname + ':' + 3000 + "/api/incidents", {
				method: "POST",
				credentials: "include",
				body: JSON.stringify(incident),
				headers: {"Content-Type": "application/json"}
			})
			
			// Check request status
			.then(res => {
				// Update table view by reloading page
				if (res.ok) location.search = url_params.toString();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot add incident due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad request
				else if (res.status === 400)
					alert("Cannot add incident due to bad request.");
			});
		});
		
		break;
	}
	
	case '/assign_incident.html': {
		let customers;
		Promise.all([
			// Send GET request to access a range of customers
			fetch("http://" + location.hostname + ':' + 3000 + "/api/customers", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			.then(res => {
				if (!res) return;
				customers = res.rows;
			}),
			
			// Send GET request to access a range of technicians
			fetch("http://" + location.hostname + ':' + 3000 + "/api/technicians", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill dropdown with entries
			.then(res => {
				if (!res) return;
				
				let entries = res.rows;
				let dropdown = get_id('technician_id');
				
				for (let technician of entries) {
					let option = elem('option', [], [technician.first_name, technician.last_name].join(' '));
					option.value = technician.id;
					dropdown.append(option);
				}
			})
		])
		
		// Send GET/POST request to access a range of incidents
		.then(() =>
		Promise.resolve(
			fetch(
				(url_params.get('q'))
					? "http://" + location.hostname + ':' + 3000 + "/api/incidents/search"
					: "http://" + location.hostname + ':' + 3000 + "/api/incidents",
				(url_params.get('q')) ? {
					method:  "POST",
					credentials: "include",
					body: JSON.stringify({"title": url_params.get('q')}),
					headers: {"Content-Type": "application/json"}
				} : {
					method: "GET",
					credentials: "include"
				}
			)
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				
				let entries = res.rows;
				let table = get_id('incidents');
				
				for (let incident of entries) {
					let customer_name;
					for (let customer of customers)
					if (customer.id === incident.customer_id) {
						customer_name = [customer.first_name, customer.last_name].join(' ');
						break;
					}
					
					let row = elem('tr');
					row.append(elem('td', [], incident.id));
					row.append(elem('td', [], customer_name));
					row.append(elem('td', [], incident.product_code));
					row.append(elem('td', [], new Date(incident.date_opened).toLocaleDateString('sv')));
					row.append(elem('td', [], incident.title));
					
					let action = elem('td');
					let update_entry = elem('button', ['action'], "Select");
					update_entry.id = incident.id;
					
					// More UI changes if editing entry
					if (url_params.get('focus') === update_entry.id) {
						update_entry.disabled = true;
						
						get_id('incident_id').innerText = incident.id;
						get_id('customer_id').innerText = customer_name;
						get_id('product_code').innerText = incident.product_code;
						get_id('date_opened').innerText = new Date(incident.date_opened).toLocaleDateString('sv');
						
						get_id('title').innerText = incident.title;
						get_id('description').innerText = incident.description;
						
						if (incident.technician_id) {
							get_id('technician_id').value = incident.technician_id;
							get_id('update_entry').disabled = false;
						}
					}
					
					else update_entry.onclick = (e) => {
						url_params.set('focus', e.target.id);
						location.search = url_params.toString();
					};
					
					let delete_entry = elem('button', ['danger'], "Delete");
					delete_entry.id = incident.id;
					delete_entry.onclick = (e) => {
						// Remove entry from db
						fetch("http://" + location.hostname + ':' + 3000 + "/api/incidents/" + e.target.id, {
							method: "DELETE",
							credentials: "include"
						})
						
						.then(res => {
							// Update table view by reloading page
							if (res.ok) {
								if (url_params.get('focus') === e.target.id) url_params.set('focus', "");
								location.search = url_params.toString();
							}
							
							// Show alert message for internal server errors
							else if (res.status >= 500)
								alert("Cannot delete incident due to server error.");
							
							// Redirect to login page if missing or invalid authorisation
							else if (res.status > 400)
								location.pathname = "/login_admin.html";
							
							// Show alert message for bad request
							else if (res.status === 400)
								alert("Cannot delete incident due to bad request.");
						});
					};
					
					action.append(update_entry);
					action.append(delete_entry);
					row.append(action);
					table.append(row);
				}
			})
		));
		
		// Require valid inputs for submission
		const validate = (e) => {get_id('update_entry').disabled = url_params.get('focus') && !valid([get_id('technician_id')]);};
		document.addEventListener('change', validate); // For dropdown updates
		
		// Assign technician to incident
		get_id('update_entry').addEventListener('click', (e) => {
			// Set up request body
			let incident = {technician_id: get_id('technician_id').value};
			
			// Send PUT request
			fetch("http://" + location.hostname + ':' + 3000 + "/api/incidents/assign/" + url_params.get('focus'), {
				method: "PUT",
				credentials: "include",
				body: JSON.stringify(incident),
				headers: {"Content-Type": "application/json"}
			})
			
			.then(res => {
				// Update table view by reloading page
				if (res.ok) {
					url_params.set('focus', "");
					location.search = url_params.toString();
				}
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot assign technician to incident due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad request
				else if (res.status === 400)
					alert("Cannot assign technician to incident due to bad request.");
			});
		});
		
		break;
	}
	
	case '/display_incidents.html': {
		let
		customers,
		technicians;
		
		Promise.all([
			// Send GET request to access a range of technicians
			fetch("http://" + location.hostname + ':' + 3000 + "/api/technicians", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// ...and also fill incidents dropdown with entries
			.then(res => {
				if (!res) return;
				technicians = res.rows;
				
				let dropdown = get_id('technicians');
				for (let technician of technicians) {
					let option = elem('option', [], [technician.first_name, technician.last_name].join(' '));
					option.value = technician.id;
					dropdown.append(option);
				}
			}),
			
			// Send GET request to access a range of customers
			fetch("http://" + location.hostname + ':' + 3000 + "/api/customers", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// ...and also fill customers dropdown with entries
			.then(res => {
				if (!res) return;
				customers = res.rows;
				
				let dropdown = get_id('customers');
				for (let customer of customers) {
					let option = elem('option', [], [customer.first_name, customer.last_name].join(' '));
					option.value = customer.id;
					dropdown.append(option);
				}
			}),
			
			// Send GET request to access a range of products
			fetch("http://" + location.hostname + ':' + 3000 + "/api/products", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill dropdown with entries
			.then(res => {
				if (!res) return;
				products = res.rows;
				
				let dropdown = get_id('products');
				for (let product of products) {
					let option = elem('option', [], product.name);
					option.value = product.code;
					dropdown.append(option);
				}
			})
		])
		
		// Send POST request to access a range of incidents
		.then(() =>
		Promise.resolve(
			fetch("http://" + location.hostname + ':' + 3000 + "/api/incidents/search", {
				method:  "POST",
				credentials: "include",
				body: JSON.stringify({
					product_code:  url_params.get('product_code') ?? "",
					technician_id: parseInt(url_params.get('technician_id')),
					customer_id:   parseInt(url_params.get('customer_id')),
					status:        parseInt(url_params.get('status')),
					title: url_params.get('q') ?? ""
				}),
				headers: {"Content-Type": "application/json"}
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				
				let entries = res.rows;
				let table = get_id('incidents');
				
				for (let incident of entries) {
					let customer_name, customer_email;
					for (let customer of customers)
					if (customer.id === incident.customer_id) {
						customer_name = [customer.first_name, customer.last_name].join(' ');
						customer_email = customer.email;
						break;
					}
					
					let technician_name;
					for (let technician of technicians)
					if (technician.id === incident.technician_id) {
						technician_name = [technician.first_name, technician.last_name].join(' ');
						break;
					}
					
					let row = elem('tr');
					row.append(elem('td', [], incident.id));
					row.append(elem('td', [], customer_name));
					row.append(elem('td', [], incident.product_code));
					row.append(elem('td', [], technician_name));
					row.append(elem('td', [], new Date(incident.date_opened).toLocaleDateString('sv')));
					row.append(elem('td', [], (incident.date_closed) ? new Date(incident.date_closed).toLocaleDateString('sv') : ""));
					row.append(elem('td', [], incident.title));
					
					let action = elem('td');
					let update_entry = elem('button', ['action'], "View");
					update_entry.id = incident.id;
					
					// More UI changes if editing entry
					if (url_params.get('focus') === update_entry.id) {
						update_entry.disabled = true;
						
						// Fill incident details
						get_id('intent').innerText = "Incident #" + incident.id + " Details";
						
						get_id('customer_id').innerText = customer_name + '(' + customer_email + ')';
						get_id('product_code').innerText = incident.product_code;
						get_id('technician_id').innerText = technician_name;
						get_id('date_opened').innerText = new Date(incident.date_opened).toLocaleDateString('sv');
						
						get_id('title').innerText = incident.title;
						get_id('description').innerText = incident.description;
					}
					
					else update_entry.onclick = (e) => {
						url_params.set('focus', e.target.id);
						location.search = url_params.toString();
					};
					
					let delete_entry = elem('button', ['danger'], "Delete");
					delete_entry.id = incident.id;
					delete_entry.onclick = (e) => {
						// Remove entry from db
						fetch("http://" + location.hostname + ':' + 3000 + "/api/incidents/" + e.target.id, {
							method: "DELETE",
							credentials: "include"
						})
						
						.then(res => {
							// Update table view by reloading page
							if (res.ok) {
								if (url_params.get('focus') === e.target.id) url_params.set('focus', "");
								location.search = url_params.toString();
							}
							
							// Show alert message for internal server errors
							else if (res.status >= 500)
								alert("Cannot delete incident due to server error.");
							
							// Redirect to login page if missing or invalid authorisation
							else if (res.status > 400)
								location.pathname = "/login_admin.html";
							
							// Show alert message for bad request
							else if (res.status === 400)
								alert("Cannot delete incident due to bad request.");
						});
					};
					
					action.append(update_entry);
					action.append(delete_entry);
					row.append(action);
					table.append(row);
				}
			})
			.then(res => {
				if (!res) return;
				
				get_id('products').value    = url_params.get('product_code');
				get_id('technicians').value = url_params.get('technician_id');
				get_id('customers').value   = url_params.get('customer_id');
				get_id('status').value = url_params.get('status');
			})
		));
		
		// Override behavior for search button
		get_id('search_query').addEventListener('click', () => {
			url_params.set('product_code',  get_id('products').value);
			url_params.set('technician_id', get_id('technicians').value);
			url_params.set('customer_id',   get_id('customers').value);
			url_params.set('status',        get_id('status').value);
			
			location.search = url_params.toString();
		});
		
		break;
	}
	
	case '/display_registrations.html': {
		let customers;
		Promise.resolve(
			// Send GET request to access a range of customers
			fetch("http://" + location.hostname + ':' + 3000 + "/api/customers", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			.then(res => {
				if (!res) return;
				customers = res.rows;
			})
		)
		
		// Send GET request to access a range of registrations
		.then(() =>
		Promise.resolve(
			fetch("http://" + location.hostname + ':' + 3000 + "/api/registrations", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_admin.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				
				let entries = res.rows;
				let table = get_id('registrations');
				
				for (let registration of entries) {
					let customer_name;
					for (let customer of customers)
					if (customer.id === registration.customer_id) {
						customer_name = [customer.first_name, customer.last_name].join(' ');
						break;
					}
					
					let action = elem('td');
					let delete_entry = elem('button', ['danger'], "Delete");
					delete_entry.setAttribute("customer_id", registration.customer_id);
					delete_entry.setAttribute("product_code", registration.product_code);
					delete_entry.onclick = (e) => {
						const entry = {
							customer_id: parseInt(delete_entry.getAttribute("customer_id")),
							product_code: delete_entry.getAttribute("product_code")
						};
						
						console.log(entry);
						
						// Remove entry from db
						fetch("http://" + location.hostname + ':' + 3000 + "/api/registrations/", {
							method: "DELETE",
							credentials: "include",
							body: JSON.stringify(entry),
							headers: {"Content-Type": "application/json"}
						})
						
						// Check request status
						.then(res => {
							// Update table view by reloading page
							if (res.ok)
								location.search = url_params.toString();
							
							// Show alert message for internal server errors
							else if (res.status >= 500)
								alert("Cannot delete registration due to server error.");
							
							// Redirect to login page if missing or invalid authorisation
							else if (res.status > 400)
								location.pathname = "/login_admin.html";
							
							// Cannot delete entry; its primary key is already used as foreign key
							else if (res.status === 400)
								alert("Cannot delete registration.");
						});
					};
					
					action.append(delete_entry);
					
					let row = elem('tr');
					row.append(elem('td', [], customer_name));
					row.append(elem('td', [], registration.product_code));
					row.append(elem('td', [], new Date(registration.date_registered).toLocaleDateString('sv')));
					row.append(action);
					
					table.append(row);
				}
			})
		));
		
		break;
	}
	
	case '/update_incident.html': {
		let
		customers,
		technicians;
		
		Promise.all([
			// Send GET request to access a range of customers
			fetch("http://" + location.hostname + ':' + 3000 + "/api/customers", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_technician.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			.then(res => {
				if (!res) return;
				customers = res.rows;
			}),
			
			// Send GET request to access a range of technicians
			fetch("http://" + location.hostname + ':' + 3000 + "/api/technicians", {
				method: "GET",
				credentials: "include"
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_technician.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// ...and also fill incidents dropdown with entries
			.then(res => {
				if (!res) return;
				technicians = res.rows;
				
				let dropdown = get_id('query');
				for (let technician of technicians) {
					let option = elem('option', [], [technician.first_name, technician.last_name].join(' '));
					option.value = technician.id;
					dropdown.append(option);
				}
				dropdown.value = url_params.get('q');
			})
		])
		
		// Send POST request to access a range of incidents
		.then(() =>
		Promise.resolve(
			fetch("http://" + location.hostname + ':' + 3000 + "/api/incidents/search", {
				method:  "POST",
				credentials: "include",
				body: JSON.stringify({
					technician_id: url_params.get('q'),
					status: 1
				}),
				headers: {"Content-Type": "application/json"}
			})
			
			// Check request status
			.then(res => {
				// Proceed to data processing and visualisation
				if (res.ok) return res.json();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot process request due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_technician.html";
				
				// Show alert message for bad requests
				else if (res.status === 400)
					alert("Cannot process bad request.");
			})
			
			// Fill table view with entries
			.then(res => {
				if (!res) return;
				
				let entries = res.rows;
				let table = get_id('incidents');
				
				for (let incident of entries) {
					let customer_name;
					for (let customer of customers)
					if (customer.id === incident.customer_id) {
						customer_name = [customer.first_name, customer.last_name].join(' ');
						break;
					}
					
					let row = elem('tr');
					row.append(elem('td', [], incident.id));
					row.append(elem('td', [], customer_name));
					row.append(elem('td', [], incident.product_code));
					row.append(elem('td', [], new Date(incident.date_opened).toLocaleDateString('sv')));
					row.append(elem('td', [], incident.title));
					
					let action = elem('td');
					let update_entry = elem('button', ['action'], "Select");
					update_entry.id = incident.id;
					
					// More UI changes if editing entry
					if (url_params.get('focus') === update_entry.id) {
						update_entry.disabled = true;
						
						get_id('incident_id').innerText = incident.id;
						get_id('customer_id').innerText = customer_name;
						get_id('product_code').innerText = incident.product_code;
						get_id('date_opened').innerText = new Date(incident.date_opened).toLocaleDateString('sv');
						
						get_id('title').innerText = incident.title;
						get_id('description').innerText = incident.description;
						
						if (incident.technician_id)
							get_id('update_entry').disabled = false;
					}
					
					else update_entry.onclick = (e) => {
						url_params.set('focus', e.target.id);
						location.search = url_params.toString();
					};
					
					action.append(update_entry);
					row.append(action);
					table.append(row);
				}
			})
		));
		
		// Require valid inputs for submission
		const validate = (e) => {
			let ready = valid([get_id('description')]);
			get_id('update_entry').disabled = !ready;
		};
		
		document.addEventListener('keyup', validate); // For typed input updates
		
		// Update incident
		get_id('update_entry').addEventListener('click', (e) => {
			// Set up request body
			let incident = {
				description: get_id('description').value,
				date_closed: (get_id('close_incident').checked) ? new Date().toLocaleDateString('sv') : null
			};
			
			// Send PUT request
			fetch("http://" + location.hostname + ':' + 3000 + "/api/incidents/" + url_params.get('focus'), {
				method: "PUT",
				credentials: "include",
				body: JSON.stringify(incident),
				headers: {"Content-Type": "application/json"}
			})
			
			.then(res => {
				// Update table view by reloading page
				if (res.ok) {
					url_params.set('focus', "");
					location.search = url_params.toString();
				}
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot update incident due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_technician.html";
				
				// Show alert message for bad request
				else if (res.status === 400)
					alert("Cannot update incident due to bad request.");
			});
		});
		
		break;
	}
	
	case '/register_product.html': {
		// Send GET request to access a range of products
		fetch("http://" + location.hostname + ':' + 3000 + "/api/products", {
			method: "GET",
			credentials: "include"
		})
		
		// Check request status
		.then(res => {
			// Proceed to data processing and visualisation
			if (res.ok) return res.json();
			
			// Show alert message for internal server errors
			else if (res.status >= 500)
				alert("Cannot process request due to server error.");
			
			// Redirect to login page if missing or invalid authorisation
			else if (res.status > 400)
				location.pathname = "/login_customer.html";
			
			// Show alert message for bad requests
			else if (res.status === 400)
				alert("Cannot process bad request.");
		})
		
		// Fill product dropdown with entries
		.then(res => {
			if (!res) return;
			
			let entries = res.rows;
			let dropdown = get_id('product_code');
			
			for (let product of entries) {
				let option = elem('option', [], product.name);
				option.value = product.code;
				dropdown.append(option);
			}
		});
		
		// Require valid inputs for submission
		const validate = (e) => {
			let ready = valid([get_id('product_code')]);
			get_id('add_entry').disabled = !ready;
		};
		
		document.addEventListener('keyup', validate); // For typed input updates
		document.addEventListener('change', validate); // For dropdown updates
		
		// Add new registration
		get_id('add_entry').addEventListener('click', (e) => {
			// Set up request body
			let registration = {product_code: get_id('product_code').value};
			
			// Send POST request
			fetch("http://" + location.hostname + ':' + 3000 + "/api/registrations", {
				method: "POST",
				credentials: "include",
				body: JSON.stringify(registration),
				headers: {"Content-Type": "application/json"}
			})
			
			.then(res => {
				// Update table view by reloading page
				if (res.ok)
					location.search = url_params.toString();
				
				// Show alert message for internal server errors
				else if (res.status >= 500)
					alert("Cannot add registration due to server error.");
				
				// Redirect to login page if missing or invalid authorisation
				else if (res.status > 400)
					location.pathname = "/login_customer.html";
				
				// Show alert message for bad request
				else if (res.status === 400)
					alert("Cannot add registration; product already registered.");
			});
		});
		
		break;
	}
}
