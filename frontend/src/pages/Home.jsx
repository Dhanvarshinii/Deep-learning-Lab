import { useState, useRef } from "react";
import { annotateText } from "../services/annotationService";
import EntityPanel from "../components/EntityPanel";
import ActionButtons from "../components/ActionButtons";
import ClinicalTextInput from "../components/ClinicalTextInput";
import UploadedFileCard from "../components/UploadedFileCard";
import * as pdfjsLib from "pdfjs-dist";
import LoadingIndicator from "../components/LoadingIndicator";
import AddAnnotationModal from "../components/AddAnnotationModal";
import DocumentViewer from "../components/DocumentViewer";
import ModelSelector from "../components/ModelSelector";
import SelectedEntityPanel from "../components/SelectedEntityPanel";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

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
  
  const [displayText, setDisplayText] =
    useState("");
  
  const [editedLabel, setEditedLabel] =
    useState("");

  const fileInputRef = useRef(null);

  const [uploadedFile, setUploadedFile] =
  useState(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const colorPalette = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#ca8a04",
    "#db2777",
  ];

  const getLabelColor = (label) => {
    const labels = [
      ...new Set(
        annotations.map(
          (item) => item.meaning_group
        )
      ),
    ];

    const index = labels.indexOf(label);

    return (
      colorPalette[
        index % colorPalette.length
      ]
    );
  };

  const [selectionPopup, setSelectionPopup] =
    useState(null);

  const [showDeletePopup,
    setShowDeletePopup] =
    useState(false);

  const [newLabel, setNewLabel] =
    useState("");

    const handleTextSelection = (
      selectedText
    ) => {
      setSelectionPopup({
        text: selectedText,
      });
    };

    const handleMouseUp = () => {
      const selection =
        window.getSelection();
    
      const selectedText =
        selection.toString().trim();
    
      if (selectedText) {
        handleTextSelection(
          selectedText
        );
      }
    };
  
    const handleAddAnnotation = () => {
      if (
        !selectionPopup ||
        !newLabel
      ) {
        return;
      }
    
      const start =
        displayText.indexOf(
          selectionPopup.text
        );
    
      if (start === -1) {
        return;
      }
    
      const end =
        start +
        selectionPopup.text.length;
    
      const newEntity = {
        selected_text:
          selectionPopup.text,
        meaning_group:
          newLabel,
        model: "MANUAL",
        start,
        end,
      };
    
      setAnnotations([
        ...annotations,
        newEntity,
      ]);
    
      setSelectionPopup(null);
    
      setNewLabel("");
    };

  const handleAnnotate = async () => {
    try {
      setIsLoading(true);
  
      const inputText =
      uploadedFile?.text || text;

    console.log("INPUT TEXT:");
    console.log(inputText);

    console.log("TEXT LENGTH:");
    console.log(inputText.length);
  
    const response = await annotateText(
      selectedModel,
      inputText
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
    const updatedAnnotations =
      annotations.map((item) => {
        if (
          item.selected_text ===
            selectedEntity.selected_text &&
          item.model ===
            selectedEntity.model
        ) {
          return {
            ...item,
            meaning_group:
              editedLabel,
          };
        }
  
        return item;
      });
  
    setAnnotations(
      updatedAnnotations
    );
  
    setSelectedEntity({
      ...selectedEntity,
      meaning_group:
        editedLabel,
    });
  };

  const handleDeleteEntity = () => {
    if (!selectedEntity) {
      return;
    }
  
    const updatedAnnotations =
      annotations.filter(
        (item) =>
          !(
            item.selected_text ===
              selectedEntity.selected_text &&
            item.model ===
              selectedEntity.model &&
            item.start ===
              selectedEntity.start
          )
      );
  
    setAnnotations(
      updatedAnnotations
    );
  
    setSelectedEntity(null);
  };

  const handleClearAll = () => {
    setText("");
    setDisplayText("");
    setAnnotations([]);
    setSelectedEntity(null);
    setEditedLabel("");
    setUploadedFile(null);
  };

  const handleDownloadJSON = () => {
    const exportData = {
      document_name:
        uploadedFile?.name ||
        "manual_input",
  
      annotation_model:
        selectedModel,
  
      annotations:
        annotations,
    };
  
    const jsonString =
      JSON.stringify(
        exportData,
        null,
        2
      );
  
    const blob = new Blob(
      [jsonString],
      {
        type:
          "application/json",
      }
    );
  
    const url =
      URL.createObjectURL(blob);
  
    const link =
      document.createElement("a");
  
    link.href = url;
  
    link.download =
      "annotations.json";
  
    link.click();
  
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
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            fontSize: "38px",
            marginBottom: "10px",
            color: "#1e3a8a",
          }}
        >
          Clinical NER Annotation Tool
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#6b7280",
          }}
        >
          Human-in-the-loop Clinical
          Entity Annotation Platform
        </p>
      </div>

      <ModelSelector
        selectedModel={selectedModel}
        setSelectedModel={
          setSelectedModel
        }
      />

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
      handleDownloadJSON={
        handleDownloadJSON
      }
      isLoading={isLoading}
      annotations={annotations}
    />

      <UploadedFileCard
        uploadedFile={uploadedFile}
      />

      <LoadingIndicator
        isLoading={isLoading}
      />
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
          setSelectedEntity={
            setSelectedEntity
          }
          editedLabel={editedLabel}
          setEditedLabel={
            setEditedLabel
          }
          handleSaveEntity={
            handleSaveEntity
          }
          getLabelColor={
            getLabelColor
          }
        />

        <SelectedEntityPanel
          selectedEntity={
            selectedEntity
          }
          editedLabel={editedLabel}
          setEditedLabel={
            setEditedLabel
          }
          handleSaveEntity={
            handleSaveEntity
          }
          handleDeleteEntity={
            handleDeleteEntity
          }
          showDeletePopup={
            showDeletePopup
          }
          setShowDeletePopup={
            setShowDeletePopup
          }
          setSelectedEntity={
            setSelectedEntity
          }
          annotations={annotations}
        />
      </div>

        <AddAnnotationModal
          selectionPopup={
            selectionPopup
          }
          newLabel={newLabel}
          setNewLabel={setNewLabel}
          annotations={annotations}
          handleAddAnnotation={
            handleAddAnnotation
          }
          setSelectionPopup={
            setSelectionPopup
          }
        />

      <DeleteConfirmationModal
        showDeletePopup={
          showDeletePopup
        }
        selectedEntity={
          selectedEntity
        }
        handleDeleteEntity={
          handleDeleteEntity
        }
        setShowDeletePopup={
          setShowDeletePopup
        }
        />
        </div>
      </div>
  );
}

