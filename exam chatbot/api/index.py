import sys
import os
from io import BytesIO
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/..')

from app import app

def handler(event, context):
    # Create WSGI environ from Vercel event
    environ = {
        'REQUEST_METHOD': event.get('method', 'GET'),
        'PATH_INFO': event.get('path', '/'),
        'QUERY_STRING': event.get('query', ''),
        'CONTENT_TYPE': event.get('headers', {}).get('content-type', ''),
        'CONTENT_LENGTH': str(len(event.get('body', ''))),
        'SERVER_NAME': 'vercel',
        'SERVER_PORT': '443',
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': 'https',
        'wsgi.input': BytesIO(event.get('body', '').encode('utf-8')),
        'wsgi.errors': sys.stderr,
        'wsgi.multithread': False,
        'wsgi.multiprocess': False,
        'wsgi.run_once': False,
    }
    
    # Add headers
    for k, v in event.get('headers', {}).items():
        environ['HTTP_' + k.upper().replace('-', '_')] = v
    
    # Response collection
    status = []
    headers = []
    body = []
    
    def start_response(s, h):
        status.append(s)
        headers.extend(h)
    
    # Call the WSGI app
    response = app(environ, start_response)
    body.extend(response)
    
    # Parse status
    status_code = int(status[0].split()[0]) if status else 200
    
    # Build response
    response_headers = {k: v for k, v in headers}
    response_body = b''.join(body).decode('utf-8')
    
    return {
        'statusCode': status_code,
        'headers': response_headers,
        'body': response_body
    }