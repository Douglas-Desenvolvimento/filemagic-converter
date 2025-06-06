import os
from PIL import Image
from pillow_heif import register_heif_opener
import logging
from pathlib import Path
import sys
import time

class ConversionLogger:
    def __init__(self):
        self.logger = logging.getLogger('HEIC_CONVERTER')
        self.setup_logging()
        
    def setup_logging(self):
        # Cria o diretório de logs se não existir
        log_dir = '/app/logs'
        os.makedirs(log_dir, exist_ok=True)
        
        # Configuração robusta de logging
        self.logger.setLevel(logging.INFO)
        
        # Formato do log
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        
        # Handler para arquivo (com tratamento de rotação)
        file_handler = logging.FileHandler('/app/logs/conversions.log', mode='a', encoding='utf-8')
        file_handler.setFormatter(formatter)
        
        # Handler para console
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        
        # Adiciona handlers
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        
        # Verifica permissões de escrita
        try:
            with open('/app/logs/conversions.log', 'a') as f:
                f.write(f"\n{'='*50}\n")
                f.write("🔄 Sessão de conversão iniciada\n")
                f.write(f"📂 Diretório: {os.getcwd()}\n")
                f.write(f"⏰ {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"{'='*50}\n")
        except Exception as e:
            print(f"ERRO CRÍTICO: Não foi possível escrever no arquivo de log: {str(e)}")
        
        self.logger.info("="*50)
        self.logger.info("🔄 Iniciando conversor HEIC para JPG")
        self.logger.info(f"📂 Diretório: {os.getcwd()}")
        self.logger.info("="*50)
    
    def log_conversion(self, input_path, output_path):
        self.logger.info(f"🔵 Convertendo: {input_path} → {output_path}")
        
    def log_success(self, output_path, original_size, converted_size):
        reduction = ((original_size - converted_size) / original_size) * 100
        self.logger.info(f"✅ Sucesso | Tamanho: {original_size/1024:.2f}KB → {converted_size/1024:.2f}KB (-{reduction:.1f}%)")
        self.logger.info(f"📤 Arquivo gerado: {output_path}")

logger = ConversionLogger()

def convert_single_file(input_path, output_path):
    try:
        input_path = Path(input_path).resolve()
        output_path = Path(output_path).resolve()
        
        logger.log_conversion(input_path, output_path)
        
        if not input_path.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {input_path}")
            
        original_size = input_path.stat().st_size
        output_path.parent.mkdir(parents=True, exist_ok=True)

        register_heif_opener()
        with Image.open(input_path) as img:
            img.convert("RGB").save(output_path, "JPEG", quality=95, optimize=True)
        
        if not output_path.exists():
            raise RuntimeError("Arquivo de saída não foi criado")
            
        converted_size = output_path.stat().st_size
        logger.log_success(output_path, original_size, converted_size)
        return True
        
    except Exception as e:
        logger.logger.error(f"🔴 ERRO: {str(e)}", exc_info=True)
        raise

def convert_directory(input_dir, output_dir):
    try:
        input_dir = Path(input_dir).resolve()
        output_dir = Path(output_dir).resolve()
        
        if not input_dir.is_dir():
            raise ValueError("Caminho de entrada não é um diretório")

        converted_files = []
        for heic_file in input_dir.glob('*.heic'):
            jpg_file = output_dir / f"{heic_file.stem}.jpg"
            try:
                if convert_single_file(heic_file, jpg_file):
                    converted_files.append(jpg_file)
            except Exception:
                continue
                
        return converted_files
        
    except Exception as e:
        logger.logger.error(f"🔴 ERRO no diretório: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    try:
        if len(sys.argv) == 3:
            # Modo arquivo único
            convert_single_file(sys.argv[1], sys.argv[2])
        elif len(sys.argv) == 4 and sys.argv[1] == '--dir':
            # Modo diretório
            convert_directory(sys.argv[2], sys.argv[3])
        else:
            logger.logger.error("Uso:")
            logger.logger.error("Para arquivo único: python heic_to_jpg.py <entrada.heic> <saida.jpg>")
            logger.logger.error("Para diretório: python heic_to_jpg.py --dir <pasta_entrada> <pasta_saida>")
            sys.exit(1)
            
        logger.logger.info("✨ Processo finalizado com sucesso")
        
    except Exception as e:
        logger.logger.critical(f"💥 Falha crítica: {str(e)}")
        sys.exit(1)