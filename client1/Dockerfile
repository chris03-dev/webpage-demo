FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf

COPY static/ /usr/share/nginx/html/

EXPOSE 5000

CMD ["nginx", "-g", "daemon off;"]
