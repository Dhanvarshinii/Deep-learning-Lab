export default function ExportSuccessModal({
    showExportSuccess,
    fileName,
    setShowExportSuccess,
  }) {
    if (!showExportSuccess) return null;
  
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "28px",
            width: "420px",
            boxShadow: "0 10px 35px rgba(0,0,0,0.2)",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#2D6E63",
              marginBottom: "15px",
            }}
          >
            ✅ Export Successful
          </h2>
  
          <p
            style={{
              color: "#4b5563",
              lineHeight: 1.6,
              marginBottom: "20px",
            }}
          >
            Your annotations have been exported successfully.
          </p>
  
          <div
            style={{
              background: "#f3f4f6",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "24px",
              wordBreak: "break-word",
              color: "#374151",
              fontWeight: "600",
            }}
          >
            {fileName}
          </div>
  
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() =>
                setShowExportSuccess(false)
              }
              style={{
                background: "#2D6E63",
                color: "white",
                border: "none",
                padding: "12px 22px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }