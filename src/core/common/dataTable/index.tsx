"use client";

// index.tsx
import React, { useEffect, useState } from "react";
import { Select, Table } from "antd";
import type { DatatableProps } from "../../data/interface";

const { Option } = Select;

const Datatable: React.FC<DatatableProps> = ({
  columns,
  dataSource,
  Selection,
  searchText,
  onRowClick,
  total: serverTotal,
  currentPage,
  pageSize: serverPageSize,
  onPaginationChange,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [Selections, setSelections] = useState<any>(true);
  const [filteredDataSource, setFilteredDataSource] = useState(dataSource);
  const [pageSize, setPageSize] = useState(serverPageSize ?? 10);
  const isServerPagination = serverTotal !== undefined && onPaginationChange;

  useEffect(() => {
    setSelections(Selection);
  }, [Selection]);

  useEffect(() => {
    if (isServerPagination) {
      setFilteredDataSource(dataSource);
    } else {
      const filteredData = dataSource.filter((record) =>
        Object.values(record).some((field) =>
          String(field).toLowerCase().includes(searchText.toLowerCase())
        )
      );
      setFilteredDataSource(filteredData);
    }
  }, [searchText, dataSource, isServerPagination]);

  const onSelectChange = (newSelectedRowKeys: any[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const getRowKey = (record: any) => {
    if (record?.id !== undefined) return record.id;
    if (record?.key !== undefined) return record.key;
    // Generate a unique key from record values
    const values = Object.values(record || {}).join('-');
    return `row-${values}`;
  };

  return (
    <Table
      className="table table-nowrap datatable"
      rowSelection={Selections ? rowSelection : undefined}
      columns={columns}
      rowHoverable={false}
      dataSource={filteredDataSource}
      rowKey={getRowKey}
      onRow={(record) => ({
        onClick: () => {
          if (onRowClick) {
            onRowClick(record);
          }
        },
        style: { cursor: onRowClick ? 'pointer' : 'default' },
      })}
      pagination={
        isServerPagination
          ? {
              current: currentPage ?? 1,
              pageSize: serverPageSize ?? 10,
              total: serverTotal ?? 0,
              showSizeChanger: false,
              pageSizeOptions: ["10", "20", "30"],
              onChange: (page, size) => onPaginationChange?.(page, size ?? 10),
              showTotal: (total) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Rows per page:
                  <Select
                    value={serverPageSize ?? 10}
                    onChange={(value) => onPaginationChange?.(currentPage ?? 1, value)}
                    style={{ width: 80 }}
                    popupMatchSelectWidth={false}
                  >
                    <Option value={10}>10</Option>
                    <Option value={20}>20</Option>
                    <Option value={30}>30</Option>
                  </Select>
                  of {total} Entries
                </div>
              ),
              nextIcon: <i className="ti ti-chevron-right" />,
              prevIcon: <i className="ti ti-chevron-left" />,
            }
          : {
              showSizeChanger: false,
              pageSize,
              onShowSizeChange: (size) => setPageSize(size),
              total: filteredDataSource.length,
              showTotal: (total) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Rows per page:
                  <Select
                    value={pageSize}
                    onChange={(value) => setPageSize(value)}
                    style={{ width: 80 }}
                    popupMatchSelectWidth={false}
                  >
                    <Option value={10}>10</Option>
                    <Option value={20}>20</Option>
                    <Option value={30}>30</Option>
                  </Select>
                  of {total} Entries
                </div>
              ),
              nextIcon: <i className="ti ti-chevron-right" />,
              prevIcon: <i className="ti ti-chevron-left" />,
            }
      }
    />
  );
};

export default Datatable;
