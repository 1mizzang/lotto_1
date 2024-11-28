import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LinearScale,
  PointElement,
  LineElement,
  CategoryScale,
} from "chart.js";


// Chart.js에서 필요한 컴포넌트 등록
ChartJS.register(Title, Tooltip, Legend, LinearScale, PointElement, LineElement, CategoryScale);

export default function HomePage(): JSX.Element {
  const [main1, setMain1] = useState<number[]>([]);
  const [main2, setMain2] = useState<number[]>([]);
  const [main3, setMain3] = useState<number[]>([]);
  const [main4, setMain4] = useState<number[]>([]);
  const [main5, setMain5] = useState<number[]>([]);
  const [main6, setMain6] = useState<number[]>([]);
  const [bonus, setBonus] = useState<number[]>([]);

  // 서버에서 데이터 가져오기 및 변환
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/crawling3");
        const result = await response.json();

        // 데이터 출력 및 상태에 값 할당
        const tempMain1: number[] = [];
        const tempMain2: number[] = [];
        const tempMain3: number[] = [];
        const tempMain4: number[] = [];
        const tempMain5: number[] = [];
        const tempMain6: number[] = [];
        const tempBonus: number[] = [];

        result.forEach((row: any) => {
          if (row.main1) tempMain1.push(row.main1);
          if (row.main2) tempMain2.push(row.main2);
          if (row.main3) tempMain3.push(row.main3);
          if (row.main4) tempMain4.push(row.main4);
          if (row.main5) tempMain5.push(row.main5);
          if (row.main6) tempMain6.push(row.main6);
          if (row.bonus) tempBonus.push(row.bonus);
        });

        setMain1(tempMain1);
        setMain2(tempMain2);
        setMain3(tempMain3);
        setMain4(tempMain4);
        setMain5(tempMain5);
        setMain6(tempMain6);
        setBonus(tempBonus);

        console.log("main1:", tempMain1);
        console.log("main2:", tempMain2);
        console.log("main3:", tempMain3);
        console.log("main4:", tempMain4);
        console.log("main5:", tempMain5);
        console.log("main6:", tempMain6);
        console.log("bonus:", tempBonus);
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };
    fetchData();
  }, []);

  // Chart.js 데이터 구성
  const data = {
    labels: Array.from({ length: main1.length }, (_, i) => i + 1), // X축 레이블
    datasets: [
      {
        label: "main1",
        data: main1,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
      },
      {
        label: "main2",
        data: main2,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: false,
      },
      {
        label: "main3",
        data: main3,
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        fill: false,
      },
      {
        label: "main4",
        data: main4,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: false,
      },
      {
        label: "main5",
        data: main5,
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        fill: false,
      },
      {
        label: "main6",
        data: main6,
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        fill: false,
      },
      {
        label: "bonus",
        data: bonus,
        borderColor: "rgba(100, 149, 237, 1)",
        backgroundColor: "rgba(100, 149, 237, 0.2)",
        fill: false,
      },
    ],
  };

  // Chart.js 옵션 구성
  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Line Chart of main1 to bonus",
      },
    },
    interaction: {
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Index",
        },
      },

    },
  };

  return (
    <div>
      <h1>Line Chart</h1>
      <Line data={data} options={options} />


    </div>
  );
}
