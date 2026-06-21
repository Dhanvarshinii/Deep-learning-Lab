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
        <h3>Clinical Text</h3>
  
        <textarea
          rows="6"
          value={
            uploadedFile
              ? ""
              : text
          }
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
            borderRadius: "10px",
            border:
              "1px solid #d1d5db",
            resize: "vertical",
          }}
        />
      </div>
    );
  }