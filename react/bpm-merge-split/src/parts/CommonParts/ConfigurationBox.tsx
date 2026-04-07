import { Box, TextField } from "@axelor/ui";
import { useState, useEffect , useCallback  } from "react";
import { translate } from "@studio/shared/i18n";

interface BpmnModel {
  id?: string | number;
  name?: string;
  code?: string;
  [key: string]: unknown;
}

interface ConfigurationBoxProps {
  data?: BpmnModel;
  update?: (id: string | number | undefined, key: string, value: string) => void;
}

interface FormData {
  name?: string;
  code?: string;
  [key: string]: string | undefined;
}

const ConfigurationBox = ({ data = {}, update = () => {} }: ConfigurationBoxProps) => {
  const { id, name, code } = data;
  const setProperty = useCallback(
    (name: string, value: string) => {
      update(id, name, value);
    },
    [id, update],
  );

  const [formData, setFormData] = useState<FormData>({});

  const handleInputChange = useCallback(
    (name: string, value: string) => {
      setFormData({
        ...formData,
        [name]: value && name === "code" ? value.toString()?.toUpperCase() : value,
      });
    },
    [formData],
  );

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProperty(name, value);
  };

  useEffect(() => {
    setFormData({ code: code, name: name });
  }, [code, name]);

  return (
    <Box
      d="flex"
      flexDirection="column"
      flexWrap="nowrap"
      overflow="hidden"
      bg="body-tertiary"
      style={{ minWidth: "300px" }}
    >
      <Box my={2}>
        <TextField
          label={translate("Name")}
          placeholder={translate("Name")}
          name="name"
          invalid={!formData.name}
          description={!formData.name ? translate("Name field is required") : undefined}
          value={formData["name"] || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange("name", e.target.value)
          }
          onBlur={onBlur}
        />
      </Box>
      <Box my={2}>
        <TextField
          label={translate("Code")}
          placeholder={translate("Code")}
          name="code"
          invalid={!formData.code}
          description={!formData.code ? translate("Code field is required") : undefined}
          value={formData["code"] || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange("code", e.target.value)
          }
          onBlur={onBlur}
        />
      </Box>
    </Box>
  );
};

export default ConfigurationBox;
