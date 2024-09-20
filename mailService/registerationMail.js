const nodemailer = require('nodemailer')
const transporter = require('./userMail')

const registerationMail = (employee)=>{
    const mailOptions = {
        from: 'harshit995905@gmail.com',
        to: employee.EmployeeEmail,
        subject: 'Registration Confirmation - Account Details',
        html:`<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                <div style="max-width: 700px; margin: 40px auto; background-color: #5bb450">
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        
                        <div style="background-color: #5bb450; padding: 20px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;text-align: center; font-weight: bold">Registration Confirmation</h1>
                        </div>
                        
                        <div style="padding: 20px; color: #333333; text-align: left;">
                            <p style="line-height: 1.6;">Dear ${employee.EmployeeName},</p>
                            <p style="line-height: 1.6;">We are pleased to inform you that your employee details have been successfully updated in our records.</p>
                            <p style="line-height: 1.6;">Here are your account details:</p>
                            <p style="line-height: 1.6; margin: 0;"><strong>Employee ID:</strong> ${employee.EmployeeId}</p>
                            <p style="line-height: 1.6; margin: 0;"><strong>Password:</strong> ${employee.EmployeePassword}</p>
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
            res.status(500).send('Error sending Email');
        } else {
            console.log('Email sent:', info.response);
            res.send('Employee added successfully and Email sent');
        }
        console.log(employeeId, employeeEmail);
    });
}
module.exports = registerationMail