import * as React from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import { HttpManager } from './api';
import { useEffect, useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Typography } from '@mui/material';
import { generateSalaryPdf, SalaryRecord } from './component/utils/GenerateSalary'

interface Row {
  employeeId: number;
  name: string;
  mail: string;
  code: number;
  duty: string;
}

interface ResponseBody {
  code: string;
  success: boolean;
  message: string;
  type: string;
  data?: any;
}

const columns: GridColDef[] = [
  { field: 'employeeId', headerName: 'ID',type: 'number', width: 70 },
  { field: 'name', headerName: 'Name', width: 130 },
  { field: 'mail', headerName: 'Mail', width: 130 },
  { field: 'employeeCode', headerName: 'Employee Code', width: 130 },
  { field: 'duty', headerName: 'Duty', width: 130 },
];
interface SalaryState {
  id?: number;
  year?: number;
  month?: number;
  paymentDate?: string; // 格式: YYYY-MM-DD
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
  };
}
export default function DataTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowId[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openSalaryDialog, setOpenSalaryDialog] = useState<boolean>(false);
  const [openInputDialog, setOpenInputDialog] = useState<boolean>(false);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [newEmployee, setNewEmployee] = useState<Partial<Row>>({ employeeId: 0, name: '', mail: '', duty: "", code: 0 });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newSalary, setNewSalary] = useState<SalaryState>({
    employee: { employeeId: 0 },
    year: undefined,
    month: undefined,
    paymentDate: '',
    baseSalary: undefined,
    overtimeAllowance: undefined,
    commutingAllowance: undefined,
    healthInsurance: undefined,
    pension: undefined,
    employmentInsurance: undefined,
    incomeTax: undefined,
    residentTax: undefined
  });
  const handleSelectionChange = (newSelection: GridRowId[]) => {
    setSelectedRowIds(newSelection);
  };

  useEffect(() => {
    fetchEmployees();
    handleSearchChange({
      target: {
        value: searchQuery
      }
    } as React.ChangeEvent<HTMLInputElement>);
  }, []);
  
  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value;
  
    setSearchQuery(searchValue);
  
    try {
      const result = await HttpManager.searchContact(searchValue) as ResponseBody;
      const filteredRowsWithIds = result.data.map((row: Row) => ({ ...row, id: row.employeeId }));
      setRows(filteredRowsWithIds);
      console.log(filteredRowsWithIds)
    } catch (error) {
      console.error('Error fetching filtered employees:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const result = await HttpManager.getAllEmployee() as ResponseBody;
      const rowsWithIds = result.data.map((row: Row) => ({ ...row, id: row.employeeId }));
      setRows(rowsWithIds);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleDelete = async () => {
    if (selectedRowIds.length === 0) {
      console.log("No rows selected for deletion");
      return;
    }

    try {
      for (const id of selectedRowIds) {
        await HttpManager.deleteEmployee(id as number)
        console.log(`Employee with ID ${id} deleted successfully`);
      }

      fetchEmployees();
      setSelectedRowIds([]);
    } catch (error) {
      console.error('Error deleting employees:', error);
    }
  };

  const handleAddEmployee = async () => {
    const params = {
      id: newEmployee.employeeId,
      name: newEmployee.name,
      code: newEmployee.code,
      duty: newEmployee.duty,
      mail: newEmployee.mail
    }

    HttpManager.addEmployee(params)
      .then(response => {
        console.log('employee added successfully:', response);
        window.location.reload();
      })
      .catch(error => {
        console.error('Error adding employee:', error);
      });

    setOpenDialog(false);
  };

  // 新增生成PDF的功能
  const handleGeneratePdf = async () => {
    if (!year || !month) {
      alert('请输入年份和月份');
      return;
    }
  
    setOpenInputDialog(false);
    
    try {
      const result = await HttpManager.searchSalaryByYearAndMonth(parseInt(year), parseInt(month)) as ResponseBody;
      
      if (Number(result.code) === 200 && result.data && result.data.length > 0) {
        console.log(result.data);
        
        // Process PDFs sequentially to avoid conflicts
        for (const salary of result.data) {
          try {
            await generateSalaryPdf(salary as SalaryRecord);
            // Add small delay between each PDF generation
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`生成 ${salary.employee.name} 的薪资单失败:`, error);
            alert(`${salary.employee.name} 的薪资单生成失败，请查看控制台`);
          }
        }
        
        alert('薪资单生成完成！');
      } else {
        alert('未找到该月份的薪资数据');
      }
    } catch (error) {
      console.error('获取薪资数据失败:', error);
      alert('获取薪资数据时出错');
    }
  };
  
  

  const filteredRows = rows.filter(row =>
    row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.mail.toLowerCase().includes(searchQuery.toLowerCase()) 
  );

  const handleAddSalary = async () => {
    // 构建符合API要求的参数对象
    const params = {
      employeeId: newSalary.employee?.employeeId || 0,
      year: newSalary.year || 0,
      month: newSalary.month || 0,
      paymentDate: newSalary.paymentDate || null,
      baseSalary: newSalary.baseSalary || 0,
      overtimeAllowance: newSalary.overtimeAllowance || 0,
      commutingAllowance: newSalary.commutingAllowance || 0,
      healthInsurance: newSalary.healthInsurance || 0,
      pension: newSalary.pension || 0,
      employmentInsurance: newSalary.employmentInsurance || 0,
      incomeTax: newSalary.incomeTax || 0,
      residentTax: newSalary.residentTax || 0
    };
  

    // 调用HttpManager添加薪资记录
    HttpManager.addSalary(params)
      .then(response => {
        console.log('Salary added successfully:', response);
        // 重新加载页面或刷新数据
        window.location.reload();
      })
      .catch(error => {
        console.error('Error adding salary:', error);
        // 可以在这里添加错误提示
        alert(`添加工资记录失败: ${error.message}`);
      });
  
    // 关闭对话框
    setOpenSalaryDialog(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>Add Employee</Button>

        <TextField
          variant="outlined"
          label="Search"
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ marginLeft: '1rem' }}
        />
        <Button variant="contained" color="primary" onClick={() => setOpenSalaryDialog(true)}>Add Salary</Button>

        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => setOpenInputDialog(true)}  // 添加生成 PDF 的按钮事件
          style={{ marginLeft: '1rem' }}
        >
          Generate PDF
        </Button>
      </div>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSizeOptions={[5, 10]}
          checkboxSelection
          rowSelectionModel={selectedRowIds}
          onRowSelectionModelChange={handleSelectionChange}
        />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <Button variant="contained" color="secondary" onClick={handleDelete}>Delete Selected</Button>
      </div>

      

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="id"
            label="ID"
            type="text"
            fullWidth
            value={newEmployee.employeeId}
            onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: Number(e.target.value) })}
          />
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            type="text"
            fullWidth
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
          />
          <TextField
            margin="dense"
            id="mail"
            label="Mail"
            type="email"
            fullWidth
            value={newEmployee.mail}
            onChange={(e) => setNewEmployee({ ...newEmployee, mail: e.target.value })}
          />
          <TextField
            margin="dense"
            id="code"
            label="Employee Code"
            type="number"
            fullWidth
            value={newEmployee.code}
            onChange={(e) => setNewEmployee({ ...newEmployee, code: Number(e.target.value )})}
          />
          <TextField
            margin="dense"
            id="duties"
            label="Duties"
            type="text"
            fullWidth
            value={newEmployee.duty}
            onChange={(e) => setNewEmployee({ ...newEmployee, duty: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddEmployee} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSalaryDialog} onClose={() => setOpenSalaryDialog(false)}>
        <DialogTitle>Add Salary Record</DialogTitle>
        <DialogContent>
          {/* 员工ID */}
          <TextField
            autoFocus
            margin="dense"
            id="employee-id"
            label="Employee ID"
            type="number"
            fullWidth
            value={newSalary.employee?.employeeId || ''}
            onChange={(e) => setNewSalary({
              ...newSalary,
              employee: { ...newSalary.employee, employeeId: Number(e.target.value) }
            })}
          />
          
          {/* 年份 */}
          <TextField
            margin="dense"
            id="year"
            label="Year"
            type="number"
            fullWidth
            value={newSalary.year || ''}
            onChange={(e) => setNewSalary({ ...newSalary, year: Number(e.target.value) })}
            inputProps={{ min: 2000, max: 2100 }}
          />
          
          {/* 月份 */}
          <TextField
            margin="dense"
            id="month"
            label="Month"
            type="number"
            fullWidth
            value={newSalary.month || ''}
            onChange={(e) => setNewSalary({ ...newSalary, month: Number(e.target.value) })}
            inputProps={{ min: 1, max: 12 }}
          />
          
          {/* 支付日期 - 使用日期选择器更合适 */}
          <TextField
            margin="dense"
            id="payment-date"
            label="Payment Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newSalary.paymentDate || ''}
            onChange={(e) => setNewSalary({ ...newSalary, paymentDate: e.target.value })}
          />
          
          {/* 基本工资 */}
          <TextField
            margin="dense"
            id="base-salary"
            label="Base Salary (¥)"
            type="number"
            fullWidth
            value={newSalary.baseSalary || ''}
            onChange={(e) => setNewSalary({ ...newSalary, baseSalary: Number(e.target.value) })}
            inputProps={{ step: "0.01" }}
          />
          
          {/* 津贴部分 */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                id="overtime-allowance"
                label="Overtime Allowance (¥)"
                type="number"
                fullWidth
                value={newSalary.overtimeAllowance || ''}
                onChange={(e) => setNewSalary({ ...newSalary, overtimeAllowance: Number(e.target.value) })}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                id="commuting-allowance"
                label="Commuting Allowance (¥)"
                type="number"
                fullWidth
                value={newSalary.commutingAllowance || ''}
                onChange={(e) => setNewSalary({ ...newSalary, commutingAllowance: Number(e.target.value) })}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
          </Grid>
          
          {/* 扣款部分 */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Deductions</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                margin="dense"
                id="health-insurance"
                label="Health Insurance (¥)"
                type="number"
                fullWidth
                value={newSalary.healthInsurance || ''}
                onChange={(e) => setNewSalary({ ...newSalary, healthInsurance: Number(e.target.value) })}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                margin="dense"
                id="pension"
                label="Pension (¥)"
                type="number"
                fullWidth
                value={newSalary.pension || ''}
                onChange={(e) => setNewSalary({ ...newSalary, pension: Number(e.target.value) })}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                margin="dense"
                id="employment-insurance"
                label="Employment Insurance (¥)"
                type="number"
                fullWidth
                value={newSalary.employmentInsurance || ''}
                onChange={(e) => setNewSalary({ ...newSalary, employmentInsurance: Number(e.target.value) })}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
          </Grid>
          
          {/* 税款部分 */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                id="income-tax"
                label="Income Tax (¥)"
                type="number"
                fullWidth
                value={newSalary.incomeTax || ''}
                onChange={(e) => setNewSalary({ ...newSalary, incomeTax: Number(e.target.value) })}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                id="resident-tax"
                label="Resident Tax (¥)"
                type="number"
                fullWidth
                value={newSalary.residentTax || ''}
                onChange={(e) => setNewSalary({ ...newSalary, residentTax: Number(e.target.value) })}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenSalaryDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddSalary} color="primary">
            Add Salary
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openInputDialog} 
        onClose={() => setOpenInputDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>生成薪资报告</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="year"
            label="年份"
            type="number"
            fullWidth
            variant="standard"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            inputProps={{ 
              min: 1900, 
              max: 2100,
              step: 1
            }}
            helperText="请输入4位年份 (如: 2023)"
          />
          <TextField
            margin="dense"
            id="month"
            label="月份"
            type="number"
            fullWidth
            variant="standard"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            inputProps={{ 
              min: 1, 
              max: 12,
              step: 1
            }}
            helperText="请输入月份 (1-12)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInputDialog(false)} color="primary">
            取消
          </Button>
          <Button onClick={handleGeneratePdf} color="primary" variant="contained">
            生成报告
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
