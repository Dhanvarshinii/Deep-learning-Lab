export default function LoadingOverlay({
    loading,
    selectedModel,
  }) {
    if (!loading) return null;
  
    return (
      <>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
  
            @keyframes fadeIn {
              from {
                opacity:0;
                transform:translateY(10px);
              }
              to {
                opacity:1;
                transform:translateY(0);
              }
            }
          `}
        </style>
  
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "42px",
              width: "360px",
              borderRadius: "18px",
              textAlign: "center",
              boxShadow:
                "0 15px 45px rgba(0,0,0,.18)",
              animation:
                "fadeIn .25s ease",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "5px solid #e5e7eb",
                borderTop:
                  "5px solid #2563eb",
                borderRadius: "50%",
                margin: "0 auto 24px",
                animation:
                  "spin .9s linear infinite",
              }}
            />
  
            <h2
            style={{
                margin: 0,
                color: "#111827",
                fontWeight: "600",
            }}
            >
            Clinical Analysis in Progress
            </h2>

            <p
            style={{
                color: "#6b7280",
                marginTop: "14px",
                lineHeight: "1.7",
                fontSize: "15px",
            }}
            >
            Please wait while the selected model
            <br />
            analyzes your clinical document.
            </p>

            <div
            style={{
                marginTop: "18px",
                display: "inline-block",
                background: "#eef2ff",
                color: "#2563eb",
                padding: "8px 14px",
                borderRadius: "999px",
                fontWeight: "600",
                fontSize: "14px",
            }}
            >
            {selectedModel}
            </div>
          </div>
        </div>
      </>
    );
  }