// const express = require('express');
// const multer = require('multer');
// const xlsx = require('xlsx');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');
// const { fileURLToPath } = require('url');
// const app = express();
// const db = require('../db')
// const queries = require('../SQL/Queries.json')

// app.use(express.json());

// const router = express.Router()

// const corsOptions = {
//     origin: '*',
//     methods: ['GET','POST','PUT','DELETE','OPTIONS'],
//     allowedHeaders: 'Content-Type, Authorization',
//     credentials: true,
//     optionsSuccessStatus: 200,
// };

// app.use(cors(corsOptions));

// router.get('/test-cors', (req, res) => {
//     res.json({ message: 'CORS is working!' });
// });

// const upload = multer({ dest: 'uploads/' });

// router.post('/addVehicle', (req, res) => {

//     const { VehicleName, VehicleType, VehicleNumber, vendorName,  insuranceNumber, mileage, yearOfManufacturing, fuelType, seatCapacity, VehicleImage } = req.body;

//     const query = queries.VehicleQueries.addVehicle;

//     db.query(query, [
//         VehicleName, VehicleType, VehicleNumber, vendorName,  insuranceNumber, mileage, yearOfManufacturing, fuelType, seatCapacity, VehicleImage
       
//     ], (err, result) => {
//         if (err) {
//             console.log(err);
//             console.error('Error inserting Vehicle:', err);
//             return res.status(500).json({ error: 'Database error' });
//         }
//         res.status(201).json({ message: 'Vehicle added successfully', VehicleId: result.insertId });
//     });
// });

// router.post('/importVehicles', upload.single('file'), (req, res) => {
//     console.log(req.file); 
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }
//     const filePath = req.file.path;
    
//     try {
//         const workbook = xlsx.readFile(filePath);
//         const sheetName = workbook.SheetNames[0];
//         const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//         const query = queries.VehicleQueries.addVehicles;

//         const values = sheetData.map(row => [
//             row.VehicleName, 
//             row.VehicleType, 
//             row.VehicleNumber, 
//             row.vendorName,
//             row.insuranceNumber,
//             row.mileage,
//             row.yearOfManufacturing, 
//             row.fuelType, 
//             row.seatCapacity, 
//             row.VehicleImage,
//         ]);

//         db.query(query, [values], (err, result) => {
//             fs.unlink(filePath, (unlinkErr) => {
//                 if (unlinkErr) {
//                     console.error('Error deleting file:', unlinkErr);
//                 }
//             });

//             if (err) {
//                 console.error('Error importing Vehicles:', err);
//                 return res.status(500).json({ error: 'Database error' });
//             }
//             res.status(201).json({ message: 'Vehicles imported successfully', insertedRows: result.affectedRows });
//         });
//     } catch (error) {
//         console.error('Error reading file:', error);
//         return res.status(500).json({ error: 'File processing error' });
//     }
// });

// router.get('/Vehicles', (req, res) => {
//     const query = queries.VehicleQueries.getVehicles;
//     // const query  = `SELECT v.*, d.* FROM Vehicle_Details v LEFT JOIN driverDetails d ON v.VehicleId = d.VehicleId `;
//     db.query(query, (err, results) => {
//         if (err) {
//             console.error('Error retrieving Vehicles:', err);
//             return res.status(500).json({ error: 'Database error' });
//         }
       
//         res.status(200).json(results);

//     });
// });

// router.get('/Vehicle/:VehicleId', (req, res) => {
//     const VehicleId = req.params.VehicleId;

//     const query = queries.VehicleQueries.getVehicleById
    
//     db.query(query, [VehicleId], (err, result) => {
//         if (err) {
//             console.error('Error fetching Vehicle details:', err);
//             return res.status(500).json({ error: 'Database error' });
//         }
//         if (result.length === 0) {
//             return res.status(404).json({ error: 'Vehicle not found' });
//         }
//         res.status(200).json(result[0]); 
//     });
// });

// router.delete('/deleteVehicle/:VehicleId', (req, res) => {
//     const { VehicleId } = req.params;

//     const query = queries.VehicleQueries.deleteVehicle;

//     db.query(query, [VehicleId], (err, result) => {
//         if (err) {
//             console.error('Error deleting Vehicle:', err);
//             return res.status(500).json({ error: 'Database error' });
//         }

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'Vehicle not found' });
//         }

//         res.status(200).json({ message: 'Vehicle deleted successfully' });
//     });
// });


// router.put('/updateVehicle/:VehicleId', (req, res) => {
//     const { VehicleId } = req.params;

