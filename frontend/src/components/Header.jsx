export default function Header() {
    return (
      <div
        style={{
          marginBottom: "35px",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: "600",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#2D6E63",
            marginBottom: "8px",
          }}
        >
          Human-in-the-Loop Clinical NLP Platform
        </p>
  
        <h1
          style={{
            fontSize: "42px",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "10px",
            lineHeight: "1.1",
          }}
        >
          Clinical NER Annotation
        </h1>
  
        <p
          style={{
            fontSize: "16px",
            color: "#6b7280",
            maxWidth: "700px",
            lineHeight: "1.6",
          }}
        >
          Extract clinical entities from medical documents using AI-powered
          NER models, refine predictions through human feedback, and export
          high-quality annotated datasets.
        </p>
      </div>
    );
  }