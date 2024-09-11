

CREATE TABLE Vehicle_Details1 (
    vehicleId INT AUTO_INCREMENT PRIMARY KEY,
    vehicleName VARCHAR(255) NOT NULL,
    vehicleType VARCHAR(100) NOT NULL,
    vehicleNumber VARCHAR(50) NOT NULL UNIQUE,
    vendorName VARCHAR(255) NOT NULL,
    insuranceNumber VARCHAR(100) NOT NULL,
    mileage INT NOT NULL,
    yearOfManufacturing VARCHAR(4) NOT NULL,
    fuelType VARCHAR(50) NOT NULL,
    seatCapacity INT NOT NULL,
    vehicleImage VARCHAR(255),
    driverId INT NULL,
    vehicleStatus TINYINT(1) DEFAULT 0
);
