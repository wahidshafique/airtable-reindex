import Table from "@airtable/blocks/dist/types/src/models/table";
import {
  Tooltip,
  SwitchSynced,
  initializeBlock,
  useCursor,
  FieldPicker,
  Heading,
  Button,
  Text,
  useGlobalConfig,
  Box,
  Label,
} from "@airtable/blocks/ui";
import React from "react";
import { ExcludeField } from "./reindex";

interface Props {
  excludedFields: ExcludeField[];
  setGlobalExcludes: (e: ExcludeField[]) => void;
  table: Table;
}

export default function FieldExcluder({
  table,
  setGlobalExcludes,
  excludedFields = [],
}: Props) {
  return (
    <Box>
      {excludedFields.map((f) => (
        <Box
          key={f.fieldName}
          marginY={3}
          padding={2}
          borderRadius="4px"
          border="1px solid lightgray"
        >
          <Label>Field To Exclude</Label>
          <Box>
            <FieldPicker
              allowedTypes={[
                "singleLineText",
                "email",
                "url",
                "singleSelect",
                "multipleSelects",
              ]}
              table={table}
              width="320px"
            />
          </Box>
        </Box>
      ))}
      <Box style={{ float: "right" }}>
        <Button
          onClick={() => {
            // introduce a dummy data field
            setGlobalExcludes([
              ...excludedFields,
              {
                fieldName: "",
                exclusionCriteria: {
                  type: "is",
                  value: "",
                },
              },
            ]);
          }}
          icon="plusFilled"
        >
          Add field to exclude
        </Button>
      </Box>
    </Box>
  );
}
