import {
  initializeBlock,
  useCursor,
  FieldPickerSynced,
  Heading,
  Button,
  Text,
  useGlobalConfig,
  Box,
  Label,
} from "@airtable/blocks/ui";
import { base } from "@airtable/blocks";
import React, { useState, useEffect } from "react";
import Table from "@airtable/blocks/dist/types/src/models/table";

const reindex = async ({
  table,
  indexName,
  excludeFields = null,
}: {
  table: Table;
  indexName: string;
  excludeFields: {
    fieldName: string;
    exclusionCriteria: {
      is?: string;
      includes?: string;
      // possibly more can be created as need arises
    };
  }[];
}): Promise<void> => {
  const excludedFieldNames =
    excludeFields?.map((e) => table.getField(e.fieldName)) || [];
  console.log(34554, excludedFieldNames);

  // get the index field along with any ones that we want to skip for indexing
  let result = await table.selectRecordsAsync({
    fields: [table.getField(indexName), ...excludedFieldNames],
  });

  let i = 0,
    len = result.records.length;
  let discardedRows = 0;

  while (i < len) {
    const record = result.records[i];
    // go over all of our values, if no exclusion criteria, assume its valid
    const isValid = excludeFields
      ? excludeFields.reduce((acc, e) => {
          const val = record.getCellValueAsString(e.fieldName);
          console.log(234234, val);
          return acc;
        }, false)
      : true;

    const cellIndex = record.getCellValue(indexName);

    if (!isValid) {
      // set our index to zero, as it will never be used
      await table.updateRecordAsync(record, {
        [indexName]: 0,
      });
      discardedRows += 1;
    }

    i += 1;
    const expectedIndex = i - discardedRows;

    if (record && isValid && cellIndex !== expectedIndex) {
      // we don't want this to run when the indices are matched, save a few ms
      await table.updateRecordAsync(record, {
        [indexName]: expectedIndex,
      });
    }
  }
  return null;
};

function App() {
  const globalConfig = useGlobalConfig();
  const cursor = useCursor();
  const table = base.getTableById(cursor.activeTableId);
  const [isValidIndexField, setIsValidIndexField] = useState(false);
  const indexFieldGlobalConfigKey = table.id + "_index_key";
  const indexFieldId = globalConfig.get(indexFieldGlobalConfigKey) || "";

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
        Click Reindex to update a field so that it matches the natural ascending
        (1,2,3..) order of rows. The order is independent of any view or filter.
      </Text>

      <Box marginY={2} flexDirection="column">
        <Label htmlFor="my-input">Index Field</Label>
        <Box>
          <FieldPickerSynced
            globalConfigKey={indexFieldGlobalConfigKey}
            allowedTypes={["number"]}
            table={table}
            width="320px"
          />
        </Box>
      </Box>
      <Button
        disabled={!isValidIndexField}
        onClick={() =>
          reindex({
            table,
            indexName: globalConfig.get(indexFieldGlobalConfigKey),
            // excludeFields:
          })
        }
        size="large"
        icon="automations"
      >
        Reindex
      </Button>
    </Box>
  );
}

initializeBlock(() => <App />);
