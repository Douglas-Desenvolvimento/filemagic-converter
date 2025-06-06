FROM python:3.9-slim
WORKDIR /app
COPY ./heic_to_jpg.py .
RUN pip install pillow pillow-heif
CMD ["python3", "/app/heic_to_jpg.py"]