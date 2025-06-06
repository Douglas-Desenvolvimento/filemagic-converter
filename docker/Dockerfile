FROM python:3.9-slim
WORKDIR /app
COPY ./heic_to_jpg.py .
RUN pip install pillow pillow-heif
ExPOSE 5001
CMD ["sh", "-c", "tail -f /dev/null && python3 -u heic_to_jpg.py", "--port", "5001"]