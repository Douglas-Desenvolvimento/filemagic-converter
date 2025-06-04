import os
from pillow_heif import register_heif_opener
from PIL import Image

def convert_heic_to_jpg(directory):
    register_heif_opener()
    
    for filename in os.listdir(directory):
        if filename.lower().endswith(".heic"):
            heic_path = os.path.join(directory, filename)
            jpg_path = os.path.join(directory, filename.rsplit(".", 1)[0] + ".jpg")
            
            try:
                image = Image.open(heic_path)
                image.convert("RGB").save(jpg_path, "JPEG")
                print(f"Convertido: {filename} -> {jpg_path}")
                
                # Tenta remover o arquivo HEIC após conversão
                try:
                    os.remove(heic_path)
                    print(f"Removido: {heic_path}")
                except Exception as remove_error:
                    print(f"Erro ao remover {heic_path}: {remove_error}")
            except Exception as e:
                print(f"Erro ao converter {filename}: {e}")

if __name__ == "__main__":
    pasta_alvo = input("Digite o caminho da pasta com os arquivos HEIC: ").strip()
    
    if os.path.isdir(pasta_alvo):
        convert_heic_to_jpg(pasta_alvo)
    else:
        print("Caminho inválido.")
