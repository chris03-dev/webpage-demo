FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

# Start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]
