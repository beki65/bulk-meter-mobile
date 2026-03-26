import Papa from 'papaparse';

export const parseCustomerCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transformed = results.data.map(row => ({
          id: row['Customer ID'] || row.customer_id,
          name: row['Customer Name'] || row.customer_name,
          dmaId: row['DMA ID'] || row.dma_id,
          meterNumber: row['Meter Number'] || row.meter_number,
          consumption: {
            month1: parseFloat(row['Month 1']) || 0,
            month2: parseFloat(row['Month 2']) || 0,
            month3: parseFloat(row['Month 3']) || 0,
            month4: parseFloat(row['Month 4']) || 0,
            month5: parseFloat(row['Month 5']) || 0,
            month6: parseFloat(row['Month 6']) || 0,
          }
        }));
        resolve(transformed);
      },
      error: (error) => reject(error)
    });
  });
};