const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const { Console } = require('console');
const cloudinary = require('cloudinary').v2;
const async = require('async');
const registerationMail = require('../mailService/registerationMail');
const forgotPasswordMail = require('../mailService/forgotPasswordMail');

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dhikrbq2f', 
    api_key: '913784743181965', 
    api_secret: 'Qfu9jaZ0cH1Q0X7PdoFnLkxhYjQ' 
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'harshit995905@gmail.com',
        pass: 'syyk rung ljrm arce',
    },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Uploads directory created.');
}

// Multer for file uploads
const upload = multer({ dest: uploadsDir });

// Function to generate random employeePassword
const generateRandomPassword = (length = 6) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

// upload Excel file and add employee data
router.post('/upload', upload.single('file'), (req, res) => {
    const filePath = path.join(uploadsDir, req.file.filename);
    
    const workbook = xlsx.readFile(filePath);
    const sheet_name = workbook.SheetNames[0];
    const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name]);

    // Create the employeeDetails table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS employeeDetails (
            employeeId VARCHAR(100) PRIMARY KEY, 
            employeeName VARCHAR(200), 
            employeeGender VARCHAR(20), 
            employeeAddress VARCHAR(255),  
            employeeCity VARCHAR(100), 
            employeeLatitude VARCHAR(100), 
            employeeLongitude VARCHAR(100), 
            employeeEmail VARCHAR(100), 
            employeeContact VARCHAR(20), 
            employeeEmergencyContact VARCHAR(20), 
            employeePassword VARCHAR(100),
            employeeImage VARCHAR(255)
        );
    `;

    // Create the table first
    db.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log('Table created or already exists.');
    });

    // Insert data into the table immediately
    sheet.forEach(row => {
        const employeePassword = generateRandomPassword(); // Generate password once

        // Inserting data including the generated password
        const query = `
            INSERT INTO employeeDetails 
            (employeeId, employeeName, employeeGender, employeeAddress, employeeCity, employeeLatitude, employeeLongitude, employeeEmail, employeeContact, employeeEmergencyContact, employeePassword, employeeImage) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            employeeName = VALUES(employeeName),
            employeeGender = VALUES(employeeGender),
            employeeAddress = VALUES(employeeAddress),
            employeeCity = VALUES(employeeCity),
            employeeLatitude = VALUES(employeeLatitude),
            employeeLongitude = VALUES(employeeLongitude),
            employeeEmail = VALUES(employeeEmail),
            employeeContact = VALUES(employeeContact),
            employeeEmergencyContact = VALUES(employeeEmergencyContact),
            employeePassword = VALUES(employeePassword),
            employeeImage = VALUES(employeeImage)
        `;

        const values = [
            row.employeeId,
            row.employeeName,
            row.employeeGender,
            row.employeeAddress,
            row.employeeCity,
            row.employeeLatitude,
            row.employeeLongitude,
            row.employeeEmail,
            row.employeeContact,
            row.employeeEmergencyContact,
            employeePassword, // Storing the generated password
            row.employeeImage
        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error inserting data', err);
            } else {
                console.log('Data inserted/updated successfully.');
            }
        });

        // Store the password in the row for later use in the email
        row.employeePassword = employeePassword;
    });

    // Send response to frontend after data is inserted
    res.send('File uploaded and mails are being processed.');

    // Now process the emails using async queue
    const emailQueue = async.queue((row, callback) => {
        const mailOptions = {
            from: 'harshit995905@gmail.com',
            to: row.employeeEmail,
            subject: 'Registration Confirmation - Account Details',
            html:`<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                            <div style="max-width: 700px; margin: 40px auto; background-color: #5bb450">
                                <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                                    
                                    <div style="background-color: #5bb450; padding: 20px; border-radius: 8px 8px 0 0;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;text-align: center; font-weight: bold">Registration Confirmation</h1>
                                    </div>
                                    
                                    <div style="padding: 20px; color: #333333; text-align: left;">
                                        <p style="line-height: 1.6;">Dear ${row.employeeName},</p>
                                        <p style="line-height: 1.6;">We are pleased to inform you that your employee details have been successfully updated in our records.</p>
                                        <p style="line-height: 1.6;">Here are your account details:</p>
                                        <p style="line-height: 1.6; margin: 0;"><strong>Employee ID:</strong> ${row.employeeId}</p>
                                        <p style="line-height: 1.6; margin: 0;"><strong>Password:</strong> ${row.employeePassword}</p>
                                        <p style="line-height: 1.6; margin-top: 20px;">Please ensure to change your password after logging in for the first time.</p>
                                        <p style="line-height: 1.6;">Best regards,</p>
                                        <p style="line-height: 1.0;"><strong>VEMS Support Team</strong></P>
                                        <p style="line-height: 1.0;">Contact No: 74166 33125</p>
                                        <p style="line-height: 1.0;">Email ID: vems-support@gmail.com</p>
                                    </div>
                                    
                                    <div style="padding: 20px; text-align: center; color: #aaaaaa; font-size: 12px;">
                                    <p>&copy; Copyright VTS Enterprises India Private Ltd, 2016</p>
                                    </div>
                                    
                                </div>
                            </div>
                        </body>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending Email:', error);
                callback(error);
            } else {
                console.log('Email sent:', info.response);
                callback();
            }
        });
    }, 1); // Process one email at a time (throttling)

    // Add emails to the queue
    sheet.forEach(row => {
        emailQueue.push(row, (err) => {
            if (err) {
                console.error('Error processing email for:', row.employeeId, row.employeeEmail, err);
            } else {
                console.log('Email processed for:',  row.employeeId, row.employeeEmail);
            }
        });
    });

    // When all emails are sent, delete the file
    emailQueue.drain(() => {
        console.log('All emails have been sent.');
        
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting the file:', err);
            } else {
                console.log('Uploaded file deleted.');
            }
        });
    });
});

