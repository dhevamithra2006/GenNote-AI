import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  ArrowUpDown,
  Download,
  Plus,
  Trash2,
  Check,
  Edit2
} from 'lucide-react';

interface DataTableViewProps {
  content: any;
  onUpdate?: (newContent: any) => void;
}

export const DataTableView: React.FC<DataTableViewProps> = ({ content, onUpdate }) => {
  const [columns, setColumns] = useState<string[]>(content?.columns || ['Item', 'Category', 'Description', 'Value']);
  const [rows, setRows] = useState<any[][]>(content?.rows || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
  };

  const handleAddRow = () => {
    const newRow = columns.map(() => 'New item');
    const updated = [...rows, newRow];
    setRows(updated);
    if (onUpdate) onUpdate({ ...content, columns, rows: updated });
  };

  const handleDeleteRow = (idx: number) => {
    const updated = rows.filter((_, i) => i !== idx);
    setRows(updated);
    if (onUpdate) onUpdate({ ...content, columns, rows: updated });
  };

  const startEdit = (r: number, c: number, val: any) => {
    setEditingCell({ r, c });
    setEditValue(val ? val.toString() : '');
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const updated = rows.map((row, rIdx) => {
      if (rIdx !== editingCell.r) return row;
      const newRow = [...row];
      newRow[editingCell.c] = editValue;
      return newRow;
    });
    setRows(updated);
    setEditingCell(null);
    if (onUpdate) onUpdate({ ...content, columns, rows: updated });
  };

  const handleExportCSV = () => {
    const header = columns.join(',');
    const body = rows.map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const csv = `${header}\n${body}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synthesized_data_table.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter and Sort
  let displayRows = [...rows];
  if (searchTerm) {
    displayRows = displayRows.filter(r =>
      r.some(cell => (cell || '').toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  if (sortCol !== null) {
    displayRows.sort((a, b) => {
      const valA = (a[sortCol] || '').toString();
      const valB = (b[sortCol] || '').toString();
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter records in table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Interactive Table Grid */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              {columns.map((col, cIdx) => (
                <th
                  key={cIdx}
                  onClick={() => handleSort(cIdx)}
                  className="p-3 font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700/50 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
              ))}
              <th className="p-3 w-10 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-neutral-400">
                  No records matching filter.
                </td>
              </tr>
            ) : (
              displayRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 group">
                  {columns.map((_, cIdx) => {
                    const isEditing = editingCell?.r === rIdx && editingCell?.c === cIdx;
                    const cellVal = row[cIdx] || '';

                    return (
                      <td
                        key={cIdx}
                        onClick={() => !isEditing && startEdit(rIdx, cIdx, cellVal)}
                        className="p-3 text-neutral-800 dark:text-neutral-200 cursor-text"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                              autoFocus
                              className="w-full px-2 py-0.5 text-xs bg-white dark:bg-neutral-800 border border-emerald-500 rounded focus:outline-none"
                            />
                            <button onClick={saveEdit} className="p-0.5 text-emerald-600">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="block">{cellVal}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteRow(rIdx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-opacity"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
