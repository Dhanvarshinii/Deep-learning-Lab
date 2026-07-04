import { useState, useRef } from "react";
import { annotateText } from "../services/annotationService";
import Header from "../components/Header";
import EntityPanel from "../components/EntityPanel";
import ActionButtons from "../components/ActionButtons";
import ClinicalTextInput from "../components/ClinicalTextInput";
import UploadedFileCard from "../components/UploadedFileCard";
import * as pdfjsLib from "pdfjs-dist";
import AddAnnotationModal from "../components/AddAnnotationModal";
import DocumentViewer from "../components/DocumentViewer";
import ModelSelector from "../components/ModelSelector";
import LoadingOverlay from "../components/LoadingOverlay";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import SaveConfirmationModal
  from "../components/SaveConfirmationModal";
import ExportSuccessModal
  from "../components/ExportSuccessModal";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

export default function Home() {
  const [selectedModel, setSelectedModel] = useState(
    "Ensemble Transformer"
  );

  const [text, setText] = useState("");

  const [annotations, setAnnotations] = useState([]);

  const [selectedEntity, setSelectedEntity] =
    useState(null);

  const [editingEntity, setEditingEntity] =
    useState(null);
  
  const [displayText, setDisplayText] =
    useState("");

  const [processingTime, setProcessingTime] = useState("--");
  
  const [editedLabel, setEditedLabel] =
    useState("");
  
  const [customEditedLabel,
    setCustomEditedLabel] =
    useState("");

  const [editedScore, setEditedScore] =
    useState("");

  const fileInputRef = useRef(null);

  const [uploadedFile, setUploadedFile] =
  useState(null);

  const [showExportSuccess, setShowExportSuccess] =
  useState(false);
  
  const [exportFileName,
    setExportFileName] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);


  const labelColorMap = useRef({});

  const getLabelColor = (label) => {
    if (!labelColorMap.current[label]) {
      let hash = 0;

      for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
      }

      const hue = Math.abs(hash) % 360;

      labelColorMap.current[label] =
        `hsl(${hue}, 65%, 88%)`;
    }

    return labelColorMap.current[label];
  };

  const [selectionPopup, setSelectionPopup] =
    useState(null);

  const [showDeletePopup,
    setShowDeletePopup] =
    useState(false);
  
  const [showSavePopup, setShowSavePopup] =
    useState(false);

  const [selectedLabel,
    setSelectedLabel] =
    useState("");
  
  const [customLabel,
    setCustomLabel] =
    useState("");

  const handleMouseUp = () => {
    const selection =
      window.getSelection();
  
    const selectedText =
      selection.toString();
  
    if (!selectedText.trim()) {
      return;
    }
  
    const range =
      selection.getRangeAt(0);
  
    const selectedNodeText =
      range.startContainer.textContent;
  
    const nodeOffset =
      selectedNodeText.indexOf(
        selectedText
      );
  
    const globalStart =
      displayText.indexOf(
        selectedNodeText
      ) + nodeOffset;
  
    const globalEnd =
      globalStart +
      selectedText.length;
  
    setSelectionPopup({
      text: selectedText,
      start: globalStart,
      end: globalEnd,
    });
  };
  
    const handleAddAnnotation = () => {
      const finalLabel =
      customLabel.trim() ||
      selectedLabel;

    if (
      !selectionPopup ||
      !finalLabel
    ) {
      return;
    }
    
    const newEntity = {
      selected_text:
        selectionPopup.text,
    
      meaning_group:
        finalLabel,
    
      model: "MANUAL",
    
      score: 1.0,
    
      start:
        selectionPopup.start,
    
      end:
        selectionPopup.end,
    };

      setAnnotations([
        ...annotations,
        newEntity,
      ]);
    
      setSelectionPopup(null);

      setSelectedLabel("");
      setCustomLabel("");
    };

  const handleAnnotate = async () => {
    try {
      setIsLoading(true);
  
      const inputText =
      uploadedFile?.text || text;

    const start = performance.now();
  
    const response = await annotateText(
      selectedModel,
      inputText
    );

    const end = performance.now();

    setProcessingTime(
      ((end - start) / 1000).toFixed(2)
    );
    
    if (response.error) {
      alert(response.error);
      setIsLoading(false);
      return;
    }
  
      setAnnotations(
        response.entities
      );
  
      setDisplayText(inputText);
    } catch (error) {
      console.error(
        "Backend Error:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };


  const handleSaveEntity = () => {
    const finalLabel =
      customEditedLabel.trim() ||
      editedLabel;

    const updatedAnnotations =
      annotations.map((item) => {
        if (
          item.start ===
            selectedEntity.start &&
          item.end ===
            selectedEntity.end
        ) {
          return {
            ...item,
            meaning_group: finalLabel,
          
            ...(item.score !== undefined && {
              score:
                Number(
                  editedScore
                ) / 100,
            }),
          };
        }
  
        return item;
      });
  
    setAnnotations(
      updatedAnnotations
    );
  
    setSelectedEntity({
      ...selectedEntity,
      meaning_group: finalLabel,
    
      ...(selectedEntity.score !== undefined && {
        score: Number(editedScore) / 100,
      }),
    });

    setEditingEntity(null);
  };

  const handleDeleteEntity = () => {
    if (!selectedEntity) return;
  
    const updatedAnnotations =
      annotations.filter(
        (item) =>
          !(
            item.start === selectedEntity.start &&
            item.end === selectedEntity.end
          )
      );
  
    setAnnotations(updatedAnnotations);
  
    setSelectedEntity(null);
    setEditingEntity(null);
    setShowDeletePopup(false);
  };

  const handleClearAll = () => {
    setText("");
    setDisplayText("");
    setAnnotations([]);
    setSelectedEntity(null);
    setEditedLabel("");
    setUploadedFile(null);

    // Reset processing time
    setProcessingTime("--");
  
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadJSON = async () => {
    const exportData = {
      document_name: uploadedFile?.name || "manual_input",
      annotation_model: selectedModel,
      annotations,
    };
  
    const jsonString = JSON.stringify(exportData, null, 2);

    // Generate a timestamped default filename
    const baseName =
      (uploadedFile?.name || "manual_input")
        .replace(/\.[^/.]+$/, "");

    const now = new Date();

    const timestamp =
      `${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, "0")}-` +
      `${String(now.getDate()).padStart(2, "0")}_` +
      `${String(now.getHours()).padStart(2, "0")}-` +
      `${String(now.getMinutes()).padStart(2, "0")}`;

    const defaultFileName =
      `${baseName}_annotations_${timestamp}.json`;
  
    // Modern browsers (Chrome, Edge)
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultFileName,
          types: [
            {
              description: "JSON Files",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        });
  
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        setExportFileName(defaultFileName);
        setShowExportSuccess(true);
  
        return;
      } catch (err) {
        if (err.name === "AbortError") {
            return;
        }
    
        console.error("Export failed:", err);
    
        alert(
            "Unable to save the annotations.\n\nPlease try again."
        );
    }
  }
  
    // Fallback for unsupported browsers
    const blob = new Blob([jsonString], {
      type: "application/json",
    });
  
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
  
    link.href = url;
    link.download = defaultFileName;
  
    link.click();

    setExportFileName(defaultFileName);
    setShowExportSuccess(true);
  
    URL.revokeObjectURL(url);
  };
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
  
    if (!file) return;
  
    // TXT FILE
    if (file.name.endsWith(".txt")) {
      const reader = new FileReader();
  
      reader.onload = (e) => {
        setUploadedFile({
          name: file.name,
          text: e.target.result,
        });
      };
  
      reader.readAsText(file);
      return;
    }
  
    // PDF FILE
    if (file.name.endsWith(".pdf")) {
      try {
        const arrayBuffer =
          await file.arrayBuffer();
  
        const pdf =
          await pdfjsLib.getDocument({
            data: arrayBuffer,
          }).promise;
  
        let extractedText = "";
  
        for (
          let pageNum = 1;
          pageNum <= pdf.numPages;
          pageNum++
        ) {
          const page =
            await pdf.getPage(pageNum);
  
          const textContent =
            await page.getTextContent();
  
          const pageText =
            textContent.items
              .map((item) => item.str)
              .join(" ");
  
          extractedText +=
            pageText + "\n\n";
        }
  
        setUploadedFile({
          name: file.name,
          text: extractedText,
        });
      } catch (error) {
        console.error(
          "PDF extraction failed:"
        );
        
        console.error(error);
        
        alert(
          "PDF Error: " +
            (error?.message || error)
        );
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "30px",
      }}
    >
      <Header
        annotations={annotations}
        processingTime={processingTime}
      />

      <LoadingOverlay
              loading={isLoading}
              selectedModel={selectedModel}
            />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "20px",
          marginBottom: "25px",
          alignItems: "start",
        }}
      >
        <ModelSelector
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />

        <div>
          <ClinicalTextInput
            text={text}
            uploadedFile={uploadedFile}
            setText={setText}
          />

          <ActionButtons
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            handleAnnotate={handleAnnotate}
            handleClearAll={handleClearAll}
            handleDownloadJSON={handleDownloadJSON}
            isLoading={isLoading}
            annotations={annotations}
            uploadedFile={uploadedFile}
            text={text}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "2fr 1fr",
          gap: "20px",
          height: "700px",
        }}
      >
        <DocumentViewer
          text={displayText}
          annotations={annotations}
          getLabelColor={getLabelColor}
          setSelectedEntity={
            setSelectedEntity
          }
          setEditedLabel={
            setEditedLabel
          }
          handleMouseUp={
            handleMouseUp
          }
        />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          height: "700px",
        }}
      >
        <EntityPanel
          annotations={annotations}
          selectedEntity={selectedEntity}
          setSelectedEntity={setSelectedEntity}

          editingEntity={editingEntity}
          setEditingEntity={setEditingEntity}

          editedLabel={editedLabel}
          setEditedLabel={setEditedLabel}

          customEditedLabel={customEditedLabel}
          setCustomEditedLabel={setCustomEditedLabel}

          editedScore={editedScore}
          setEditedScore={setEditedScore}

          handleSaveEntity={handleSaveEntity}
          handleDeleteEntity={handleDeleteEntity}

          setShowDeletePopup={setShowDeletePopup}
          setShowSavePopup={setShowSavePopup}

          getLabelColor={getLabelColor}
        />
      </div>

      <AddAnnotationModal
        selectionPopup={selectionPopup}
        selectedLabel={selectedLabel}
        setSelectedLabel={setSelectedLabel}
        customLabel={customLabel}
        setCustomLabel={setCustomLabel}
        annotations={annotations}
        handleAddAnnotation={handleAddAnnotation}
        setSelectionPopup={setSelectionPopup}
      />

      <DeleteConfirmationModal
        showDeletePopup={showDeletePopup}
        selectedEntity={selectedEntity}
        handleDeleteEntity={handleDeleteEntity}
        setShowDeletePopup={setShowDeletePopup}
      />    

      <SaveConfirmationModal
        showSavePopup={showSavePopup}
        selectedEntity={selectedEntity}
        editedLabel={editedLabel}
        customEditedLabel={customEditedLabel}
        editedScore={editedScore}
        handleSaveEntity={handleSaveEntity}
        setShowSavePopup={setShowSavePopup}
      />

        <ExportSuccessModal
          showExportSuccess={showExportSuccess}
          fileName={exportFileName}
          setShowExportSuccess={setShowExportSuccess}
        />
        </div>
      </div>
  );
}

