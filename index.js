const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const emproute = require("./routes/emp")
// const shiftroute = require("./routes/shift")
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
app.use('/emp',emproute)
// app.use('/shift',shiftroute)

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})