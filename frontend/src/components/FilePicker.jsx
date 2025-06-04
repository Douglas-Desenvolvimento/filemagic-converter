import { useState } from 'react';
import '../FilePicker.css';

export default function FilePicker() {
    const [file, setFile] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionDone, setConversionDone] = useState(false);
    const [tempResults, setTempResults] = useState(null);
    const [convertedBlob, setConvertedBlob] = useState(null);

    const handleFileSelect = async () => {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'HEIC Images',
                    accept: { 'image/heic': ['.heic'] }
                }]
            });
            const file = await fileHandle.getFile();
            setFile(file);
            setConversionDone(false);
        } catch (err) {
            if (err.name !== 'AbortError') {
                alert('Seleção de arquivo cancelada ou falhou');
            }
        }
    };

    const handleConvert = async () => {
        setIsConverting(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:5000/api/convert', {
                method: 'POST',
                body: formData,
                headers: { 'X-File-Name': file.name },
            });

            // Recebe o arquivo convertido como blob
            const blob = await response.blob();
            setConvertedBlob(blob); // Armazena em estado
            setConversionDone(true);

        } catch (error) {
            alert(`Erro na conversão: ${error.message}`);
        } finally {
            setIsConverting(false);
        }
    };

    const handleSaveToDestination = async () => {
        try {
            // 1. Usuário escolhe onde salvar
            const dirHandle = await window.showDirectoryPicker();
            const fileHandle = await dirHandle.getFileHandle(
                file.name.replace('.heic', '.jpg'),
                { create: true }
            );

            // 2. Cria stream de escrita
            const writable = await fileHandle.createWritable();

            // 3. Escreve o blob convertido
            await writable.write(convertedBlob);
            await writable.close();

            alert('Arquivo salvo com sucesso no seu computador!');
            setFile(null);
            setConversionDone(false);

        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
        }
    };

    return (
        <div className="file-picker-container">
            <h2>Conversor HEIC para JPG</h2>

            <div className="file-selection">
                <button onClick={handleFileSelect} disabled={isConverting || conversionDone}>
                    {file ? 'Trocar Arquivo' : 'Selecionar Arquivo .HEIC'}
                </button>
                {file && (
                    <div className="file-info">
                        <strong>Arquivo selecionado:</strong>
                        <span>{file.name}</span>
                    </div>
                )}
            </div>

            {!conversionDone ? (
                <button
                    onClick={handleConvert}
                    disabled={!file || isConverting}
                    className="convert-button"
                >
                    {isConverting ? 'Convertendo...' : 'Converter para JPG'}
                </button>
            ) : (
                <button
                    onClick={handleSaveToDestination}
                    className="save-button"
                >
                    Salvar Arquivo Convertido
                </button>
            )}
        </div>
    );
}