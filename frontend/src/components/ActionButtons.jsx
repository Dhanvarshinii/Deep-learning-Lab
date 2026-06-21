export default function ActionButtons({
    fileInputRef,
    handleFileUpload,
    handleAnnotate,
    handleClearAll,
    handleDownloadJSON,
    isLoading,
    annotations,
  }) {
    return (
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <h3
          style={{
            marginBottom: "15px",
            color: "#374151",
          }}
        >
          Actions
        </h3>
  
        <input
          type="file"
          accept=".txt,.pdf"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
  
        <button
          onClick={() =>
            fileInputRef.current.click()
          }
          style={{
            background: "white",
            border: "2px solid #2563eb",
            color: "#2563eb",
            padding: "12px 22px",
            borderRadius: "10px",
            marginRight: "10px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Upload File
        </button>
  
        <button
          onClick={handleAnnotate}
          disabled={isLoading}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 22px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {isLoading
            ? "Annotating..."
            : "Annotate"}
        </button>
  
        <button
          onClick={handleClearAll}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "12px 22px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            marginLeft: "10px",
          }}
        >
          ↺ Clear All
        </button>
  
        <button
          onClick={handleDownloadJSON}
          disabled={
            annotations.length === 0
          }
          style={{
            background: "#16a34a",
            color: "white",
            border: "none",
            padding: "12px 22px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            marginLeft: "10px",
          }}
        >
          ⬇ Export JSON
        </button>
      </div>
    );
  }