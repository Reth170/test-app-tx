// src/utils/pdfGenerator.ts
import jsPDF from 'jspdf';

export interface SalaryRecord {
  id?: number;
  year?: number;
  month?: number;
  paymentDate?: string;
  baseSalary?: number;
  overtimeAllowance?: number;
  commutingAllowance?: number;
  healthInsurance?: number;
  pension?: number;
  employmentInsurance?: number;
  incomeTax?: number;
  residentTax?: number;
  employee: {
    employeeId: number;
    name: string;
    employeeCode: number;
  };
}

// 格式化货币金额（添加千位分隔符）
const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return '0';
  return value.toLocaleString('ja-JP');
};

// Convert Japanese text to romaji or use fallback
const getDisplayText = (text: string): string => {
  // Simple mapping for common Japanese terms used in salary slips
  const japaneseToRomaji: { [key: string]: string } = {
    '給与支給明細書': 'Kyuyo Shikyu Meisaisho (Salary Statement)',
    '支給額': 'Shikyugaku (Payment)',
    '控除額': 'Kojogaku (Deduction)',
    '金額': 'Kingaku (Amount)',
    '基本給': 'Kihonkyu (Base Salary)',
    '残業手当': 'Zangyou Teate (Overtime)',
    '通勤手当': 'Tsukkin Teate (Commute)',
    '健康保険': 'Kenkou Hoken (Health Insurance)',
    '厚生年金': 'Kousei Nenkin (Pension)',
    '雇用保険': 'Koyou Hoken (Employment Insurance)',
    '所得税': 'Shotokuzei (Income Tax)',
    '住民税': 'Juminzei (Resident Tax)',
    '計': 'Kei (Total)',
    '差引支給額': 'Sashihiki Shikyugaku (Net Pay)',
    '氏名': 'Shimei (Name)',
    '社員番号': 'Shain Bangou (Employee ID)',
    '支給年月日': 'Shikyu Nengappi (Payment Date)',
    '生成日': 'Seisei-bi (Generated Date)',
    '年': 'nen (Year)',
    '月': 'gatsu (Month)',
    '日': 'nichi (Day)',
    '月分': 'gatsubun (Month Period)'
  };

  return japaneseToRomaji[text] || text;
};

// Compact table drawing function
const drawCompactTable = (
  doc: jsPDF, 
  startX: number, 
  startY: number, 
  headers: string[], 
  rows: string[][], 
  columnWidths: number[]
): number => {
  const rowHeight = 8; // Reduced from 12
  const headerHeight = 10; // Reduced from 14
  let currentY = startY;

  // Draw header background
  doc.setFillColor(220, 220, 220);
  doc.rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), headerHeight, 'F');

  // Draw header borders
  doc.setDrawColor(0, 0, 0);
  doc.rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), headerHeight);

  // Draw header text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8); // Reduced from 10
  let currentX = startX;
  headers.forEach((header, index) => {
    const displayText = getDisplayText(header);
    doc.text(displayText, currentX + 2, currentY + 7); // Reduced padding
    if (index < headers.length - 1) {
      doc.line(currentX + columnWidths[index], currentY, currentX + columnWidths[index], currentY + headerHeight);
    }
    currentX += columnWidths[index];
  });

  currentY += headerHeight;

  // Draw rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7); // Reduced from 9
  rows.forEach((row, rowIndex) => {
    // Draw row background
    doc.setFillColor(255, 255, 255);
    doc.rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    
    // Draw row borders
    doc.rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), rowHeight);

    // Draw row text
    currentX = startX;
    row.forEach((cell, cellIndex) => {
      const displayText = getDisplayText(cell);
      const textX = cellIndex === 1 ? currentX + columnWidths[cellIndex] - 2 : currentX + 2; // Reduced padding
      const align = cellIndex === 1 ? 'right' : 'left';
      doc.text(displayText, textX, currentY + 6, { align: align as any }); // Adjusted vertical position
      
      if (cellIndex < row.length - 1) {
        doc.line(currentX + columnWidths[cellIndex], currentY, currentX + columnWidths[cellIndex], currentY + rowHeight);
      }
      currentX += columnWidths[cellIndex];
    });

    currentY += rowHeight;
  });

  return currentY;
};

