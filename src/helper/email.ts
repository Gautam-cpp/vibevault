import nodemailer from 'nodemailer';

type SendOTPParams = {
  email: string;
  otp: string;
};

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service provider
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

export async function sendOTP({ email, otp }: SendOTPParams): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    html: `<p>Your OTP code is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP sent successfully');
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
}
