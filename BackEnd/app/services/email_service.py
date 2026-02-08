import logging
from flask import current_app
from flask_mail import Message

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_otp(email, otp_code, purpose='signup'):
        """
        Sends an OTP to the user's email using Flask-Mail.
        Falls back to console logging if email is not configured.
        """
        subjects = {
            'signup': 'PhishEye - Your Signup Verification Code',
            'reset_password': 'PhishEye - Your Password Reset Code'
        }
        
        subject = subjects.get(purpose, 'PhishEye Verification Code')
        
        # Email body template
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #06b6d4;">PhishEye Security</h2>
                <p>Hello,</p>
                <p>Your verification code is:</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="color: #06b6d4; margin: 0; font-size: 32px; letter-spacing: 5px;">{otp_code}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 12px;">© PhishEye - Advanced Phishing Detection System</p>
            </div>
        </body>
        </html>
        """
        
        try:
            # Try to send email using Flask-Mail
            from app import mail
            
            # Check if mail is configured
            if current_app.config.get('MAIL_USERNAME') and current_app.config.get('MAIL_PASSWORD'):
                msg = Message(
                    subject=subject,
                    recipients=[email],
                    html=body,
                    sender=current_app.config.get('MAIL_DEFAULT_SENDER', current_app.config.get('MAIL_USERNAME'))
                )
                mail.send(msg)
                logger.info(f"OTP ({purpose}) sent to {email} via email")
                return True
            else:
                # Fallback to console if email not configured
                logger.warning("Email not configured. OTP printed to console.")
                print("\n" + "="*50)
                print(f"TO: {email}")
                print(f"SUBJECT: {subject}")
                print(f"BODY: Your verification code is: {otp_code}")
                print("="*50 + "\n")
                return True
        except Exception as e:
            # Fallback to console on error
            logger.error(f"Failed to send email: {str(e)}. Falling back to console.")
            print("\n" + "="*50)
            print(f"TO: {email}")
            print(f"SUBJECT: {subject}")
            print(f"BODY: Your verification code is: {otp_code}")
            print("="*50 + "\n")
            return True

    @staticmethod
    def send_reset_success(email):
        """Sends a success notification after password reset."""
        subject = 'PhishEye - Password Reset Successful'
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #22c55e;">Password Reset Successful</h2>
                <p>Hello,</p>
                <p>Your password has been successfully reset.</p>
                <p>If you didn't make this change, please contact our support team immediately.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 12px;">© PhishEye - Advanced Phishing Detection System</p>
            </div>
        </body>
        </html>
        """
        
        try:
            from app import mail
            
            if current_app.config.get('MAIL_USERNAME') and current_app.config.get('MAIL_PASSWORD'):
                msg = Message(
                    subject=subject,
                    recipients=[email],
                    html=body,
                    sender=current_app.config.get('MAIL_DEFAULT_SENDER', current_app.config.get('MAIL_USERNAME'))
                )
                mail.send(msg)
                logger.info(f"Password reset success email sent to {email}")
                return True
            else:
                logger.warning("Email not configured. Password reset notification printed to console.")
                print("\n" + "="*50)
                print(f"TO: {email}")
                print(f"SUBJECT: {subject}")
                print(f"BODY: Your password has been successfully reset. If this wasn't you, please contact support.")
                print("="*50 + "\n")
                return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}. Falling back to console.")
            print("\n" + "="*50)
            print(f"TO: {email}")
            print(f"SUBJECT: {subject}")
            print(f"BODY: Your password has been successfully reset. If this wasn't you, please contact support.")
            print("="*50 + "\n")
            return True
