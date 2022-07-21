import {
  Tooltip,
  SwitchSynced,
  initializeBlock,
  useCursor,
  FieldPickerSynced,
  Heading,
  Button,
  Text,
  useGlobalConfig,
  Box,
  useSynced,
  Label,
} from "@airtable/blocks/ui";
import { base } from "@airtable/blocks";
import React, { useState, useEffect } from "react";
import reindex, { ExcludeField } from "./reindex";
import FieldExcluder from "./fieldExcluder";

function App() {
  const globalConfig = useGlobalConfig();
  const cursor = useCursor();
  const table = base.getTableById(cursor.activeTableId);
  const [isValidIndexField, setIsValidIndexField] = useState(false);

  const indexFieldGlobalConfigKey = table.id + "_index_key";
  const indexFieldId =
    (globalConfig.get(indexFieldGlobalConfigKey) as string) || "";

  const excludedFieldsToggleGlobalConfigKey =
    table.id + "_excluded_fields_toggle_key";
  const excludedFieldsToggle =
    globalConfig.get(excludedFieldsToggleGlobalConfigKey) || "";

  const excludedFieldsGlobalConfigKey = table.id + "_excluded_fields";
  const [excludedFieldsRawVal, setExcludedFieldsRawVal, canSetExcludedFields] =
    useSynced(excludedFieldsGlobalConfigKey);

  const excludedFields = excludedFieldsRawVal
    ? (JSON.parse(excludedFieldsRawVal as string) as ExcludeField[])
    : [];

  console.log("stored exclusion fields", excludedFields);

  useEffect(() => {
    setIsValidIndexField(
      table.getFieldByIdIfExists(indexFieldId)?.type === "number"
    );
  }, [indexFieldId, table]);

  return (
    <Box padding={3}>
      <Heading marginBottom={2} size="large">
        Active table: {table.name}
      </Heading>
      <Text marginBottom={4}>
        Click Reindex to update a{" "}
        <Tooltip
          content="This field must be of type 'number'"
          placementX={Tooltip.placements.CENTER}
          placementY={Tooltip.placements.TOP}
          shouldHideTooltipOnClick={true}
        >
          <Button>field</Button>
        </Tooltip>{" "}
        so that it matches the natural ascending (1,2,3..) order of rows. The
        order is independent of any view or filter.
      </Text>
      <Box marginY={2} flexDirection="column">
        <Label htmlFor="my-input">Index Field</Label>
        <Box>
          <FieldPickerSynced
            globalConfigKey={indexFieldGlobalConfigKey}
            allowedTypes={["number"]}
            table={table}
          />
        </Box>
      </Box>
      <Box marginTop={2} marginBottom={3}>
        <SwitchSynced
          globalConfigKey={excludedFieldsToggleGlobalConfigKey}
          label="Should Exclude Items?"
        />
        {excludedFieldsToggle && (
          <FieldExcluder
            table={table}
            excludedFields={excludedFields}
            setGlobalExcludes={(e: ExcludeField[]) => {
              console.log("filed to exclude set", e);
              if (canSetExcludedFields) {
                setExcludedFieldsRawVal(JSON.stringify(e));
              }
            }}
          />
        )}
      </Box>
      <Button
        disabled={!isValidIndexField}
        onClick={() =>
          reindex({
            table,
            indexName: globalConfig.get(indexFieldGlobalConfigKey) as string,
            excludeFields:
              excludedFieldsToggle && excludedFields ? excludedFields : [],
          })
        }
        size="large"
        icon="automations"
      >
        Reindex
      </Button>
      {/* <Fiedld */}
    </Box>
  );
}

initializeBlock(() => <App />);
