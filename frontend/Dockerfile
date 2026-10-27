FROM nginx:alpine

# Просто копируем все файлы в стандартную директорию
COPY . /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]