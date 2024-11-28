import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import Spreadsheet, { Matrix } from "react-spreadsheet";

// 데이터 타입 정의
interface Cell {
  value: string | number | null;
}

export default function Excel(): JSX.Element {
  const spreadsheetRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<Matrix<Cell>>([]);
  const [uploadData, setUploadData] = useState<Matrix<Cell>>([]);

  const [main1, setMain1] = useState<number[]>([]);
  const [main2, setMain2] = useState<number[]>([]);
  const [main3, setMain3] = useState<number[]>([]);
  const [main4, setMain4] = useState<number[]>([]);
  const [main5, setMain5] = useState<number[]>([]);
  const [main6, setMain6] = useState<number[]>([]);
  const [bonus, setBonus] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/crawling3");
        const result = await response.json();
  
        // 데이터를 Spreadsheet에 맞게 변환
        const formattedData: Matrix<Cell> = result.map((row: any) => [
          { value: row.main1 },
          { value: row.main2 },
          { value: row.main3 },
          { value: row.main4 },
          { value: row.main5 },
          { value: row.main6 },
          { value: row.bonus },
        ]);
  
        // 상태에 저장
        setData(formattedData);
        setUploadData(formattedData);
  
        console.log("Formatted Data:", formattedData);
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };
  
    fetchData();
  }, []);
  


  // 데이터 변환 핸들러
  const handleSpreadsheetChange = (newData: Matrix<Cell>): void => {
    setData(newData);
  };


  
  // 파일 업로드 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>): void => {
      if (!event.target?.result) return;

      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
      }) as (string | number | null)[][];

      const formattedData: Matrix<Cell> = sheetData.map((row) =>
        row.map((value) => ({ value }))
      );

      setData(formattedData);
      setUploadData(formattedData); // 원래 데이터를 저장
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Excel Test</h1>
      <input type="file" onChange={handleFileUpload} />
      {uploadData.length > 0 && (
        <div ref={spreadsheetRef} style={{ marginBottom: "10px" }}>
          {/* 스프레드시트 */}
          <Spreadsheet data={data} onChange={handleSpreadsheetChange} />
        </div>
      )}      
    </div>
  );
}


