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
const queries = require('../SQL/Queries.json')

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

// Function to generate random EmployeePassword
const generateRandomPassword = (length = 6) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

// upload Excel file and add Employee data
router.post('/upload', upload.single('file'), (req, res) => {
    const filePath = path.join(uploadsDir, req.file.filename);
    
    const workbook = xlsx.readFile(filePath);
    const sheet_name = workbook.SheetNames[0];
    const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name]);

    // Create the EmployeeDetails table if it doesn't exist
    const createTableQuery = queries.EmployeeQueries.createEmployeeTable;

    // Create the table first
    db.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log('Table created or already exists.');
    });

    // Insert data into the table immediately
    sheet.forEach(row => {
        const EmployeePassword = generateRandomPassword(); // Generate password once

        // Inserting data including the generated password
        const query = queries.EmployeeQueries.addEmployee;

        const values = [
            row.EmployeeId,
            row.EmployeeName,
            row.EmployeeGender,
            row.EmployeeAddress,
            row.EmployeeCity,
            row.EmployeeLatitude,
            row.EmployeeLongitude,
            row.EmployeeEmail,
            row.EmployeeContact,
            row.EmployeeEmergencyContact,
            EmployeePassword, // Storing the generated password
            row.EmployeeImage
        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error inserting data', err);
            } else {
                console.log('Data inserted/updated successfully.');
            }
        });

        // Store the password in the row for later use in the email
        row.EmployeePassword = EmployeePassword;
    });

    // Send response to frontend after data is inserted
    res.send('File uploaded and mails are being processed.');

    // Now process the emails using async queue
    const emailQueue = async.queue((row, callback) => {
        const mailOptions = {
            from: 'harshit995905@gmail.com',
            to: row.EmployeeEmail,
            subject: 'Registration Confirmation - Account Details',
            html:`<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                            <div style="max-width: 700px; margin: 40px auto; background-color: #5bb450">
                                <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                                    
                                    <div style="background-color: #5bb450; padding: 20px; border-radius: 8px 8px 0 0;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;text-align: center; font-weight: bold">Registration Confirmation</h1>
                                    </div>
                                    
                                    <div style="padding: 20px; color: #333333; text-align: left;">
                                        <p style="line-height: 1.6;">Dear ${row.EmployeeName},</p>
                                        <p style="line-height: 1.6;">We are pleased to inform you that your Employee details have been successfully updated in our records.</p>
                                        <p style="line-height: 1.6;">Here are your account details:</p>
                                        <p style="line-height: 1.6; margin: 0;"><strong>Employee ID:</strong> ${row.EmployeeId}</p>
                                        <p style="line-height: 1.6; margin: 0;"><strong>Password:</strong> ${row.EmployeePassword}</p>
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
                console.error('Error processing email for:', row.EmployeeId, row.EmployeeEmail, err);
            } else {
                console.log('Email processed for:',  row.EmployeeId, row.EmployeeEmail);
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

// add Employee with cloudinary image upload
router.post('/addEmployee', upload.single('EmployeeImage'), (req, res) => {
    const {
        EmployeeId,
        EmployeeName,
        EmployeeGender,
        EmployeeAddress,
        EmployeeCity,
        EmployeeLatitude,
        EmployeeLongitude,
        EmployeeEmail,
        EmployeeContact,
        EmployeeEmergencyContact
    } = req.body;
    const createTableQuery = queries.EmployeeQueries.createEmployeeTable;
    db.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log('Table created or already exists.');
    });
    const EmployeePassword = generateRandomPassword();
    if (req.file) {
        const filePath = req.file.path;

        cloudinary.uploader.upload(filePath, (err, result) => {
            if (err) {
                console.error('Error uploading to Cloudinary:', err);
                return res.status(500).send('Cloudinary upload failed');
            }
            const EmployeeImage = result.secure_url; // URL of the uploaded image
            console.log(result.secure_url);
            
            const query = queries.EmployeeQueries.addEmployee;

            const values = [
                EmployeeId,
                EmployeeName,
                EmployeeGender,
                EmployeeAddress,
                EmployeeCity,
                EmployeeLatitude,
                EmployeeLongitude,
                EmployeeEmail,
                EmployeeContact,
                EmployeeEmergencyContact,
                EmployeePassword,
                EmployeeImage
            ];

            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('Error inserting data into MySQL:', err);
                    res.status(500).send('Error inserting data');
                } else {
                    console.log('Data inserted/updated successfully.');
                    const query1 = 'SELECT * FROM EmployeeDetails WHERE EmployeeEmail = ?'
                    db.query(query1, EmployeeEmail, (err1, result1)=>{
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
    const query = queries.EmployeeQueries.getEmployeebyId;
    db.query(query, [empId], async (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0) return res.status(404).send({ message: 'User not found!' });
      
      const user = results[0];
      const isValidPassword = (user.EmployeePassword === password);
      if (!isValidPassword) return res.status(401).send({ message: 'Invalid Password!'});
      res.send({ message: 'Login successful!', id: user.EmployeeId});
    });
});

router.post('/resetPassword', (req, res) => {
    const { EmployeeId } = req.body;

    const checkEmployeeQuery = queries.EmployeeQueries.getEmployeebyId;
    db.query(checkEmployeeQuery, [EmployeeId], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) {
            const Employee = results[0]; 
            const newPassword = generateRandomPassword();
            const updatePasswordQuery = 'UPDATE EmployeeDetails SET EmployeePassword = ? WHERE EmployeeId = ?';
            db.query(updatePasswordQuery, [newPassword, EmployeeId], (err, updateResult) => {
                if (err) {
                    console.error('Error updating Password:', err);
                    return res.status(500).json({ error: 'Error updating Password' });
                }
                else{
                    forgotPasswordMail(Employee, newPassword)
                    res.send('Password updated successfully')
                }
        })
        }
        else{
            res.send('No Employee found')
        }
    });
});

//change password
router.post('/changePassword', (req, res) => {
    const { EmployeeId, oldPassword, newPassword } = req.body;
    
    const query = 'SELECT EmployeePassword FROM EmployeeDetails WHERE EmployeeId = ?';   
    db.query(query, [EmployeeId], (err, results) => {
        if (err) {
            console.error('Error fetching data from MySQL:', err);
            res.status(500).send('Server error');
        } else if (results.length === 0) {
            res.status(404).send('Employee not found');
        } else {
            const dbPassword = results[0].EmployeePassword;
            if (dbPassword === oldPassword) {
                const updateQuery = 'UPDATE EmployeeDetails SET EmployeePassword = ? WHERE EmployeeId = ?';
                db.query(updateQuery, [newPassword, EmployeeId], (err, result) => {
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

//show all Employee details
router.get('/showEmployee', (req, res) => {
    const query = queries.EmployeeQueries.getEmployees;
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    })
});

//show Employee by id
router.get('/showEmployee/:empId', (req,res) => {
    const empId = req.params.empId;
    const query = queries.EmployeeQueries.getEmployeebyId;
    db.query(query, empId, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    })
});

//update Employee by id
router.post('/updateEmployee/:empId', upload.single('EmployeeImage'), (req, res) => {
    const empId = req.params.empId;
    const { 
        EmployeeName, 
        EmployeeGender, 
        EmployeeAddress, 
        EmployeeCity, 
        EmployeeLatitude, 
        EmployeeLongitude, 
        EmployeeContact, 
        EmployeeEmergencyContact,
        EmployeePassword
    } = req.body;

    // Upload image to Cloudinary if file is provided
    if (req.file) {
        const filePath = req.file.path;
        cloudinary.uploader.upload(filePath, (err, result) => {
            if (err) {
                console.error('Error uploading to Cloudinary:', err);
                return res.status(500).send('Cloudinary upload failed');
            }

            const EmployeeImage = result.secure_url;

            const query = queries.EmployeeQueries.updateEmployeeDetails;

            const values = [
                EmployeeName, 
                EmployeeGender, 
                EmployeeAddress, 
                EmployeeCity, 
                EmployeeLatitude, 
                EmployeeLongitude, 
                EmployeeContact, 
                EmployeeEmergencyContact,
                EmployeePassword || null,
                EmployeeImage,
                empId
            ];

            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('Error updating Employee details:', err);
                    return res.status(500).send('Database update failed');
                }

                res.send({ message: 'Employee details updated successfully!' });
            });
        });
    } else {
        // If no image file is provided, update Employee data without changing the image
        const query = queries.EmployeeQueries.updateEmployeeDetails;

        const values = [
            EmployeeName, 
            EmployeeGender, 
            EmployeeAddress, 
            EmployeeCity, 
            EmployeeLatitude, 
            EmployeeLongitude, 
            EmployeeContact, 
            EmployeeEmergencyContact,
            EmployeePassword || null,
            empId
        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error updating Employee details:', err);
                return res.status(500).send('Database update failed');
            }

            res.send({ message: 'Employee details updated successfully!' });
        });
    }
});

//delete Employee by id
router.post('/deleteEmployee/:empId', (req, res) => {
    const empId = req.params.empId;
    const query = queries.EmployeeQueries.deleteEmployee;
    db.query(query, empId, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Employee Deleted successfully!' });
    })
});

//create trip request
router.post('/bookCab', (req, res) => {
    const { EmployeeId, bookingDate, inTime, outTime } = req.body;

    const createTripsTable = queries.cabBookingTable.createCabBookingTable;
    
    db.query(createTripsTable, (err, result) => {
        if (err) throw err;
        console.log('Trips table created/exists!');
    });

    if (!EmployeeId || !date) {
        return res.status(400).send('EmployeeId and date are required');
    }

    const selectQuery = `SELECT * FROM Trips WHERE EmployeeId = ? AND date = ?`;

    db.query(selectQuery, [EmployeeId, date], (err, results) => {
        if (err) {
            console.error('Error fetching trip data:', err);
            return res.status(500).send('Error fetching trip data');
        }

        if (results.length > 0) {
            const existingTrip = results[0];
            const updatedInTime = inTime ? inTime : existingTrip.inTime;
            const updatedOutTime = outTime ? outTime : existingTrip.outTime;

            const updateQuery = `UPDATE Trips SET inTime = ?, outTime = ? WHERE EmployeeId = ? AND date = ?`;

            db.query(updateQuery, [updatedInTime, updatedOutTime, EmployeeId, date], (err, result) => {
                if (err) {
                    console.error('Error updating trip:', err);
                    return res.status(500).send('Error updating trip');
                }
                return res.status(200).send('Trip updated successfully');
            });

        } else {
            // If no row exists, generate a new ID and insert a new row
                const insertQuery = queries.cabBookingTable.bookCab

                db.query(insertQuery, [ EmployeeId, bookingDate, inTime, outTime], (err, result) => {
                    if (err) {
                        console.error('Error creating trip:', err);
                        return res.status(500).send('Error creating trip');
                    }
                    return res.status(200).send('Trip created successfully');
                });
            };
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
    const query = queries.cabBookingTable.showTripById;
    db.query(query, empId, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    })
});

module.exports = router;