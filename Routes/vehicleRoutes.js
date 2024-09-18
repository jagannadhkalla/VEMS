const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { fileURLToPath } = require('url');
const app = express();
const db = require('../db')
const queries = require('../SQL/Queries.json')

app.use(express.json());

const router = express.Router()

const corsOptions = {
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

router.get('/test-cors', (req, res) => {
    res.json({ message: 'CORS is working!' });
});

const upload = multer({ dest: 'uploads/' });

router.post('/addVehicle', (req, res) => {

    const { vehicleName, vehicleType, vehicleNumber, vendorName,  insuranceNumber, mileage, yearOfManufacturing, fuelType, seatCapacity, vehicleImage } = req.body;

    const query = queries.vehicleQueries.addVehicle;

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

router.post('/importVehicles', upload.single('file'), (req, res) => {
    console.log(req.file); 
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = req.file.path;
    
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const query = queries.vehicleQueries.addvehicles;

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
    } catch (error) {
        console.error('Error reading file:', error);
        return res.status(500).json({ error: 'File processing error' });
    }
});

router.get('/vehicles', (req, res) => {
    const query = queries.vehicleQueries.getVehicles;
    // const query  = `SELECT v.*, d.* FROM Vehicle_Details v LEFT JOIN driverDetails d ON v.vehicleId = d.vehicleId `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error retrieving vehicles:', err);
            return res.status(500).json({ error: 'Database error' });
        }
       
        res.status(200).json(results);

    });
});

router.get('/vehicle/:vehicleId', (req, res) => {
    const vehicleId = req.params.vehicleId;

    const query = queries.vehicleQueries.getVehicleById
    
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

router.delete('/deleteVehicle/:vehicleId', (req, res) => {
    const { vehicleId } = req.params;

    const query = queries.vehicleQueries.deleteVehicle;

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


router.put('/updateVehicle/:vehicleId', (req, res) => {
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

    const query = queries.vehicleQueries.updateVehicle;

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

module.exports = router