export const generateSalaryPdf = (salary: SalaryRecord): void => {
  const doc = new jsPDF();

  // 设置文档属性
  doc.setProperties({
    title: `Salary Statement ${salary.employee.name} ${salary.year}/${salary.month}`,
    subject: 'Salary Statement',
    author: 'Salary System'
  });

  // 添加标题 - more compact
  doc.setFontSize(14); // Reduced from 16
  doc.setFont('helvetica', 'bold');
  const titleText = getDisplayText('給与支給明細書');
  doc.text(titleText, 105, 15, { align: 'center' }); // Moved up from 20

  // 年月信息 - closer to title
  doc.setFontSize(10); // Reduced from 11
  doc.setFont('helvetica', 'normal');
  doc.text(`${salary.year} ${getDisplayText('年')} ${salary.month} ${getDisplayText('月分')}`, 105, 23, { align: 'center' }); // Moved up from 30

  // Employee info and payment date in one line to save space
  doc.setFontSize(9); // Reduced from 11
  const paymentDate = new Date(salary.paymentDate || '');
  const formattedDate = `${paymentDate.getFullYear()}/${paymentDate.getMonth() + 1}/${paymentDate.getDate()}`;
  
  doc.text(`${getDisplayText('氏名')}: ${salary.employee.name}`, 15, 35); // Moved up and left
  doc.text(`${getDisplayText('社員番号')}: ${salary.employee.employeeCode}`, 15, 43); // Moved up
  doc.text(`${getDisplayText('支給年月日')}: ${formattedDate}`, 120, 35); // Same line as name

  // 计算总额
  const totalPay = (salary.baseSalary || 0) +
    (salary.overtimeAllowance || 0) +
    (salary.commutingAllowance || 0);

  const totalDeductions = (salary.healthInsurance || 0) +
    (salary.pension || 0) +
    (salary.employmentInsurance || 0) +
    (salary.incomeTax || 0) +
    (salary.residentTax || 0);

  const netPay = totalPay - totalDeductions;

  // 工资信息表格数据
  const paymentData = [
    ['基本給', `¥${formatCurrency(salary.baseSalary)}`],
    ['残業手当', `¥${formatCurrency(salary.overtimeAllowance)}`],
    ['通勤手当', `¥${formatCurrency(salary.commutingAllowance)}`],
    ['計', `¥${formatCurrency(totalPay)}`]
  ];

  // 扣除信息表格数据
  const deductionData = [
    ['健康保険', `¥${formatCurrency(salary.healthInsurance)}`],
    ['厚生年金', `¥${formatCurrency(salary.pension)}`],
    ['雇用保険', `¥${formatCurrency(salary.employmentInsurance)}`],
    ['所得税', `¥${formatCurrency(salary.incomeTax)}`],
    ['住民税', `¥${formatCurrency(salary.residentTax)}`],
    ['計', `¥${formatCurrency(totalDeductions)}`]
  ];

  // Smaller column widths for compact layout
  const columnWidths = [90, 60]; // Reduced from [120, 80]

  // 添加工资表格 - moved up and made smaller
  const paymentTableEndY = drawCompactTable(
    doc, 
    15, // Moved left from 20
    55, // Moved up from 80
    ['支給額', '金額'], 
    paymentData, 
    columnWidths
  );

  // 添加扣除表格 - closer spacing
  const deductionTableEndY = drawCompactTable(
    doc, 
    15, 
    paymentTableEndY + 8, // Reduced gap from 15
    ['控除額', '金額'], 
    deductionData, 
    columnWidths
  );

  // 添加净工资 - more compact styling
  doc.setFillColor(240, 240, 240);
  doc.rect(15, deductionTableEndY + 8, 150, 15, 'F'); // Smaller box
  doc.setDrawColor(0, 0, 0);
  doc.rect(15, deductionTableEndY + 8, 150, 15);
  
  doc.setFontSize(11); // Reduced from 14
  doc.setFont('helvetica', 'bold');
  doc.text(`${getDisplayText('差引支給額')}: ¥${formatCurrency(netPay)}`, 18, deductionTableEndY + 18); // Adjusted position

  // 添加生成日期 - moved up
  const now = new Date();
  doc.setFontSize(7); // Reduced from 8
  doc.setFont('helvetica', 'normal');
  const generatedText = `${getDisplayText('生成日')}: ${now.toLocaleDateString('ja-JP')} ${now.toLocaleTimeString('ja-JP')}`;
  doc.text(generatedText, 15, deductionTableEndY + 35); // Much higher position

  // 保存文件
  const fileName = `${salary.year}-${salary.month}-${salary.employee.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};