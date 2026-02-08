from marshmallow import Schema, fields, validate, ValidationError, validates_schema

class SignupSchema(Schema):
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class OTPSendSchema(Schema):
    email = fields.Email(required=True)
    purpose = fields.Str(missing='signup', validate=validate.OneOf(['signup', 'reset_password']))

class OTPVerifySchema(Schema):
    email = fields.Email(required=True)
    otp = fields.Str(required=True, validate=validate.Length(equal=6))
    purpose = fields.Str(missing='signup', validate=validate.OneOf(['signup', 'reset_password']))

class PasswordResetSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    # We don't strictly require OTP here as it's verified in a separate step or via session, 
    # but strictly speaking the route currently requires a verified OTP to exist in DB.
    
class URLScanSchema(Schema):
    url = fields.Str(required=True, validate=validate.Length(min=1))
    
    @validates_schema
    def validate_url(self, data, **kwargs):
        url = data.get('url', '').strip()
        if not url:
            raise ValidationError('URL is required', field_name='url')
        
        # Basic URL validation - allow http, https, and other protocols
        original_url = url
        if not (url.startswith('http://') or url.startswith('https://') or 
                url.startswith('ftp://') or url.startswith('file://')):
            # Try to add http:// if no protocol
            if '://' not in url:
                url = 'http://' + url
                data['url'] = url
        
        # Validate it's a proper URL format
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            # Allow URLs with netloc (domain) or at least a path
            if not parsed.netloc and not parsed.path:
                raise ValidationError('Invalid URL format', field_name='url')
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f'Invalid URL format: {str(e)}', field_name='url')

class SocialLoginSchema(Schema):
    email = fields.Email(required=True)
    fullName = fields.Str(required=True)
    provider = fields.Str(required=True, validate=validate.OneOf(['Google', 'Facebook']))