// add employee with cloudinary image upload
router.post('/addEmployee', upload.single('employeeImage'), (req, res) => {
    const {
        employeeId,
        employeeName,
        employeeGender,
        employeeAddress,
        employeeCity,
        employeeLatitude,
        employeeLongitude,
        employeeEmail,
        employeeContact,
        employeeEmergencyContact
    } = req.body;
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS employeeDetails (
            employeeId VARCHAR(100) PRIMARY KEY, 
            employeeName VARCHAR(200), 
            employeeGender VARCHAR(20), 
            employeeAddress VARCHAR(255),  
            employeeCity VARCHAR(100), 
            employeeLatitude VARCHAR(100), 
            employeeLongitude VARCHAR(100), 
            employeeEmail VARCHAR(100) UNIQUE, 
            employeeContact VARCHAR(20), 
            employeeEmergencyContact VARCHAR(20), 
            employeePassword VARCHAR(100),
            employeeImage VARCHAR(255)
        );
    `;
    db.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log('Table created or already exists.');
    });
    const employeePassword = generateRandomPassword();
    if (req.file) {
        const filePath = req.file.path;

        cloudinary.uploader.upload(filePath, (err, result) => {
            if (err) {
                console.error('Error uploading to Cloudinary:', err);
                return res.status(500).send('Cloudinary upload failed');
            }
            const employeeImage = result.secure_url; // URL of the uploaded image
            console.log(result.secure_url);
            
            const query = `
                INSERT INTO employeeDetails 
                (employeeId, employeeName, employeeGender, employeeAddress, employeeCity, employeeLatitude, employeeLongitude, employeeEmail, employeeContact, employeeEmergencyContact, employeePassword, employeeImage) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                employeeName = VALUES(employeeName),
                employeeGender = VALUES(employeeGender),
                employeeAddress = VALUES(employeeAddress),
                employeeCity = VALUES(employeeCity),
                employeeLatitude = VALUES(employeeLatitude),
                employeeLongitude = VALUES(employeeLongitude),
                employeeEmail = VALUES(employeeEmail),
                employeeContact = VALUES(employeeContact),
                employeeEmergencyContact = VALUES(employeeEmergencyContact),
                employeePassword = VALUES(employeePassword),
                employeeImage = VALUES(employeeImage)
            `;

            const values = [
                employeeId,
                employeeName,
                employeeGender,
                employeeAddress,
                employeeCity,
                employeeLatitude,
                employeeLongitude,
                employeeEmail,
                employeeContact,
                employeeEmergencyContact,
                employeePassword,
                employeeImage
            ];

            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('Error inserting data into MySQL:', err);
                    res.status(500).send('Error inserting data');
                } else {
                    console.log('Data inserted/updated successfully.');
                    const query1 = 'SELECT * FROM employeeDetails WHERE employeeEmail = ?'
                    db.query(query1, employeeEmail, (err1, result1)=>{
                        if(err1){
                            console.log(err1)
                            res.send(err1)
                        }
                        console.log(result1[0])
                        registerationMail(result1[0])
                        res.send('successfully added')
                    })
                }
            });
        });
    } else {
        res.status(400).send('No image file uploaded');
    }
});

router.post('/login', (req, res) => {
    const { empId, password } = req.body;
    const query = 'SELECT * FROM employeeDetails WHERE employeeId = ?';
    db.query(query, [empId], async (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0) return res.status(404).send({ message: 'User not found!' });
      
      const user = results[0];
      const isValidPassword = (user.employeePassword === password);
      if (!isValidPassword) return res.status(401).send({ message: 'Invalid Password!'});
      res.send({ message: 'Login successful!', id: user.employeeId});
    });
});

router.post('/resetPassword', (req, res) => {
    const { employeeId } = req.body;

    const checkEmployeeQuery = 'SELECT * FROM employeeDetails WHERE employeeId = ?';
    db.query(checkEmployeeQuery, [employeeId], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) {
            const employee = results[0]; 
            const newPassword = generateRandomPassword();
            const updatePasswordQuery = 'UPDATE employeeDetails SET employeePassword = ? WHERE employeeId = ?';
            db.query(updatePasswordQuery, [newPassword, employeeId], (err, updateResult) => {
                if (err) {
                    console.error('Error updating Password:', err);
                    return res.status(500).json({ error: 'Error updating Password' });
                }
                else{
                    forgotPasswordMail(employee, newPassword)
                    res.send('Password updated successfully')
                }
        })
        }
        else{
            res.send('No employee found')
        }
    });
});

//change password
router.post('/changePassword', (req, res) => {
    const { employeeId, oldPassword, newPassword } = req.body;
    
    const query = 'SELECT employeePassword FROM employeeDetails WHERE employeeId = ?';   
    db.query(query, [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching data from MySQL:', err);
            res.status(500).send('Server error');
        } else if (results.length === 0) {
            res.status(404).send('Employee not found');
        } else {
            const dbPassword = results[0].employeePassword;
            if (dbPassword === oldPassword) {
                const updateQuery = 'UPDATE employeeDetails SET employeePassword = ? WHERE employeeId = ?';
                db.query(updateQuery, [newPassword, employeeId], (err, result) => {
                    if (err) {
                        console.error('Error updating password in MySQL:', err);
                        res.status(500).send('Error updating password');
                    } else {
                        res.send('Password updated successfully');
                    }
                });
            } else {
                res.status(401).send('Incorrect old password');
            }
        }
    });
});

//show all employee details
router.get('/showEmployee', (req, res) => {
    const query = "SELECT * FROM employeeDetails";
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    })
});

//show employee by id
router.get('/showEmployee/:empId', (req,res) => {
    const empId = req.params.empId;
    const query = "SELECT * FROM employeeDetails where employeeId = ?";
    db.query(query, empId, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    })
});

//update employee by id
router.post('/updateEmployee/:empId', upload.single('employeeImage'), (req, res) => {
    const empId = req.params.empId;
    const { 
        employeeName, 
        employeeGender, 
        employeeAddress, 
        employeeCity, 
        employeeLatitude, 
        employeeLongitude, 
        employeeContact, 
        employeeEmergencyContact,
        employeePassword
    } = req.body;

    // Upload image to Cloudinary if file is provided
    if (req.file) {
        const filePath = req.file.path;
        cloudinary.uploader.upload(filePath, (err, result) => {
            if (err) {
                console.error('Error uploading to Cloudinary:', err);
                return res.status(500).send('Cloudinary upload failed');
            }

            const employeeImage = result.secure_url;

            const query = `
                UPDATE employeeDetails 
                SET 
                    employeeName = ?, 
                    employeeGender = ?, 
                    employeeAddress = ?, 
                    employeeCity = ?, 
                    employeeLatitude = ?, 
                    employeeLongitude = ?, 
                    employeeContact = ?, 
                    employeeEmergencyContact = ?,
                    employeePassword = ?,
                    employeeImage = ?
                WHERE employeeId = ?
            `;

            const values = [
                employeeName, 
                employeeGender, 
                employeeAddress, 
                employeeCity, 
                employeeLatitude, 
                employeeLongitude, 
                employeeContact, 
                employeeEmergencyContact,
                employeePassword || null,
                employeeImage,
                empId
            ];

            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('Error updating employee details:', err);
                    return res.status(500).send('Database update failed');
                }

                res.send({ message: 'Employee details updated successfully!' });
            });
        });
    } else {
        // If no image file is provided, update employee data without changing the image
        const query = `
            UPDATE employeeDetails 
            SET 
                employeeName = ?, 
                employeeGender = ?, 
                employeeAddress = ?, 
                employeeCity = ?, 
                employeeLatitude = ?, 
                employeeLongitude = ?, 
                employeeContact = ?, 
                employeeEmergencyContact = ?,
                employeePassword = ?
            WHERE employeeId = ?
        `;

        const values = [
            employeeName, 
            employeeGender, 
            employeeAddress, 
            employeeCity, 
            employeeLatitude, 
            employeeLongitude, 
            employeeContact, 
            employeeEmergencyContact,
            employeePassword || null,
            empId
        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error updating employee details:', err);
                return res.status(500).send('Database update failed');
            }

            res.send({ message: 'Employee details updated successfully!' });
        });
    }
});

//delete employee by id
router.post('/deleteEmployee/:empId', (req, res) => {
    const empId = req.params.empId;
    const query = "DELETE FROM employeeDetails WHERE employeeId = ?";
    db.query(query, empId, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Employee Deleted successfully!' });
    })
});

//create trip request
router.post('/trips', (req, res) => {
    const { employeeId, date, inTime, outTime } = req.body;

    const createTripsTable = `
        CREATE TABLE IF NOT EXISTS cabBookingTable   (
            bookingId VARCHAR(6) PRIMARY KEY,
            employeeId VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            inTime TIME NULL,
            outTime TIME NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    db.query(createTripsTable, (err, result) => {
        if (err) throw err;
        console.log('Trips table created/exists!');
    });

    if (!employeeId || !date) {
        return res.status(400).send('employeeId and date are required');
    }

    const generateNextID = (lastID) => {
        if (!lastID) {
            return 'BK0001';
        }

        const prefix = 'BK';
        const num = parseInt(lastID.substring(2), 10);
        const nextNum = num + 1;
        return prefix + nextNum.toString().padStart(4, '0');
    };

    const selectQuery = `SELECT * FROM Trips WHERE employeeId = ? AND date = ?`;

    db.query(selectQuery, [employeeId, date], (err, results) => {
        if (err) {
            console.error('Error fetching trip data:', err);
            return res.status(500).send('Error fetching trip data');
        }

        if (results.length > 0) {
            const existingTrip = results[0];
            const updatedInTime = inTime ? inTime : existingTrip.inTime;
            const updatedOutTime = outTime ? outTime : existingTrip.outTime;

            const updateQuery = `UPDATE Trips SET inTime = ?, outTime = ? WHERE employeeId = ? AND date = ?`;

            db.query(updateQuery, [updatedInTime, updatedOutTime, employeeId, date], (err, result) => {
                if (err) {
                    console.error('Error updating trip:', err);
                    return res.status(500).send('Error updating trip');
                }
                return res.status(200).send('Trip updated successfully');
            });

        } else {
            // If no row exists, generate a new ID and insert a new row
            const getLastIDQuery = `SELECT id FROM Trips ORDER BY id DESC LIMIT 1`;

            db.query(getLastIDQuery, (err, rows) => {
                if (err) {
                    console.error('Error fetching last ID:', err);
                    return res.status(500).send('Error fetching last ID');
                }

                const lastID = rows.length > 0 ? rows[0].id : null;
                const newID = generateNextID(lastID);

                const insertQuery = `INSERT INTO Trips (id, employeeId, date, inTime, outTime) VALUES (?, ?, ?, ?, ?)`;

                db.query(insertQuery, [newID, employeeId, date, inTime, outTime], (err, result) => {
                    if (err) {
                        console.error('Error creating trip:', err);
                        return res.status(500).send('Error creating trip');
                    }
                    return res.status(200).send('Trip created successfully');
                });
            });
        }
    });
});

// Cancel and delete trip request if necessary
router.post('/canceltrip/:tripId', (req, res) => {
    const { tripId } = req.params;
    const { inTime, outTime } = req.body;
    console.log("canceltrip", inTime, outTime, req.body)
  
    let updateQuery = '';
  
    if (inTime === null) {
      updateQuery = 'UPDATE trips SET inTime = NULL WHERE id = ?';
    } else if (outTime === null) {
      updateQuery = 'UPDATE trips SET outTime = NULL WHERE id = ?';
    }
  
    // Update the trip
    db.query(updateQuery, [tripId], (err, result) => {
      if (err) {
        console.error('Error updating trip:', err);
        return res.status(500).json({ message: 'Failed to update trip.' });
      }
  
      // After the update, check if both inTime and outTime are NULL
      const checkQuery = 'SELECT inTime, outTime FROM trips WHERE id = ?';
      db.query(checkQuery, [tripId], (err, rows) => {
        if (err) {
          console.error('Error fetching trip details:', err);
          return res.status(500).json({ message: 'Failed to fetch trip details.' });
        }
  
        const trip = rows[0];
        console.log("trip",trip)
  
        // If both inTime and outTime are NULL, delete the trip
        if (trip.inTime === null && trip.outTime === null) {
          const deleteQuery = 'DELETE FROM trips WHERE id = ?';
          db.query(deleteQuery, [tripId], (err, deleteResult) => {
            if (err) {
              console.error('Error deleting trip:', err);
              return res.status(500).json({ message: 'Failed to delete trip.' });
            }
  
            return res.status(200).json({ message: 'Trip deleted successfully' });
          });
        } else {
          // Return the updated trip details if not deleted
          res.status(200).json(trip);
        }
      });
    });
  });


//show trip request by id
router.get('/showtrips/:empId', (req,res) => {
    const empId = req.params.empId;
    const query = "SELECT * FROM trips where employeeId = ?";
    db.query(query, empId, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    })
});

module.exports = router;