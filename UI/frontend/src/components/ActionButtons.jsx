export default function ActionButtons({
  fileInputRef,
  handleFileUpload,
  handleAnnotate,
  handleClearAll,
  handleDownloadJSON,
  isLoading,
  annotations,
  uploadedFile,
  text,
}) {

  const canAnnotate =
  uploadedFile ||
  text.trim().length > 0;

  return (
    <>
      <input
        type="file"
        accept=".txt,.pdf"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {/* LEFT SIDE ACTIONS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() =>
              fileInputRef.current.click()
            }
            style={{
              background: "white",
              border: "2px solid #d1d5db",
              color: "#1f2937",
              padding: "12px 22px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            ⬆ Upload TXT / PDF
          </button>

          {uploadedFile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#dfe9e7",
                padding: "12px 18px",
                borderRadius: "12px",
                color: "#4b5563",
                fontSize: "15px",
                fontWeight: "500",
                maxWidth: "350px",
              }}
            >
              📄 {uploadedFile.name}
            </div>
          )}

          <button
            onClick={handleDownloadJSON}
            disabled={
              annotations.length === 0
            }
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              padding: "12px 8px",
              cursor:
                annotations.length > 0
                  ? "pointer"
                  : "not-allowed",
              fontWeight: "600",
              fontSize: "15px",
              opacity:
                annotations.length > 0
                  ? 1
                  : 0.5,
            }}
          >
            ↓ Export
          </button>

          <button
            onClick={handleClearAll}
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              padding: "12px 8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            ✕ Clear
          </button>
        </div>

        {/* PRIMARY ACTION */}
        <button
          onClick={handleAnnotate}
          disabled={!canAnnotate || isLoading}
          style={{
            background:
              !canAnnotate || isLoading
                ? "#d1d5db"
                : "#2D6E63",
            color: "white",
            border: "none",
            padding: "16px 32px",
            borderRadius: "14px",
            cursor:
              !canAnnotate || isLoading
                ? "not-allowed"
                : "pointer",
            fontWeight: "700",
            fontSize: "16px",
            minWidth: "220px",
            opacity:
              !canAnnotate || isLoading
                ? 0.7
                : 1,
          }}
        >
          {isLoading
            ? "⏳ Annotating..."
            : "✨ Run Annotation"}
        </button>
      </div>
    </>
  );
}