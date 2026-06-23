export default function LoadingIndicator({
    isLoading,
  }) {
    if (!isLoading) {
      return null;
    }
  
    return (
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontWeight: "600",
          color: "#2563eb",
        }}
      >
        Processing document and extracting entities...
      </div>
    );
  }