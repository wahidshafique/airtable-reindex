import {
  initializeBlock,
  useCursor,
  Heading,
  Input,
  Button,
  Text,
  Box,
  Label,
} from "@airtable/blocks/ui";
import { base } from "@airtable/blocks";
import React, { useState, useEffect } from "react";

const reindex = async ({ table, view, indexName }) => {
  let result = await view.selectRecordsAsync({
    fields: [table.getField(indexName), table.getField("Status")],
  });

  let i = 0,
    len = result.records.length;
  let discardedRows = 0;

  while (i < len) {
    const record = result.records[i];
    // TODO: doit
    const statusValue = record.getCellValue("Status");
    const isValid = statusValue && statusValue.name === "Approved For Game";

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
      // we dont want this to run when the indices are matched, save a few millisecs
      await table.updateRecordAsync(record, {
        [indexName]: expectedIndex,
      });
    }
  }
};

const DEFAULT_INDEX_NAME = "Index";

function App() {
  const [hasChosenValidField, setHasChosenValidField] = useState(false);
  const [indexFieldNameValue, setIndexFieldNameValue] =
    useState(DEFAULT_INDEX_NAME);
  const cursor = useCursor();
  const table = base.getTableById(cursor.activeTableId);
  const viewid = cursor.activeViewId;

  useEffect(() => {
    const indexFieldCheck =
      table.getFieldByNameIfExists(indexFieldNameValue) !== null;
    console.log(indexFieldCheck);
    setHasChosenValidField(indexFieldCheck);
  }, [indexFieldNameValue, table]);

  return (
    <Box padding={3}>
      <Heading marginBottom={3} size="large">
        Active table: {table.name}
        <Text>
          Click reindex to update a field that matches the natural order of
          rows. By default we will try to find a field called: $
          {DEFAULT_INDEX_NAME}, but you can pick whatever you want
        </Text>
      </Heading>

      <Box marginY={2}>
        <Label htmlFor="my-input">Index Field</Label>
        <Input
          id="my-input"
          value={indexFieldNameValue}
          onChange={(e) => setIndexFieldNameValue(e.target.value)}
        />
      </Box>

      <Button
        disabled={!hasChosenValidField}
        onClick={() =>
          reindex({
            table,
            view: table.getViewById(viewid),
            indexName: indexFieldNameValue,
          })
        }
        size="large"
        icon="automations"
      >
        Reindex
      </Button>
      {!hasChosenValidField && (
        <Text marginY={2} textColor="tomato">
          {indexFieldNameValue} is not defined and cannot be reindexed. Please
          create a Number field with that name.
        </Text>
      )}
    </Box>
  );
}

initializeBlock(() => <App />);
