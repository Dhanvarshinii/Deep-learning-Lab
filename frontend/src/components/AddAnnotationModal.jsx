export default function AddAnnotationModal({
    selectionPopup,
    newLabel,
    setNewLabel,
    annotations,
    handleAddAnnotation,
    setSelectionPopup,
  }) {
    if (!selectionPopup) {
      return null;
    }
  
    const suggestedLabels = [
      ...new Set(
        annotations.map(
          (item) =>
            item.meaning_group
        )
      ),
    ];
  
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
          zIndex: 999,
          minWidth: "400px",
        }}
      >
        <h3>Add Annotation</h3>
  
        <p>
          <strong>
            Selected Text:
          </strong>
        </p>
  
        <p
          style={{
            background: "#f3f4f6",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          {selectionPopup.text}
        </p>
  
        <p>
          <strong>
            Suggested Labels
          </strong>
        </p>
  
        <select
          value={newLabel}
          onChange={(e) =>
            setNewLabel(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        >
          <option value="">
            Select Label
          </option>
  
          {suggestedLabels.map(
            (label) => (
              <option
                key={label}
                value={label}
              >
                {label}
              </option>
            )
          )}
        </select>
  
        <input
          type="text"
          placeholder="Or enter custom label"
          value={newLabel}
          onChange={(e) =>
            setNewLabel(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border:
              "1px solid #d1d5db",
          }}
        />
  
        <div
          style={{
            marginTop: "20px",
            textAlign: "right",
          }}
        >
          <button
            onClick={
              handleAddAnnotation
            }
            style={{
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Save
          </button>
  
          <button
            onClick={() =>
              setSelectionPopup(
                null
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