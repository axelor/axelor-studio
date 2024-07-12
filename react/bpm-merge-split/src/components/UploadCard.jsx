import { useDropzone } from "react-dropzone";
import { Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { translate } from "../utils";

function UploadCard({ files = [], onFileUpload = () => {} }) {
  const onDrop = (acceptedFiles) => {
    const bpmnFiles = acceptedFiles.filter((file) =>
      file.name.endsWith(".bpmn")
    );
    onFileUpload(bpmnFiles);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <Box
      p={1}
      bg="body-tertiary"
      border
      rounded
      shadow="inner"
      maxWidth={400}
      textAlign="center"
      mx={2}
    >
      <Box {...getRootProps()} style={{ cursor: "pointer" }}>
        <input {...getInputProps()} />
        <MaterialIcon icon="upload_file" color="primary" />
      </Box>
      <Box style={{ fontSize: "12px" }} mt={2} color="body-tertiary">
        {translate("Drag and drop files here, or click to select files")}
      </Box>

      {files.length > 0 && (
        <Box mt={2}>
          <Box>
            {files.length} {translate("file(s) selected")}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default UploadCard;
