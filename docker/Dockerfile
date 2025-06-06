FROM python:3.9-slim
WORKDIR /app
COPY ./heic_to_jpg.py .
RUN pip install pillow pillow-heif
CMD ["sh", "-c", "tail -f /dev/null && python3 -u heic_to_jpg.py"]