import { useState, useEffect } from 'react';
import '../FilePicker.css';


export default function FilePicker() {
    const [files, setFiles] = useState([]);
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState({
        total: 0,
        converted: 0,
        failed: 0,
        current: ''
    });
    const [results, setResults] = useState([]);


    const getFilesFromDirectory = async (dirHandle) => {
        const files = [];

        const processEntry = async (entry, path = '') => {
            if (entry.kind === 'file') {
                if (entry.name.toLowerCase().endsWith('.heic')) {
                    try {
                        const file = await entry.getFile();
                        // Cria um novo objeto File com a estrutura de pastas
                        const relativePath = path ? `${path}/${entry.name}` : entry.name;
                        const modifiedFile = new File([file], entry.name, {
                            type: file.type,
                            lastModified: file.lastModified,
                            webkitRelativePath: relativePath
                        });
                        files.push(modifiedFile);
                    } catch (error) {
                        console.error(`Erro ao processar arquivo ${entry.name}:`, error);
                    }
                }
            } else if (entry.kind === 'directory') {
                for await (const subEntry of entry.values()) {
                    await processEntry(subEntry, path ? `${path}/${entry.name}` : entry.name);
                }
            }
        };

        for await (const entry of dirHandle.values()) {
            await processEntry(entry);
        }
        return files;
    };

    const handleFileSelect = async (isFolder = false) => {
        try {
            let newFiles = [];

            if (isFolder) {
                const dirHandle = await window.showDirectoryPicker({
                    id: 'heicFolderPicker',
                    mode: 'read'

                });
                newFiles = await getFilesFromDirectory(dirHandle);

                if (newFiles.length === 0) {
                    alert('Nenhum arquivo HEIC encontrado na pasta selecionada');
                    return;
                }
            } else {
                const fileHandles = await window.showOpenFilePicker({
                    types: [{
                        description: 'HEIC Images',
                        accept: { 'image/heic': ['.heic'] }
                    }],
                    multiple: true
                });
                newFiles = await Promise.all(
                    fileHandles.map(async handle => await handle.getFile())
                );
            }

            setFiles(newFiles);
            setResults([]);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Erro na seleção:', err);
                alert('Seleção cancelada ou falhou. Certifique-se de que está selecionando arquivos HEIC válidos.');
            }
        }
    };

    const handleConvert = async () => {
        if (files.length === 0) {
            alert('Selecione pelo menos um arquivo!');
            return;
        }

        setIsConverting(true);
        setProgress({
            total: files.length,
            converted: 0,
            failed: 0,
            current: ''
        });

        try {
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));

            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setResults(result.files);
                setProgress(prev => ({
                    ...prev,
                    converted: result.converted,
                    failed: result.failed,
                    current: 'Concluído!'
                }));
            } else {
                throw new Error(result.error || 'Erro na conversão');
            }
        } catch (error) {
            alert(`Falha na conversão: ${error.message}`);
        } finally {
            setIsConverting(false);
        }
    };

    const handleSaveAll = async () => {
        try {
            const dirHandle = await window.showDirectoryPicker();

            for (const file of results) {
                if (file.error) continue;

                try {
                    const fileHandle = await dirHandle.getFileHandle(
                        file.fileName,
                        { create: true }
                    );

                    const writable = await fileHandle.createWritable();
                    const buffer = Uint8Array.from(atob(file.buffer), c => c.charCodeAt(0));
                    await writable.write(buffer);
                    await writable.close();
                } catch (error) {
                    console.error(`Erro salvando ${file.fileName}:`, error);
                }
            }

            alert(`${results.length} arquivos salvos com sucesso!`);
            setFiles([]);
            setResults([]);
        } catch (error) {
            alert(`Erro ao salvar arquivos: ${error.message}`);
        }
    };

    return (
        <div className="file-picker-container">
            <h2>Conversor HEIC para JPG</h2>

            <div className="file-selection">
                <div className="selection-buttons">
                    <button onClick={() => handleFileSelect(false)} disabled={isConverting}>
                        Selecionar Arquivos
                    </button>

                    <button onClick={() => handleFileSelect(true)} disabled={isConverting}>
                        Selecionar Pasta com
                    </button>

                </div>

                {files.length > 0 && (
                    <div className="file-list">
                        <strong>Arquivos selecionados: {files.length}</strong>
                        <ul>
                            {files.slice(0, 5).map((file, index) => (
                                <li key={index}>{file.name}</li>
                            ))}
                            {files.length > 5 && <li>... mais {files.length - 5} arquivos</li>}
                        </ul>
                    </div>
                )}
            </div>

            {isConverting && (
                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${(progress.converted + progress.failed) / progress.total * 100}%`
                            }}
                        ></div>
                    </div>
                    <div className="progress-text">
                        Convertendo: {progress.current || files[progress.converted + progress.failed]?.name}
                        <br />
                        Concluídos: {progress.converted} | Falhas: {progress.failed} | Total: {progress.total}
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <div className="results-container">
                    <h3>Resultados da Conversão</h3>
                    <div className="summary">
                        Sucessos: {progress.converted} | Falhas: {progress.failed}
                    </div>

                    <div className="file-results">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={`file-result ${result.error ? 'error' : 'success'}`}
                            >
                                <span className="file-name">{result.originalName}</span>
                                {result.error ? (
                                    <span className="error-message">Erro: {result.error}</span>
                                ) : (
                                    <span className="success-message">Convertido: {result.fileName}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSaveAll}
                        className="save-all-button"
                    >
                        Salvar Todos os Arquivos Convertidos
                    </button>
                </div>
            )}

            {files.length > 0 && !isConverting && results.length === 0 && (
                <button
                    onClick={handleConvert}
                    className="convert-button"
                >
                    Converter {files.length} Arquivo(s) para JPG
                </button>
            )}
        </div>
    );
}