FROM python:3.9-slim
WORKDIR /app
COPY container_backend/ .
RUN pip install pillow pillow-heif
CMD ["python3", "/app/heic_to_jpg.py"]