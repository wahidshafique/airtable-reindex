import Table from "@airtable/blocks/dist/types/src/models/table";

export interface ExcludeField {
  fieldName: string;
  exclusionCriteria: {
    type: "is" | "includes";
    value: string;
  };
}

const reindex = async ({
  table,
  indexName,
  excludeFields = [],
}: {
  table: Table;
  indexName: string;
  excludeFields?: ExcludeField[];
}): Promise<void> => {
  const excludedFieldNames =
    excludeFields?.map((e) => table.getField(e.fieldName)) || [];
  console.log("excluded field names", excludedFieldNames);

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
          // if we meet the criteria, its an instant flag as false
          if (acc) {
            if (e.exclusionCriteria.type === "is") {
              return e.exclusionCriteria.value === val;
            }
            if (e.exclusionCriteria.type === "includes") {
              return e.exclusionCriteria.value.includes(val);
            }
          }
        }, true)
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

export default reindex;
