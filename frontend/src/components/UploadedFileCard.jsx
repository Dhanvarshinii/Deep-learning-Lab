export default function UploadedFileCard({
    uploadedFile,
  }) {
    if (!uploadedFile) {
      return null;
    }
  
    return (
      <div
        style={{
          marginTop: "20px",
          padding: "12px",
          background: "#f3f4f6",
          borderRadius: "10px",
          display: "inline-block",
        }}
      >
        📄 {uploadedFile.name}
      </div>
    );
  }