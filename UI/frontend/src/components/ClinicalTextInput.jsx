export default function ClinicalTextInput({
  text,
  uploadedFile,
  setText,
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "16px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.08)",
        marginBottom: "25px",
      }}
    >
      <h3
        style={{
          marginBottom: "5px",
          color: "#1f2937",
        }}
      >
        Clinical Document
      </h3>

      <p
        style={{
          color: "#6b7280",
          fontSize: "14px",
          marginBottom: "18px",
        }}
      >
        Paste clinical text for annotation or upload a TXT/PDF document.
      </p>

      <textarea
        rows="6"
        value={uploadedFile ? "" : text}
        placeholder="Paste clinical text here..."
        onChange={(e) =>
          setText(e.target.value)
        }
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: "12px",
          border:
            "1px solid #d1d5db",
          resize: "vertical",
          boxSizing: "border-box",
          fontSize: "15px",
          lineHeight: "1.6",
          fontFamily:
            "inherit",
          minHeight: "180px",
        }}
      />

      {uploadedFile && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            borderRadius: "10px",
            background: "#eff6ff",
            color: "#1e40af",
            fontSize: "14px",
          }}
        >
          📄 File loaded:{" "}
          <strong>
            {uploadedFile.name}
          </strong>

          <br />

          Text input is disabled while a file
          is selected.
        </div>
      )}
    </div>
  );
}