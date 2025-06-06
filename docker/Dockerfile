FROM python:3.9-slim

# Configurações essenciais
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Instala dependências primeiro (otimiza cache)
RUN pip install --no-cache-dir pillow pillow-heif && \
    mkdir -p /app/temp /app/output /app/logs

# Copia os arquivos necessários
COPY ./converters/heic_to_jpg.py .
COPY ./converters/logging_config.py . 

# Comando para manter o container ativo e logando
CMD ["sh", "-c", "tail -f /dev/null && python3 -u heic_to_jpg.py"]