export const renderHighlightedText = ({
    text,
    annotations,
    getLabelColor,
    setSelectedEntity,
    setEditedLabel,
  }) => {
    if (!text || annotations.length === 0) {
      return text;
    }
  
    const sortedAnnotations = [...annotations].sort(
      (a, b) => {
        if (a.start !== b.start) {
          return a.start - b.start;
        }
  
        return (
          (b.end - b.start) -
          (a.end - a.start)
        );
      }
    );
  
    const filteredAnnotations = [];
  
    let lastEnd = -1;
  
    for (const entity of sortedAnnotations) {
      if (entity.start >= lastEnd) {
        filteredAnnotations.push(entity);
        lastEnd = entity.end;
      }
    }
  
    const elements = [];
  
    let currentPosition = 0;
  
    filteredAnnotations.forEach((entity, index) => {
      if (entity.start > currentPosition) {
        elements.push(
          <span key={`text-${index}`}>
            {text.slice(
              currentPosition,
              entity.start
            )}
          </span>
        );
      }
  
      elements.push(
        <span
          key={`entity-${index}`}
          onClick={() => {
            setSelectedEntity(entity);
            setEditedLabel(entity.meaning_group);
          }}

          style={{
            backgroundColor: getLabelColor(entity.meaning_group),
            color: "#374151",
            padding: "1px 3px",
            borderRadius: "3px",
            fontWeight: "400",
            cursor: "pointer",
            lineHeight: "1.8",
            transition: "background-color 0.2s ease",
          }}
        >
          {entity.selected_text}
        </span>
      );
  
      currentPosition = entity.end;
    });
  
    if (currentPosition < text.length) {
      elements.push(
        <span key="remaining">
          {text.slice(currentPosition)}
        </span>
      );
    }
  
    return elements;
  };