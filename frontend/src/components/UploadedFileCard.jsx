export default function UploadedFileCard({
  uploadedFile,
}) {
  if (!uploadedFile) {
    return null;
  }

  const isPDF =
    uploadedFile.name
      .toLowerCase()
      .endsWith(".pdf");

  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "16px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.08)",
        marginBottom: "25px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <div
          style={{
            fontSize: "32px",
          }}
        >
          📄
        </div>

        <div>
          <div
            style={{
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "4px",
            }}
          >
            Uploaded Document
          </div>

          <div
            style={{
              color: "#6b7280",
              fontSize: "14px",
              marginBottom: "6px",
            }}
          >
            {uploadedFile.name}
          </div>

          <div
            style={{
              display: "inline-block",
              background: "#ecfdf5",
              color: "#166534",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {isPDF
              ? "PDF Document Ready"
              : "TXT Document Ready"}
          </div>
        </div>
      </div>
    </div>
  );
}