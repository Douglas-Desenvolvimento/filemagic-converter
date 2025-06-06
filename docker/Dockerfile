FROM python:3.9-slim
WORKDIR /app
COPY ./heic_to_jpg.py .
COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install pillow pillow-heif flask gunicorn
EXPOSE 5001
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "heic_to_jpg:app"]