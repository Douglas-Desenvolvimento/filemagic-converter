import os
from PIL import Image
from pillow_heif import register_heif_opener
import logging
from pathlib import Path
import sys

# Configuração robusta de logging
def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),  # Log para stdout (capturado pelo Docker)
            logging.FileHandler('/app/logs/conversions.log')  # Log persistente
        ]
    )
    logging.info("="*50)
    logging.info("🔄 Iniciando conversor HEIC para JPG")
    logging.info(f"🐍 Python version: {sys.version}")
    logging.info(f"📂 Diretório de trabalho: {os.getcwd()}")
    logging.info("="*50)

setup_logging()

def convert_heic_to_jpg(input_path, output_path):
    try:
        # Convertendo para Path objects para melhor manipulação
        input_path = Path(input_path).absolute()
        output_path = Path(output_path).absolute()
        
        logging.info(f"🔵 Iniciando conversão:")
        logging.info(f"   Entrada: {input_path}")
        logging.info(f"   Saída: {output_path}")

        # Verificação do arquivo de entrada
        if not input_path.exists():
            raise FileNotFoundError(f"Arquivo de entrada não encontrado: {input_path}")
        logging.info(f"📄 Tamanho do arquivo de entrada: {input_path.stat().st_size/1024:.2f} KB")

        # Cria diretório de saída se não existir
        output_path.parent.mkdir(parents=True, exist_ok=True)
        logging.info(f"📂 Diretório de saída verificado: {output_path.parent}")

        # Processamento da imagem
        register_heif_opener()
        with Image.open(input_path) as image:
            logging.info(f"🖼️ Dimensões originais: {image.size[0]}x{image.size[1]}")
            logging.info(f"🎚️ Modo da imagem: {image.mode}")
            
            image.convert("RGB").save(output_path, "JPEG", quality=95, optimize=True)
            logging.info("✅ Imagem convertida e salva com sucesso")

        # Verificação do resultado
        if not output_path.exists():
            raise RuntimeError(f"Arquivo de saída não foi criado: {output_path}")
        
        output_size = output_path.stat().st_size
        logging.info(f"🆗 Conversão finalizada - Tamanho do arquivo de saída: {output_size/1024:.2f} KB")
        
        return True

    except Exception as e:
        logging.error(f"🔴 ERRO CRÍTICO: {str(e)}", exc_info=True)
        raise  # Re-lança a exceção para tratamento superior

# Ponto de entrada para execução direta
if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            logging.error("Uso: python heic_to_jpg.py <arquivo_entrada.heic> <arquivo_saida.jpg>")
            sys.exit(1)
            
        input_file = sys.argv[1]
        output_file = sys.argv[2]
        
        logging.info("🛠️ Execução direta detectada")
        convert_heic_to_jpg(input_file, output_file)
        logging.info("✨ Processamento concluído com sucesso!")
        
    except Exception as e:
        logging.critical(f"💥 Falha na execução direta: {str(e)}", exc_info=True)
        sys.exit(1)