//     const {
//         VehicleName,
//         VehicleType,
//         VehicleNumber,
//         vendorName,
//         insuranceNumber,
//         mileage,
//         year_of_manufacturing,
//         fuelType,
//         seatCapacity,
//         VehicleImage
//     } = req.body;

//     const query = queries.VehicleQueries.updateVehicle;

//     db.query(query, [
//         VehicleName,
//         VehicleType,
//         VehicleNumber,
//         vendorName,
//         insuranceNumber,
//         mileage,
//         year_of_manufacturing,
//         fuelType,
//         seatCapacity,
//         VehicleImage,
//         VehicleId
//     ], (err, result) => {
//         if (err) {
//             console.error('Error updating Vehicle:', err);
//             return res.status(500).json({ error: 'Database error' });
//         }

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'Vehicle not found' });
//         }

//         res.status(200).json({ message: 'Vehicle updated successfully' });
//     });
// });

// module.exports = router






const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { fileURLToPath } = require('url');
const app = express();
const db = require('../db');
const queries = require('../SQL/Queries.json');

app.use(express.json());

const router = express.Router();

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

    const { VehicleName, VehicleType, VehicleNumber, VendorName, InsuranceNumber, VehicleMileageRange, VehicleManufacturedYear, VehicleFuelType, VehicleSeatCapacity, VehicleImage } = req.body;

    const query = queries.VehicleQueries.addVehicle;

    db.query(query, [
        VehicleName, VehicleNumber, VehicleMileageRange, VehicleManufacturedYear, VehicleSeatCapacity, VehicleType, VehicleImage, InsuranceNumber, VehicleFuelType, VendorName
    ], (err, result) => {
        if (err) {
            console.log(err);
            console.error('Error inserting Vehicle:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Vehicle added successfully', VehicleId: result.insertId });
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

        const query = queries.VehicleQueries.addVehicles;

        const values = sheetData.map(row => [
            row.VehicleName, 
            row.VehicleNumber, 
            row.VehicleMileageRange, 
            row.VehicleManufacturedYear, 
            row.VehicleSeatCapacity, 
            row.VehicleType, 
            row.VehicleImage, 
            row.VehicleInsuranceNumber, 
            row.VehicleFuelType, 
            row.VendorName
        ]);

        db.query(query, [values], (err, result) => {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting file:', unlinkErr);
                }
            });

            if (err) {
                console.error('Error importing Vehicles:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'Vehicles imported successfully', insertedRows: result.affectedRows });
        });
    } catch (error) {
        console.error('Error reading file:', error);
        return res.status(500).json({ error: 'File processing error' });
    }
});

router.get('/Vehicles', (req, res) => {
    const query = queries.VehicleQueries.getVehicles;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error retrieving Vehicles:', err);
            return res.status(500).json({ error: 'Database error' });
        }
       
        res.status(200).json(results);
    });
});

router.get('/Vehicle/:VehicleId', (req, res) => {
    const VehicleId = req.params.VehicleId;

    const query = queries.VehicleQueries.getVehicleById;
    
    db.query(query, [VehicleId], (err, result) => {
        if (err) {
            console.error('Error fetching Vehicle details:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.status(200).json(result[0]); 
    });
});

router.delete('/deleteVehicle/:VehicleId', (req, res) => {
    const { VehicleId } = req.params;

    const query = queries.VehicleQueries.deleteVehicle;

    db.query(query, [VehicleId], (err, result) => {
        if (err) {
            console.error('Error deleting Vehicle:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.status(200).json({ message: 'Vehicle deleted successfully' });
    });
});

router.put('/updateVehicle/:VehicleId', (req, res) => {
    const { VehicleId } = req.params;

    const {
        VehicleName,
        VehicleNumber,
        VehicleMileageRange,
        VehicleManufacturedYear,
        VehicleSeatCapacity,
        VehicleType,
        VehicleImage,
        InsuranceNumber,
        VehicleFuelType,
        VendorName
    } = req.body;

    const query = queries.VehicleQueries.updateVehicle;

    db.query(query, [
        VehicleName,
        VehicleNumber,
        VehicleMileageRange,
        VehicleManufacturedYear,
        VehicleSeatCapacity,
        VehicleType,
        VehicleImage,
        InsuranceNumber,
        VehicleFuelType,
        VendorName,
        VehicleId
    ], (err, result) => {
        if (err) {
            console.error('Error updating Vehicle:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        res.status(200).json({ message: 'Vehicle updated successfully' });
    });
});

module.exports = router;
