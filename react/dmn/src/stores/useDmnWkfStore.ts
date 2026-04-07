import { createWkfStore } from "@studio/shared/stores";

interface WkfDmnStoreState extends Record<string, unknown> {
  wkfModel: Record<string, unknown> | null;
  id: string | number | null | undefined;
}

const useDmnWkfStore = createWkfStore<WkfDmnStoreState>({
  wkfModel: null,
  id: null,
});

export default useDmnWkfStore;
