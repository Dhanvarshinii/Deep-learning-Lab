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
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform:
            "translate(-50%, -50%)",
          background: "white",
          padding: "25px",
          borderRadius: "16px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.2)",
          zIndex: 1000,
          minWidth: "350px",
        }}
      >
        <h3>
          Delete Annotation?
        </h3>
  
        <p>
          Are you sure you want to
          delete this annotation?
        </p>
  
        <p>
          <strong>
            {
              selectedEntity?.
                selected_text
            }
          </strong>
        </p>
  
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <button
            onClick={() => {
              handleDeleteEntity();
              setShowDeletePopup(
                false
              );
            }}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Delete
          </button>
  
          <button
            onClick={() =>
              setShowDeletePopup(
                false
              )
            }
            style={{
              background: "#6b7280",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }