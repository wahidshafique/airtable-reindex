import { initializeBlock } from "@airtable/blocks/ui";
import { base } from "@airtable/blocks";
import React from "react";

const reindex = async () => {
  // change these names to pick a view:
  const updateTable = async (tableName) => {
    let table = base.getTable(tableName);
    let view = table.getView("Index view");

    let result = await view.selectRecordsAsync({
      fields: [table.getField("Index"), table.getField("Status")],
    });

    let i = 0,
      len = result.records.length;
    let discardedRows = 0;

    while (i < len) {
      const record = result.records[i];
      // we do not sound statuses other than approved
      const statusValue = record.getCellValue("Status");
      const isValid = statusValue && statusValue.name === "Approved For Game";

      const cellIndex = record.getCellValue("Index");

      if (!isValid) {
        // set our index to zero, as it will never be used
        await table.updateRecordAsync(record, {
          Index: 0,
        });
        discardedRows += 1;
      }

      i += 1;
      const expectedIndex = i - discardedRows;

      if (record && isValid && cellIndex !== expectedIndex) {
        // we dont want this to run when the indices are matched, save a few millisecs
        await table.updateRecordAsync(record, {
          Index: expectedIndex,
        });
      }
    }
  };

  // aggregate our screen tables from game config
  let table = base.getTable("Game Configuration");
  let view = table.getView("Grid view");

  let config = await view.selectRecordsAsync({
    fields: [table.getField("Stream Table Names")],
  });
  // get array of screen table names here
  let screenTableNames = [];
  config.records.map((cell) => {
    const curRowCellVals = cell
      .getCellValue("Stream Table Names")
      .map((e) => e.name);
    screenTableNames = [...screenTableNames, ...curRowCellVals];
  });

  const screenTableSet = [...new Set(screenTableNames)];
  // run our updater based on the values we get, these vals are tied to the screen table names (user defined)
  console.log(screenTableSet);
  screenTableSet.map((e) => {
    updateTable(e);
  });
};

function App() {
  // YOUR CODE GOES HERE
  return <div>Hello world 🚀</div>;
}

initializeBlock(() => <App />);
