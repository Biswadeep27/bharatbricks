const { useState, useEffect } = React;

function formatBytes(bytes) {
    if (!bytes) return "--";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getTypeBadgeClass(type) {
    const t = (type || "").toLowerCase();
    if (t.includes("string")) return "type-string";
    if (t.includes("long") || t.includes("int") || t.includes("double") || t.includes("float") || t.includes("bigint")) return "type-long";
    if (t.includes("boolean")) return "type-boolean";
    if (t.includes("struct") || t.includes("array") || t.includes("map")) return "type-struct";
    return "type-default";
}

function JsonValue({ value }) {
    if (value === null || value === undefined) {
        return <span className="json-null">null</span>;
    }
    if (typeof value === "string") {
        // Truncate very long strings for display
        const display = value.length > 300 ? value.slice(0, 300) + "..." : value;
        return <span className="json-string">"{display}"</span>;
    }
    if (typeof value === "number") {
        return <span className="json-number">{value}</span>;
    }
    if (typeof value === "boolean") {
        return <span className="json-boolean">{value.toString()}</span>;
    }
    return <span className="json-string">{JSON.stringify(value)}</span>;
}

function SampleRecord({ record }) {
    if (!record || Object.keys(record).length === 0) {
        return <div className="sample-json">No data available</div>;
    }

    const entries = Object.entries(record);
    return (
        <div className="sample-json">
            {"{"}
            {entries.map(([key, value], i) => (
                <div key={key} style={{ paddingLeft: "20px" }}>
                    <span className="json-key">"{key}"</span>
                    {": "}
                    <JsonValue value={value} />
                    {i < entries.length - 1 ? "," : ""}
                </div>
            ))}
            {"}"}
        </div>
    );
}

function App() {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("/api/files")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setFiles(data.files || []);
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoadingFiles(false));
    }, []);

    const handleFileClick = (file) => {
        setSelectedFile(file);
        setPreview(null);
        setLoadingPreview(true);
        setError(null);

        fetch(`/api/file-preview?filename=${encodeURIComponent(file.name)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setPreview(data);
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoadingPreview(false));
    };

    return (
        <div className="app-container">
            <header className="header">
                <h1>
                    BharatBricks
                    <span>ArXiv Dataset Explorer</span>
                </h1>
                <span className="badge">IISc Bangalore</span>
            </header>

            <div className="main">
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <h2>Volume Files</h2>
                        <span className="file-count">{files.length}</span>
                    </div>

                    <div className="file-list">
                        {loadingFiles ? (
                            <div className="loading">
                                <div className="spinner"></div>
                                Loading files...
                            </div>
                        ) : files.length === 0 ? (
                            <div className="loading">No JSON files found</div>
                        ) : (
                            files.map((file) => (
                                <div
                                    key={file.name}
                                    className={`file-item ${selectedFile?.name === file.name ? "active" : ""}`}
                                    onClick={() => handleFileClick(file)}
                                >
                                    <span className="file-icon">{"{}"}</span>
                                    <div className="file-info">
                                        <div className="file-name">{file.name}</div>
                                        <div className="file-meta">{formatBytes(file.size)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                <main className="content">
                    {!selectedFile ? (
                        <div className="empty-state">
                            <div className="icon">{"{}"}</div>
                            <p>Select a JSON file from the sidebar to preview its schema and data</p>
                        </div>
                    ) : loadingPreview ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            Running SQL to read file schema...
                        </div>
                    ) : error ? (
                        <div>
                            <div className="preview-header">
                                <h2>{selectedFile.name}</h2>
                            </div>
                            <div className="error">{error}</div>
                        </div>
                    ) : preview ? (
                        <div>
                            <div className="preview-header">
                                <h2>{preview.filename}</h2>
                                <div className="path">/Volumes/bharatbricks/iiscb/datasets/arxiv/{preview.filename}</div>
                            </div>

                            <div className="section">
                                <div className="section-title">
                                    Schema
                                    <span className="count">{preview.schema.length} columns</span>
                                </div>
                                <table className="schema-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Column Name</th>
                                            <th>Data Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.schema.map((col, i) => (
                                            <tr key={col.column_name}>
                                                <td style={{ color: "#8b949e" }}>{i + 1}</td>
                                                <td>{col.column_name}</td>
                                                <td>
                                                    <span className={`type-badge ${getTypeBadgeClass(col.type)}`}>
                                                        {col.type}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="section">
                                <div className="section-title">Sample Record</div>
                                <SampleRecord record={preview.sample_record} />
                            </div>
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
