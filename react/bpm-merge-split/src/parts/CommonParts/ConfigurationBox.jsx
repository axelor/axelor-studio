import { Box, TextField } from "@axelor/ui";
import { useState } from "react";
import { useEffect } from "react";
import { useCallback } from "react";
import { translate } from "../../utils";

const ConfigurationBox = ({ data = {}, update = () => {} }) => {
  const { id, name, code } = data;
  const setProperty = useCallback(
    async (name, value) => {
      update(id, name, value);
    },
    [id, update]
  );

  const [formData, setFormData] = useState({});

  const handleInputChange = useCallback(
    (name, value) => {
      setFormData({
        ...formData,
        [name]:
          value && name === "code" ? value.toString()?.toUpperCase() : value,
      });
    },
    [formData]
  );

  const onBlur = (e) => {
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
          description={!formData.name && translate("Name field is required")}
          value={formData["name"] || ""}
          onChange={(e) => handleInputChange("name", e.target.value)}
          onBlur={onBlur}
        />
      </Box>
      <Box my={2}>
        <TextField
          label={translate("Code")}
          placeholder={translate("Code")}
          name="code"
          invalid={!formData.code}
          description={!formData.code && translate("Code field is required")}
          value={formData["code"] || ""}
          onChange={(e) => handleInputChange("code", e.target.value)}
          onBlur={onBlur}
        />
      </Box>
    </Box>
  );
};

export default ConfigurationBox;
