const express = require('express');
const route = express.Router();
const db = require('../db')

route.post('/addshift', (req, res) => {
    const {EmployeeID, EmployeeName, Address, City, State, latitude, longitude, Gender, ContactNumber, EContactNumber,  Department, Role, Shift, DateOfHire, EmploymentStatus} = req.body;
    const tablequery = "CREATE TABLE IF NOT EXISTS employeeshifts (ShiftID INT AUTO_INCREMENT PRIMARY KEY, EmployeeID VARCHAR(100), EmployeeName VARCHAR(200), ShiftDate DATE, ShiftStartTime TIME, ShiftEndTime TIME, ShiftDuration DECIMAL(5, 2), ShiftType VARCHAR(100), Department VARCHAR(100))";
    db.query(tablequery);
    const query = "INSERT INTO employeeshifts (EmployeeID, EmployeeName, ShiftDate, ShiftStartTime, ShiftEndTime, ShiftDuration, ShiftType, Department) values (?,?,?,?,?,?,?,?)";
    db.query(query, [EmployeeID, EmployeeName, ShiftDate, ShiftStartTime, ShiftEndTime, ShiftDuration, ShiftType, Department], (err,result)=>{
        if(err) return res.status(500).send(err);
        res.send({ message: 'Employee shift added successfully!' });
    });
});

route.get('/showshift', (req, res) => {
    const query = "SELECT * FROM employeeshifts";
    db.query(query, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    })
});

module.exports = route;