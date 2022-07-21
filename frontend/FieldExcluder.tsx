import Table from "@airtable/blocks/dist/types/src/models/table";
import {
  Tooltip,
  SwitchSynced,
  initializeBlock,
  useCursor,
  FieldPicker,
  Heading,
  Input,
  Button,
  SelectButtons,
  Text,
  useGlobalConfig,
  Box,
  Label,
} from "@airtable/blocks/ui";
import React from "react";
import { ExcludeField, ExclusionCriteriaTypes } from "./reindex";

interface LogicOptions {
  value: ExclusionCriteriaTypes;
  label: string;
}

const logicOptions: LogicOptions[] = [
  { value: "is", label: "Is" },
  { value: "includes", label: "Includes" },
];

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
      {excludedFields.map((excludedField, index) => {
        const findAndSetGlobalExcludeList = (
          newFields: Partial<ExcludeField>
        ) =>
          setGlobalExcludes(
            excludedFields.map((e) => {
              if (e.fieldId === excludedField.fieldId) {
                return {
                  ...e,
                  ...newFields,
                };
              }
              return e;
            })
          );
        return (
          <Box
            key={excludedField.fieldId + index}
            marginY={3}
            padding={2}
            borderRadius="4px"
            border="1px solid lightgray"
          >
            <Label>Field To Exclude</Label>
            <Box style={{ float: "right", margin: 2 }}>
              <Button
                onClick={() => {
                  // purposefully remove all duplicates as they are hairy to handle anyways, for now
                  const excludedFieldsMinusCurrent = excludedFields.filter(
                    (e) => e.fieldId !== excludedField.fieldId
                  );
                  setGlobalExcludes(excludedFieldsMinusCurrent);
                }}
                icon="trash"
              ></Button>
            </Box>
            <Box>
              <FieldPicker
                field={
                  excludedField?.fieldId
                    ? table.getFieldByIdIfExists(excludedField?.fieldId)
                    : ""
                }
                allowedTypes={[
                  "singleLineText",
                  "email",
                  "url",
                  "singleSelect",
                  "multipleSelects",
                ]}
                onChange={(selectedField) => {
                  findAndSetGlobalExcludeList({
                    fieldId: selectedField.id,
                  });
                }}
                table={table}
              />
              {table.getFieldByIdIfExists(excludedField?.fieldId) && (
                <Box marginY={2}>
                  <SelectButtons
                    value={excludedField.exclusionCriteria.type}
                    onChange={(newValue) =>
                      findAndSetGlobalExcludeList({
                        exclusionCriteria: {
                          type: newValue,
                          // void out value bc we don't care to keep it when you switch criteria
                          value: "",
                        },
                      })
                    }
                    options={logicOptions}
                  />
                  <Input
                    marginY={2}
                    value={excludedField.exclusionCriteria.value}
                    onChange={(e) =>
                      findAndSetGlobalExcludeList({
                        exclusionCriteria: {
                          type: excludedField.exclusionCriteria.type,
                          value: e.target.value,
                        },
                      })
                    }
                    placeholder={`Enter string to ${
                      excludedField.exclusionCriteria.type === "is"
                        ? "fully"
                        : "partially"
                    } match against`}
                  />
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
      <Box style={{ float: "right", margin: 2 }}>
        <Button
          onClick={() => {
            // introduce a dummy data field
            setGlobalExcludes([
              ...excludedFields,
              {
                fieldId: Math.random().toString(),
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
