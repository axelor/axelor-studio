export interface WkfModelData {
  id: number;
  version: number;
  name: string;
  code: string;
  statusSelect: number;
  diagramXml: string;
  wkfProcessList: Array<{ id: number; name: string; processId: string }>;
}

export function createWkfModel(overrides: Partial<WkfModelData> = {}): WkfModelData {
  return {
    id: 1,
    version: 0,
    name: 'Sample Process',
    code: 'sample-process',
    statusSelect: 1,
    diagramXml: '',
    wkfProcessList: [{ id: 1, name: 'Process_1', processId: 'Process_1' }],
    ...overrides,
  };
}
