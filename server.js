import express from "express";
import dotenv from "dotenv";
import pg from "pg";
import { check, validationResult } from 'express-validator';

//const { Client } = pg;  //<--not used if using pool()
const { Pool } = pg;

const app = express();
app.use(express.static("public"));  //<-- right after `app` is created and before routes

dotenv.config();  //<-- has to be before 'process.env' is called
const port = process.env.PORT || 3000;

//const client = new Client(process.env.DATABASE_URL);
//client.connect();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5 //<--max num of connections, change as needed
});

app.use(express.json());  //<--has to be before routes

app.get("/", function(req, res) {   
    res.send("Hello, world!");
});

app.get('/api/vacations', function(req, res) {
    pool.query(`SELECT * FROM destinations`, function(err, response) {
        console.log(err ? err : response.rows)
        res.json(response.rows)
    })
})

app.get('/api/vacations/:id', function(req, res) {
    const id = req.params.id; // Get the id from URL parameter

    // Use the id to query the database and retrieve the vacation data for the specified id
    pool.query(`SELECT * FROM destinations WHERE id = $1`, [id], function(err, response) {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        } else if (response.rowCount === 0) {
            res.status(404).json({ message: 'Destination not found' });
        } else {
            res.json(response.rows[0]);
        }
    });
});

app.post('/api/vacations', [
    check('country').notEmpty().withMessage('Country is required'),
    // Add validation checks for other fields as needed
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Return validation errors to the client-side
        return res.status(400).json({ errors: errors.array() });
    }
    console.log(req.body);
    
    // Rest of the code for inserting data into the database


    pool.query('INSERT INTO destinations (country, city_state, climate) VALUES ($1, $2, $3) RETURNING * ',[
        req.body.country,
        req.body.city_state, 
        req.body.climate
     ])
      .then((result) => {
         // Send relevant response data to client-side
         res.status(201).json({ message: "Destimation added successfully", destinations: result.rows[0] });
     })
     .catch((error) => {
         // Handle database errors
         console.error(error);
         res.status(500).json({ message: "Internal server error" });
     });
     
}); 


app.delete('/api/vacations/:id', (req, res) => {
    const id = req.params.id; // Get the id from URL parameter

    pool.query('DELETE FROM destinations WHERE id = $1 RETURNING *', [id])
    .then((result) => {
        if (result.rowCount === 0) {
            // If no rows were affected, return an error
            res.status(404).json({ message: 'Destination not found' });
        } else {
            // Send relevant response data to client-side
            res.json({ message: 'Destination deleted successfully', destinations: result.rows[0] });
        }
    })
    .catch((error) => {
        // Handle database errors
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    });
});

app.patch('/api/vacations/:id', (req, res) => {
    const id = req.params.id; // Get the id from URL parameter
    const { climate } = req.body; // Get the updated data from request body

    pool.query('UPDATE destinations SET climate = $1 WHERE id = $2 RETURNING *', [
        climate, id // Pass both climate and id as parameters
    ])
    .then((result) => {
        if (result.rowCount === 0) {
            // If no rows were affected, return an error
            res.status(404).json({ message: 'Destination not found' });
        } else {
            // Send relevant response data to client-side
            res.json({ message: 'Destination updated successfully', destinations: result.rows[0] });
        }
    })
    .catch((error) => {
        // Handle database errors
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    });
});


app.listen(port, function(err) {
    if (err) {
        console.error(err);
    } else {
        console.log(`Server started on port ${port}`);
    }
});