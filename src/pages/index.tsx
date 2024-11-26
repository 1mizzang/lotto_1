import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import Spreadsheet, { Matrix } from "react-spreadsheet";

// 데이터 타입 정의
interface Cell {
  value: string | number | null;
}

type SpreadsheetData = Cell[][];

export default function HomePage(): JSX.Element {
  const [data, setData] = useState<SpreadsheetData>([]);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const spreadsheetRef = useRef<HTMLDivElement | null>(null);
  const [originalData, setOriginalData] = useState<SpreadsheetData>([]);

  // 정렬 상태와 우선순위 관리
  const [sortState, setSortState] = useState<Record<number, number>>({}); // 열별 정렬 상태 (-1: 내림차순, 1: 오름차순, 0: 초기 상태)
  const [sortPriority, setSortPriority] = useState<number[]>([]); // 정렬 우선순위 (열 인덱스 배열)

  const [numberFrequency, setNumberFrequency] = useState<{ [key: number]: number }>({});



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

      const formattedData: SpreadsheetData = sheetData.map((row) =>
        row.map((value) => ({ value }))
      );

      setData(formattedData);
      setOriginalData(formattedData); // 원래 데이터를 저장
    };

    reader.readAsBinaryString(file);
  };

  // 데이터 변환 핸들러
  const handleSpreadsheetChange = (newData: Matrix<Cell>): void => {
    const cleanedData: SpreadsheetData = newData.map((row) =>
      row.map((cell) => cell || { value: null })
    );
    setData(cleanedData);
  };

  // 정렬 상태를 열 우선순위로 관리
  const handleSortColumn = (columnIndex: number): void => {
    const currentState = sortState[columnIndex] || 0; // 현재 열의 정렬 상태 가져오기 (기본값: 0)
    let updatedSortPriority = [...sortPriority];

    if (currentState === 0) {
      // 새로운 열을 오름차순으로 추가
      updatedSortPriority.push(columnIndex);
      setSortState({ ...sortState, [columnIndex]: 1 }); // 상태: 오름차순
    } else if (currentState === 1) {
      // 현재 열을 내림차순으로 변경
      setSortState({ ...sortState, [columnIndex]: -1 }); // 상태: 내림차순
    } else {
      // 원래 데이터로 복원
      updatedSortPriority = updatedSortPriority.filter((idx) => idx !== columnIndex);
      setSortState({ ...sortState, [columnIndex]: 0 }); // 상태: 원래 상태
    }

    // 정렬 우선순위 갱신
    setSortPriority(updatedSortPriority);

    // 정렬 적용
    applyMultiColumnSort(updatedSortPriority);
  };

  const applyMultiColumnSort = (priority: number[]): void => {
    const sortedData = [...originalData];
    const header = sortedData[0];
    const body = sortedData.slice(1);

    body.sort((a, b) => {
      for (const columnIndex of priority) {
        const state = sortState[columnIndex] || 0;
        if (state === 0) continue; // 정렬되지 않은 상태는 무시

        const valueA = a[columnIndex]?.value ?? "";
        const valueB = b[columnIndex]?.value ?? "";

        let comparison = 0;
        if (typeof valueA === "number" && typeof valueB === "number") {
          comparison = state === 1 ? valueA - valueB : valueB - valueA;
        } else {
          comparison =
            state === 1
              ? String(valueA).localeCompare(String(valueB))
              : String(valueB).localeCompare(String(valueA));
        }

        // 비교 결과가 0이 아니면 해당 열 기준으로 정렬
        if (comparison !== 0) return comparison;
      }
      return 0; // 모든 정렬 조건이 동일할 경우
    });

    setData([header, ...body]);
  };


  // 정렬버튼 - 정렬 상태에 따른 버튼 배경색 반환 함수
  const getButtonBackgroundColor = (state: number): string => {
    if (state === 1) return "orange"; // 오름차순
    if (state === -1) return "lightcoral"; // 내림차순
    return "white"; // 원래 상태
  };

  // 정렬버튼 - 열 이름(A, B, C...) 생성 함수
  const getColumnName = (index: number): string => {
    let columnName = "";
    while (index >= 0) {
      columnName = String.fromCharCode((index % 26) + 65) + columnName;
      index = Math.floor(index / 26) - 1;
    }
    return columnName;
  };


  useEffect(() => {
    if (spreadsheetRef.current) {
      // 스프레드시트 헤더의 모든 셀 가져오기
      const headerCells = spreadsheetRef.current.querySelectorAll("th.Spreadsheet__header");

      // 각 셀의 가로 길이를 계산하여 상태에 저장 (첫 번째 컬럼 제외)
      const computedWidths = Array.from(headerCells).slice(1).map((cell) => {
        const cellElement = cell as HTMLElement;
        return cellElement.getBoundingClientRect().width; // 열의 가로 길이
      });

      // 첫 번째 빈 열을 0으로 추가
      computedWidths.unshift(0);

      setColumnWidths(computedWidths); // 버튼의 너비를 열 너비와 동기화
    }
  }, [data]);

  // 동적 열 너비 계산 함수
  const useDynamicColumnWidths = (
    spreadsheetRef: React.RefObject<HTMLDivElement>,
    setColumnWidths: (widths: number[]) => void
  ) => {
    useEffect(() => {
      if (!spreadsheetRef.current) return;

      const observer = new MutationObserver(() => {
        if (spreadsheetRef.current) {
          const headerCells = spreadsheetRef.current.querySelectorAll("th.Spreadsheet__header");
          const rows = spreadsheetRef.current.querySelectorAll("tr");
          const columnWidths: number[] = [];

          if (rows) {
            // 각 열의 최대 너비 계산 (첫 번째 컬럼 제외)
            rows.forEach((row) => {
              const cells = row.querySelectorAll("th, td");
              cells.forEach((cell, index) => {
                if (index === 0) return; // 첫 번째 컬럼은 건너뛰기
                const cellWidth = cell.getBoundingClientRect().width;
                columnWidths[index - 1] = Math.max(columnWidths[index - 1] || 0, cellWidth);
              });
            });
          }

          // 헤더 셀과 데이터 셀의 최대 너비 비교 (첫 번째 컬럼 제외)
          Array.from(headerCells).slice(1).forEach((headerCell, index) => {
            const headerWidth = headerCell.getBoundingClientRect().width;
            columnWidths[index] = Math.max(columnWidths[index] || 0, headerWidth);
          });

          // 첫 번째 빈 열을 0으로 추가
          columnWidths.unshift(0);

          setColumnWidths(columnWidths); // 최종 계산된 열 너비 설정
        }
      });

      observer.observe(spreadsheetRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }, [spreadsheetRef, setColumnWidths]);
  };

  // 열 길이 자동 업데이트
  useDynamicColumnWidths(spreadsheetRef, setColumnWidths);


  // 서버에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/crawling3");
        const result = await response.json();
        console.log(`서버와 연결`);
        // 가져온 데이터를 Spreadsheet에 맞는 형식으로 변환
        const formattedData = result.map((row: { [s: string]: unknown; } | ArrayLike<unknown>) =>
          Object.values(row).map((value) => ({ value }))
        );

        // 상태에 설정
        setData(formattedData);
        console.log(`data : ${data}`);

        // 열 너비 초기화
        if (formattedData.length > 0) {
          const columnCount = formattedData[0].length;
          setColumnWidths(new Array(columnCount).fill(100)); // 기본 열 너비
          setSortState(new Array(columnCount).fill(0)); // 초기 정렬 상태
        }
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };

    fetchData();
  }, []);

  // 서버에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/crawling3");
        const result = await response.json();
        console.log(`서버와 연결`);

        // 숫자 등장 횟수 계산
        const frequency: { [key: number]: number } = {};
        result.forEach((item: any) => {
          Object.values(item).forEach((number) => {
            if (typeof number === "number") {
              frequency[number] = (frequency[number] || 0) + 1;
            }
          });
        });
        setNumberFrequency(frequency);
        console.log("Frequency:", frequency);

      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };

    fetchData();
  }, []);



  const getBackgroundColor = (number: number): string => {
    const frequency = numberFrequency[number] || 0;
  
    // 투명도 계산: 등장 횟수에 따라 투명도 설정 (1은 가장 옅음, 0은 완전 불투명)
    const alpha = Math.min(1, frequency / 100); // 등장 횟수에 비례하여 0~1 사이의 값으로 설정
    const red = 255;
  
    return `rgba(${red}, 0, 0, ${alpha})`; // 빨간색 배경과 투명도 조절
  };
  


  return (

    <>

      <div>
        <span id="1" style={{ backgroundColor: getBackgroundColor(1) }}>1</span>
        <span id="2" style={{ backgroundColor: getBackgroundColor(2) }}>2</span>
        <span id="3" style={{ backgroundColor: getBackgroundColor(3) }}>3</span>
        <span id="4" style={{ backgroundColor: getBackgroundColor(4) }}>4</span>
        <span id="5" style={{ backgroundColor: getBackgroundColor(5) }}>5</span>
        <span id="6" style={{ backgroundColor: getBackgroundColor(6) }}>6</span>
        <span id="7" style={{ backgroundColor: getBackgroundColor(7) }}>7</span>
        <span id="8" style={{ backgroundColor: getBackgroundColor(8) }}>8</span>
        <span id="9" style={{ backgroundColor: getBackgroundColor(9) }}>9</span>
        <span id="10" style={{ backgroundColor: getBackgroundColor(10) }}>10</span>
        <span id="11" style={{ backgroundColor: getBackgroundColor(11) }}>11</span>
        <span id="12" style={{ backgroundColor: getBackgroundColor(12) }}>12</span>
        <span id="13" style={{ backgroundColor: getBackgroundColor(13) }}>13</span>
        <span id="14" style={{ backgroundColor: getBackgroundColor(14) }}>14</span>
        <span id="15" style={{ backgroundColor: getBackgroundColor(15) }}>15</span>
        <span id="16" style={{ backgroundColor: getBackgroundColor(16) }}>16</span>
        <span id="17" style={{ backgroundColor: getBackgroundColor(17) }}>17</span>
        <span id="18" style={{ backgroundColor: getBackgroundColor(18) }}>18</span>
        <span id="19" style={{ backgroundColor: getBackgroundColor(19) }}>19</span>
        <span id="20" style={{ backgroundColor: getBackgroundColor(20) }}>20</span>
        <span id="21" style={{ backgroundColor: getBackgroundColor(21) }}>21</span>
        <span id="22" style={{ backgroundColor: getBackgroundColor(22) }}>22</span>
        <span id="23" style={{ backgroundColor: getBackgroundColor(23) }}>23</span>
        <span id="24" style={{ backgroundColor: getBackgroundColor(24) }}>24</span>
        <span id="25" style={{ backgroundColor: getBackgroundColor(25) }}>25</span>
        <span id="26" style={{ backgroundColor: getBackgroundColor(26) }}>26</span>
        <span id="27" style={{ backgroundColor: getBackgroundColor(27) }}>27</span>
        <span id="28" style={{ backgroundColor: getBackgroundColor(28) }}>28</span>
        <span id="29" style={{ backgroundColor: getBackgroundColor(29) }}>29</span>
        <span id="30" style={{ backgroundColor: getBackgroundColor(30) }}>30</span>
        <span id="31" style={{ backgroundColor: getBackgroundColor(31) }}>31</span>
        <span id="32" style={{ backgroundColor: getBackgroundColor(32) }}>32</span>
        <span id="33" style={{ backgroundColor: getBackgroundColor(33) }}>33</span>
        <span id="34" style={{ backgroundColor: getBackgroundColor(34) }}>34</span>
        <span id="35" style={{ backgroundColor: getBackgroundColor(35) }}>35</span>
        <span id="36" style={{ backgroundColor: getBackgroundColor(36) }}>36</span>
        <span id="37" style={{ backgroundColor: getBackgroundColor(37) }}>37</span>
        <span id="38" style={{ backgroundColor: getBackgroundColor(38) }}>38</span>
        <span id="39" style={{ backgroundColor: getBackgroundColor(39) }}>39</span>
        <span id="40" style={{ backgroundColor: getBackgroundColor(40) }}>40</span>
        <span id="41" style={{ backgroundColor: getBackgroundColor(41) }}>41</span>
        <span id="42" style={{ backgroundColor: getBackgroundColor(42) }}>42</span>
        <span id="43" style={{ backgroundColor: getBackgroundColor(43) }}>43</span>
        <span id="44" style={{ backgroundColor: getBackgroundColor(44) }}>44</span>
        <span id="45" style={{ backgroundColor: getBackgroundColor(45) }}>45</span>
      </div>

    </>
  );
}

