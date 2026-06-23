import { useState, useRef } from "react";
import { annotateText } from "../services/annotationService";
import Header from "../components/Header";
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

  const [editingEntity, setEditingEntity] =
    useState(null);
  
  const [displayText, setDisplayText] =
    useState("");
  
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

  const [selectedLabel,
    setSelectedLabel] =
    useState("");
  
  const [customLabel,
    setCustomLabel] =
    useState("");

    const handleTextSelection = (
      text,
      start,
      end
    ) => {
      setSelectionPopup({
        text,
        start,
        end,
      });
    };

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

    console.log("INPUT TEXT:");
    console.log(inputText);

    console.log("TEXT LENGTH:");
    console.log(inputText.length);
  
    const response = await annotateText(
      selectedModel,
      inputText
    );
    
    console.log("BACKEND RESPONSE:");
    console.log(response);
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
            meaning_group:
              finalLabel,
          
            score:
              Number(
                editedScore
              ) / 100,
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
      finalLabel,
    });
  };

  const handleDeleteEntity = (
    entityToDelete
  ) => {
    const updatedAnnotations =
      annotations.filter(
        (item) =>
          !(
            item.start ===
              entityToDelete.start &&
            item.end ===
              entityToDelete.end
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
  
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      <Header />

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

          getLabelColor={getLabelColor}
        />

      {/* <SelectedEntityPanel
        selectedEntity={selectedEntity}
        editedLabel={editedLabel}
        setEditedLabel={setEditedLabel}
        customEditedLabel={customEditedLabel}
        setCustomEditedLabel={setCustomEditedLabel}
        handleSaveEntity={handleSaveEntity}
        handleDeleteEntity={handleDeleteEntity}
        showDeletePopup={showDeletePopup}
        setShowDeletePopup={setShowDeletePopup}
        setSelectedEntity={setSelectedEntity}
        annotations={annotations}
      /> */}
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

      {/* <DeleteConfirmationModal
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
        /> */}
        </div>
      </div>
  );
}

