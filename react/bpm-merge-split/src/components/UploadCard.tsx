import { useDropzone } from "react-dropzone";
import { Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { translate } from "@studio/shared/i18n";

interface UploadCardProps {
  files?: File[];
  onFileUpload?: (files: File[]) => void;
}

function UploadCard({ files = [], onFileUpload = () => {} }: UploadCardProps) {
  const onDrop = (acceptedFiles: File[]) => {
    const bpmnFiles = acceptedFiles.filter((file) => file.name.endsWith(".bpmn"));
    onFileUpload(bpmnFiles);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true,
    useFsAccessApi: false,
  });

  const { color: _dropzoneColor, ...rootProps } = getRootProps();

  return (
    <Box
      {...rootProps}
      p={1}
      bg="body-tertiary"
      border
      rounded
      shadow="inner"
      style={{ maxWidth: 400, cursor: "pointer" }}
      textAlign="center"
      mx={2}
    >
      <input {...getInputProps()} />
      <MaterialIcon icon="upload_file" color="primary" />
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
