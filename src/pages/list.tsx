import React, { useState, useEffect } from "react";

// 데이터 타입 정의
interface Data {
  column1: string;
  column2: string;
  main1: number;
  main2: number;
  main3: number;
  main4: number;
  main5: number;
  main6: number;
  bonus: number;
}

export default function List(): JSX.Element {
  const [data, setData] = useState<Data[]>([]); // 서버에서 가져온 전체 데이터
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]); // 선택된 행 인덱스
  const [isDragging, setIsDragging] = useState<boolean>(false); // 드래그 상태

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/crawling3");
        const result: Data[] = await response.json();

        setData(result);
        console.log("Fetched Data:", result);
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };

    fetchData();
  }, []);

  // 각 번호의 스타일을 반환하는 함수
  const getCellStyle = (key: string): React.CSSProperties => {
    const colorMapping: Record<string, string> = {
      main1: "red", // main1
      main2: "orange", // main2
      main3: "yellow", // main3
      main4: "green", // main4
      main5: "blue", // main5
      main6: "indigo", // main6
      bonus: "violet", // bonus
    };

    return {
      backgroundColor: colorMapping[key] || "transparent",
      color: colorMapping[key] ? "white" : "black",
    };
  };

  // 행을 클릭하거나 드래그로 선택하는 함수
  const handleRowSelection = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleMouseDown = (index: number) => {
    setIsDragging(true);
    handleRowSelection(index);
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging) {
      handleRowSelection(index);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      style={{ padding: "20px" }}
      onMouseUp={handleMouseUp} // 드래그 끝
    >
      <h1>Data</h1>
      {data.length > 0 ? (
        <table
          border={1}
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center",
            fontSize: "0.8em",
          }}
        >
          {/* 테이블 헤더 */}
          <thead>
            <tr>
              <th style={{ width: "60px" }}>회차(날짜)</th>
              {[...Array(45)].map((_, i) => (
                <th style={{ width: "22px" }} key={i + 1} id={`th${i + 1}`}>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          {/* 테이블 본문 */}
          <tbody>
            {data.map((row, index) => {
              const isSelected = selectedIndices.includes(index); // 현재 행이 선택되었는지 확인

              return (
                <tr
                  key={index}
                  onMouseDown={() => handleMouseDown(index)} // 드래그 시작
                  onMouseEnter={() => handleMouseEnter(index)} // 드래그 중
                >
                  {/* Column1과 Column2 데이터 표시 */}
                  <td>{row.column1} ({row.column2})</td>
                  {/* 1부터 45까지의 열 생성 */}
                  {[...Array(45)].map((_, i) => {
                    const cellKey =
                      row.main1 === i + 1
                        ? "main1"
                        : row.main2 === i + 1
                        ? "main2"
                        : row.main3 === i + 1
                        ? "main3"
                        : row.main4 === i + 1
                        ? "main4"
                        : row.main5 === i + 1
                        ? "main5"
                        : row.main6 === i + 1
                        ? "main6"
                        : row.bonus === i + 1
                        ? "bonus"
                        : "";

                    return (
                      <td
                        key={i + 1}
                        style={
                          isSelected && cellKey
                            ? getCellStyle(cellKey)
                            : undefined
                        }
                      ></td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
}