// <div style={{ padding: "20px" }}>
// <h1>Excel Test</h1>
// <input type="file" onChange={handleFileUpload} />

// {/* Spreadsheet 컴포넌트 */}
// <div ref={spreadsheetRef} style={{ position: "relative", marginBottom: "10px" }}>
//   <div style={{ display: "flex", zIndex: 1, background: "#fff", marginBottom: "10px", }} >

//     <button disabled
//       style={{
//         width: `${columnWidths[0] || 100}px`, // 첫 번째 빈 열의 너비
//         cursor: "not-allowed", height: "30px", backgroundColor: "#e0e0e0", textAlign: "center", border: "1px solid #ccc",
//       }}></button>
//     {data[0]?.map((_, columnIndex) => (
//       <button
//         key={columnIndex}
//         onClick={() => handleSortColumn(columnIndex)}
//         style={{
//           width: `${columnWidths[columnIndex + 1] || 100}px`, // 열 너비 동기화
//           cursor: "pointer",
//           height: "30px",
//           backgroundColor: getButtonBackgroundColor(sortState[columnIndex] || 0),
//           textAlign: "center",
//           border: "1px solid #ccc",
//         }}
//       >
//         {getColumnName(columnIndex)} {sortState[columnIndex] === 1 ? "▲" : sortState[columnIndex] === -1 ? "▼" : ""}
//       </button>
//     ))}
//   </div>

