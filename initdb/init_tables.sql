BEGIN;
	-- Relationships:
	-- 1. Many-to-One: Customers to Countries
	-- 2. Many-to-One: Incidents to Customers
	-- 3. Many-to-One: Incidents to Products
	-- 4. Many-to-One: Incidents to Technicians
	-- 5. Many-to-Many: Customers to Products (through Registrations)
	
	-- Example data:
	-- Countries: US, CA, MX, UK, etc.
	-- Products: DRAFT10 (Draft Manager 1.0), LEAG10 (League Scheduler 1.0), etc.
	-- Technicians: Support staff with names, contact info
	-- Customers: Users of the sports software products
	-- Incidents: Support tickets logged by customers
	-- Registrations: Which customers have registered which products
	-- Administrators: Admin users for the support system
	
	-- IMPORTANT:
	-- Every password is really just 'password' for easy debugging purposes;
	-- Change them ASAP when deploying to production.
	
	-- Countries
	CREATE TABLE countries(
		code CHAR(2) PRIMARY KEY,
		name VARCHAR(50) NOT NULL
	);
	
	INSERT INTO countries VALUES
	('CA', 'Canada'),
	('MX', 'Mexico'),
	('US', 'United States');
	
	-- Products
	CREATE TABLE products(
		code VARCHAR(10) PRIMARY KEY,
		name VARCHAR(50) NOT NULL,
		version DECIMAL(18, 1) NOT NULL,
		release_date DATE NOT NULL
	);
	
	INSERT INTO products VALUES
	('DRAFT10', 'Draft Manager 1.0',    '1.0', '2022-03-01'),
	('LEAG10',  'League Scheduler 1.0', '1.0', '2022-06-01'),
	('TEAM10',  'Team Monitor 1.0',     '1.0', '2023-02-01');
	
	-- Customers
	CREATE TABLE customers(
		id SERIAL PRIMARY KEY,
		
		first_name VARCHAR(50) NOT NULL,
		last_name VARCHAR(50) NOT NULL,
		
		address VARCHAR(50) NOT NULL,
		city VARCHAR(50) NOT NULL,
		state VARCHAR(50) NOT NULL,
		postcode VARCHAR(20) NOT NULL,
		
		country CHAR(2) NOT NULL REFERENCES countries(code),
		email VARCHAR(100) NOT NULL UNIQUE,
		phone VARCHAR(20) NOT NULL,
		password VARCHAR(60) NOT NULL
	);
	
	INSERT INTO customers (
		first_name, last_name,
		address, city, state, postcode,
		country, email, phone, password
	) VALUES (
		'David', 'Thompson',
		'123 Main St', 'New York', 'NY', 10001,
		'US', 'david@example.com', '212-555-1212', '$2a$12$dOu3TkY7EnkNUNKF5WFv0eQvPO/BwETSmR3fGEa2yyLheRWjgeGka'
	), (
		'Michael', 'Chen',
		'456 Lake St', 'Montreal', 'QC', 10001,
		'CA', 'chen@example.com', '514-711-6543', '$2a$12$dOu3TkY7EnkNUNKF5WFv0eQvPO/BwETSmR3fGEa2yyLheRWjgeGka'
	), (
		'Sarah', 'Garcia',
		'789 Bay St', 'Victoria de Durango', 'DUR', 10001,
		'MX', 'sarah@example.com', '618-888-4218', '$2a$12$dOu3TkY7EnkNUNKF5WFv0eQvPO/BwETSmR3fGEa2yyLheRWjgeGka'
	);
	
	-- Technicians
	CREATE TABLE technicians(
		id SERIAL PRIMARY KEY,
		
		first_name VARCHAR(50) NOT NULL,
		last_name VARCHAR(50) NOT NULL,
		
		email VARCHAR(100) NOT NULL UNIQUE,
		phone VARCHAR(12) NOT NULL,
		password VARCHAR(60) NOT NULL
	);
	
	INSERT INTO technicians (
		first_name, last_name,
		email, phone, password
	) VALUES
	('John', 'Doe',     'john.doe@sportspro.com',     '800-555-0443', '$2a$12$dOu3TkY7EnkNUNKF5WFv0eQvPO/BwETSmR3fGEa2yyLheRWjgeGka'),
	('Jane', 'Smith',   'jane.smith@sportspro.com',   '800-555-0459', '$2a$12$dOu3TkY7EnkNUNKF5WFv0eQvPO/BwETSmR3fGEa2yyLheRWjgeGka'),
	('Mike', 'Johnson', 'mike.johnson@sportspro.com', '800-555-0470', '$2a$12$dOu3TkY7EnkNUNKF5WFv0eQvPO/BwETSmR3fGEa2yyLheRWjgeGka');
	
	-- Incidents table
	CREATE TABLE incidents(
		id SERIAL PRIMARY KEY,
		
		customer_id INTEGER NOT NULL REFERENCES customers(id),
		product_code VARCHAR(10) NOT NULL REFERENCES products(code),
		technician_id INTEGER REFERENCES technicians(id),
		
		date_opened TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		date_closed TIMESTAMP,
		
		title VARCHAR(50) NOT NULL,
		description TEXT NOT NULL
	);
	
	INSERT INTO incidents(
		customer_id, product_code, technician_id,
		date_opened,
		title, description
	) VALUES
	(1, 'LEAG10',  1, '2023-03-15', 'Error importing data',       'Unable to import CSV file for data visualization purposes. Issue only happens on Mac computers.'),
	(3, 'DRAFT10', 2, '2023-03-16', 'Program crashes on startup', 'Logs indicate possible library linking and I/O errors on certain Windows 11 machines. Asked customer to run a disk health checkup. Problem revealed to be failing hard disk drives, recommended new drives. Otherwise, this is largely outside the scope of technical support.'),
	(2, 'TEAM10',  3, '2023-03-20', 'Report generation failure',  'Unable to generate end-of-season statistics report. The application crashes when attempting to run reports. Customer has tried reinstalling the application without success. Issue occurs on both Windows 10 and 11 machines.');
	
	UPDATE incidents SET date_closed='2023-03-18' WHERE id=2;
	
	-- Registrations table
	CREATE TABLE registrations(
		customer_id INTEGER NOT NULL REFERENCES customers(id),
		product_code VARCHAR(10) NOT NULL REFERENCES products(code),
		date_registered TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (customer_id, product_code)
	);
	
	-- Administrators table
	CREATE TABLE admins(
		username VARCHAR(40) PRIMARY KEY,
		password VARCHAR(60) NOT NULL
	);
	INSERT INTO admins VALUES('admin', '$2a$12$dOu3TkY7EnkNUNKF5WFv0eQvPO/BwETSmR3fGEa2yyLheRWjgeGka');
END;
