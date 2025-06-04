# filemagic-converter

**Versão 1.0** - Uma ferramenta simples e eficiente para conversão de imagens HEIC para JPG
# 🖼️ HEIC to JPG Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Version](https://img.shields.io/badge/version-1.0-green)

## ✨ Recursos Principais

- **Conversão em lote** de múltiplos arquivos HEIC simultaneamente
- **Seleção por pasta** - Converte todos os arquivos HEIC dentro de uma pasta e subpastas
- **Interface intuitiva** com visualização de progresso
- **Preserva metadados** durante a conversão
- **Sistema de logs** detalhado para acompanhamento

## 🚀 Como Usar

1. **Selecione seus arquivos**:
   - Clique em "Selecionar Arquivos .HEIC" para escolher arquivos individuais
   - Ou "Selecionar Pasta com .HEIC" para converter todos os arquivos de uma pasta

2. **Inicie a conversão**:
   - Clique no botão "Converter X Arquivo(s) para JPG"

3. **Salve os resultados**:
   - Após a conversão, use "Salvar Todos os Arquivos Convertidos" para exportar

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React.js + Vite
- **Backend**: Node.js + Express
- **Conversão**: Python + Pillow-HEIF (em container Docker)
- **Interface**: CSS moderno com animações suaves

## 📦 Pré-requisitos

- Node.js v16+
- Docker instalado e rodando
- Navegador moderno (Chrome/Edge v89+ ou Firefox v111+)

## ⚙️ Instalação

```bash
# Clone o repositório
git clone https://github.com/Douglas-Desenvolvimento/filemagic-converter.git
cd filemagic-converter

# Instale as dependências
npm install

# Inicie o container Docker
docker-compose up -d

# Inicie a aplicação
npm run dev