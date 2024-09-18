const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const employeeRoutes = require('./Routes/employeeRoutes')
const vehicleRoutes = require('./Routes/vehicleRoutes')
const db = require('./db')
const cookieParser = require('cookie-parser');


const app = express();
const port = 5000;
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//routes
app.use('/employee',employeeRoutes)
app.use('/vehicle', vehicleRoutes)

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})