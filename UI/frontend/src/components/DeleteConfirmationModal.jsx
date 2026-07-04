export default function DeleteConfirmationModal({
  showDeletePopup,
  selectedEntity,
  handleDeleteEntity,
  setShowDeletePopup,
}) {
  if (!showDeletePopup) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setShowDeletePopup(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17, 24, 39, 0.45)",
          backdropFilter: "blur(3px)",
          zIndex: 999,
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "420px",
          background: "white",
          borderRadius: "18px",
          padding: "28px",
          boxShadow: "0 20px 45px rgba(0,0,0,0.18)",
          zIndex: 1000,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            color: "#111827",
            marginBottom: "12px",
          }}
        >
          Delete Annotation
        </h2>

        <p
          style={{
            color: "#6b7280",
            lineHeight: "1.6",
            marginBottom: "18px",
          }}
        >
          This action cannot be undone. Are you sure you want
          to remove the following annotation?
        </p>

        <div
          style={{
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Selected Entity
          </div>

          <div
            style={{
              fontWeight: "600",
              color: "#111827",
              wordBreak: "break-word",
            }}
          >
            {selectedEntity?.selected_text}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            onClick={() => setShowDeletePopup(false)}
            style={{
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Cancel
          </button>

          <button
            onClick={() => {
              handleDeleteEntity();
              setShowDeletePopup(false);
            }}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}