//   {/* 스프레드시트 */}
//   <Spreadsheet data={data} onChange={handleSpreadsheetChange} />
// </div>
// </div>
// import { useEffect } from 'react';

// export default function HomePage() {
//   useEffect(() => {
//     const loadNaverMapScript = () => {
//       return new Promise((resolve, reject) => {
//         if (typeof window !== 'undefined' && document.getElementById('naver-map-script')) {
//           resolve(true); // 이미 스크립트가 로드된 경우
//           return;
//         }

//         const script = document.createElement('script');
//         script.id = '6y4xqsk7ig';
//         script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=6y4xqsk7ig`; // Replace YOUR_CLIENT_ID with your actual client ID
//         script.async = true;
//         script.onload = () => resolve(true);
//         script.onerror = () => reject(new Error('Naver Map Script Load Error'));
//         document.head.appendChild(script);
//       });
//     };

//     const initializeMap = () => {
//       const center = new naver.maps.LatLng(37.3595704, 127.105399);

//       const map = new naver.maps.Map('map', {
//         center: center,
//         zoom: 16,
//       });
//     };

//     const setupMap = async () => {
//       try {
//         await loadNaverMapScript();
//         if (typeof naver !== 'undefined' && naver.maps) {
//           initializeMap();
//         }
//       } catch (error) {
//         console.error(error);
//       }
//     };

//     setupMap();
//   }, []);

//   return (
//     <div>
//       <h1>homepage map</h1>
//       <div id="map" style={{ width: '100%', height: '400px' }}></div>
//     </div>
//   );
// }


