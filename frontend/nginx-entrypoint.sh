#!/bin/sh
# nginx-entrypoint.sh
# This script generates an Nginx configuration file with the port from the environment variable

# Default to port 80 if NGINX_PORT is not set
NGINX_PORT=${NGINX_PORT:-80}

# Generate Nginx configuration with the correct port
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen ${NGINX_PORT};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Set real IP from host network
    real_ip_header X-Forwarded-For;
    real_ip_recursive on;

    # Serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Add CORS headers for development
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept' always;
    }

    # Enable compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # Handle browser favicon requests
    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }

    # Handle robots.txt requests
    location = /robots.txt {
        access_log off;
        log_not_found off;
    }
}
EOF

echo "Nginx configured to listen on port ${NGINX_PORT}"

# Start Nginx in the foreground
exec nginx -g "daemon off;"