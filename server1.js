
import express from 'express';
import multer from 'multer';
import mysql from 'mysql2';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

const app = express();
app.use(express.json());
app.use(bodyParser.json());


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Benny@7173',
    database: 'vems'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

const corsOptions = {
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.get('/test-cors', (req, res) => {
    res.json({ message: 'CORS is working!' });
});

const upload = multer({ dest: 'uploads/' });

// POST API to add vehicle details
app.post('/add-vehicle', (req, res) => {
    console.log('Request body:', req.body);

    const { vehicleName, vehicleType, vehicleNumber, vendorName,  insuranceNumber, mileage, yearOfManufacturing, fuelType, seatCapacity, vehicleImage } = req.body;

    // if (!vehicleDetails) {
    //     return res.status(400).json({ error: 'vehicleDetails is missing from the request body' });
    // }

    const query = `INSERT INTO Vehicle_Details1 (vehicleName, vehicleType, vehicleNumber, vendorName,  insuranceNumber, mileage, yearOfManufacturing, fuelType, seatCapacity, vehicleImage) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [
        vehicleName, vehicleType, vehicleNumber, vendorName,  insuranceNumber, mileage, yearOfManufacturing, fuelType, seatCapacity, vehicleImage
       
    ], (err, result) => {
        if (err) {
            console.log(err);
            console.error('Error inserting vehicle:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Vehicle added successfully', vehicleId: result.insertId });
    });
});

// POST API to add vehicle details from excel
app.post('/import-vehicles', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const query = `INSERT INTO Vehicle_Details1 (vehicleName, vehicleType, vehicleNumber, vendorName, insuranceNumber, mileage, yearOfManufacturing,  fuelType, seatCapacity, vehicleImage) 
                   VALUES ?`;

    const values = sheetData.map(row => [
        row.vehicleName, 
        row.vehicleType, 
        row.vehicleNumber, 
        row.vendorName,
        row.insuranceNumber,
        row.mileage,
        row.yearOfManufacturing, 
        row.fuelType, 
        row.seatCapacity, 
        row.vehicleImage,
        
    ]);

    db.query(query, [values], (err, result) => {
       
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error('Error deleting file:', unlinkErr);
            }
        });

        if (err) {
            console.error('Error importing vehicles:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Vehicles imported successfully', insertedRows: result.affectedRows });
    });
});


// GET API to retrieve a list of vehicles
app.get('/vehicles', (req, res) => {
    const query = `SELECT * FROM Vehicle_Details1`;
    // const query  = `SELECT v.*, d.* FROM Vehicle_Details v LEFT JOIN driver_details d ON v.vehicleId = d.vehicleId `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error retrieving vehicles:', err);
            return res.status(500).json({ error: 'Database error' });
        }
       
        res.status(200).json(results);

    });
});

// Get vehicle details by vehicleId
app.get('/vehicles/:vehicleId', (req, res) => {
    const vehicleId = req.params.vehicleId;

    const query = `SELECT v.*, d.* FROM Vehicle_Details1 v LEFT JOIN driver_details d ON v.vehicleId = d.vehicleId WHERE v.vehicleId = ? `
    
    db.query(query, [vehicleId], (err, result) => {
        if (err) {
            console.error('Error fetching vehicle details:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.status(200).json(result[0]); 
    });
});

// DELETE API to delete a vehicle by vehicleId
app.delete('/vehicles/:vehicleId', (req, res) => {
    const { vehicleId } = req.params;

    const query = `DELETE FROM Vehicle_Details1 WHERE vehicleId = ?`;

    db.query(query, [vehicleId], (err, result) => {
        if (err) {
            console.error('Error deleting vehicle:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.status(200).json({ message: 'Vehicle deleted successfully' });
    });
});

// PUT API to update vehicle details by vehicleId
app.put('/vehicles/:vehicleId', (req, res) => {
    const { vehicleId } = req.params;

    const {
        vehicleName,
        vehicleType,
        vehicleNumber,
        vendorName,
        insuranceNumber,
        mileage,
        year_of_manufacturing,
        fuelType,
        seatCapacity,
        vehicleImage
    } = req.body;

    const query = `UPDATE Vehicle_Details1 SET 
                    vehicleName = ?, 
                    vehicleType = ?, 
                    vehicleNumber = ?, 
                    vendorName = ?, 
                    insuranceNumber = ?, 
                    mileage = ?, 
                    year_of_manufacturing = ?, 
                    fuelType = ?, 
                    seatCapacity = ?, 
                    vehicleImage = ? 
                   WHERE vehicleId = ?`;

    db.query(query, [
        vehicleName,
        vehicleType,
        vehicleNumber,
        vendorName,
        insuranceNumber,
        mileage,
        year_of_manufacturing,
        fuelType,
        seatCapacity,
        vehicleImage,
        vehicleId
    ], (err, result) => {
        if (err) {
            console.error('Error updating vehicle:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.status(200).json({ message: 'Vehicle updated successfully' });
    });
});

// API to post trip details
app.post('/trips/book/:EmployeeId', (req, res) => {
    const { EmployeeId } = req.params; 
    const { date, shift, trip_type } = req.body;

    const employeeQuery = `SELECT EmployeeName, Address, latitude, longitude FROM employeedetails WHERE EmployeeId = ?`;
    db.query(employeeQuery, [EmployeeId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) return res.status(404).json({ error: 'Employee not found' });

        const { EmployeeName, Address, latitude, longitude } = result[0];
        const tripQuery = `INSERT INTO trips (EmployeeId, EmployeeName, Address, latitude, longitude, date, shift, trip_type) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(tripQuery, [EmployeeId, EmployeeName, Address, latitude, longitude, date, shift, trip_type], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Trip booked successfully', data: result });
        });
    });
});

app.listen(8081, () => {
    console.log('Server is running on port 8081');
});


