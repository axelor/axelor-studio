import { expectTypeOf, test, describe } from "vitest";

import type {
  AxelorEntity,
  WkfModel,
  MetaModel,
  MetaField,
  ViewElement,
  WkfProcess,
  MetaView,
  MetaJsonModel,
  MetaJsonField,
  MetaSelect,
  MetaSelectItem,
  WkfDmnModel,
  DmnTable,
  DmnField,
  WkfInstance,
  StudioApp,
  AppStudio,
  AppBpm,
  MetaTranslation,
  MetaMenu,
  Template,
  Role,
  MetaAction,
} from "../domain-models";

describe("AxelorEntity base interface", () => {
  test("has required id: number", () => {
    expectTypeOf<AxelorEntity>().toHaveProperty("id");
    expectTypeOf<AxelorEntity["id"]>().toBeNumber();
  });

  test("has optional version?: number", () => {
    expectTypeOf<AxelorEntity>().toHaveProperty("version");
  });
});

describe("WkfModel extends AxelorEntity", () => {
  test("has id from base + own optional fields", () => {
    expectTypeOf<WkfModel>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<WkfModel>().toHaveProperty("id");
    expectTypeOf<WkfModel>().toHaveProperty("name");
    expectTypeOf<WkfModel>().toHaveProperty("diagramXml");
  });
});

describe("MetaModel extends AxelorEntity", () => {
  test("has optional name, fullName, packageName, title", () => {
    expectTypeOf<MetaModel>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaModel>().toHaveProperty("name");
    expectTypeOf<MetaModel>().toHaveProperty("fullName");
    expectTypeOf<MetaModel>().toHaveProperty("packageName");
    expectTypeOf<MetaModel>().toHaveProperty("title");
  });
});

describe("MetaField extends AxelorEntity", () => {
  test("has optional name, type, typeName, label, relationship, target", () => {
    expectTypeOf<MetaField>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaField>().toHaveProperty("name");
    expectTypeOf<MetaField>().toHaveProperty("type");
    expectTypeOf<MetaField>().toHaveProperty("typeName");
    expectTypeOf<MetaField>().toHaveProperty("label");
    expectTypeOf<MetaField>().toHaveProperty("relationship");
    expectTypeOf<MetaField>().toHaveProperty("target");
  });
});

describe("ViewElement is NOT an AxelorEntity", () => {
  test("has recursive items?: ViewElement[] and is not AxelorEntity", () => {
    // ViewElement should NOT be assignable to AxelorEntity (no id field required)
    expectTypeOf<ViewElement>().not.toMatchTypeOf<AxelorEntity>();
    expectTypeOf<ViewElement>().toHaveProperty("items");
    expectTypeOf<ViewElement>().toHaveProperty("toolbar");
    expectTypeOf<ViewElement>().toHaveProperty("menubar");
    expectTypeOf<ViewElement>().toHaveProperty("jsonFields");
  });
});

describe("All domain interfaces are assignable to AxelorEntity", () => {
  test("generic constraint check", () => {
    expectTypeOf<WkfModel>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<WkfProcess>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaModel>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaField>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaView>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaJsonModel>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaJsonField>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaSelect>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaSelectItem>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<WkfDmnModel>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<DmnTable>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<DmnField>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<WkfInstance>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<StudioApp>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<AppStudio>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<AppBpm>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaTranslation>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaMenu>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<Template>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<Role>().toMatchTypeOf<AxelorEntity>();
    expectTypeOf<MetaAction>().toMatchTypeOf<AxelorEntity>();
  });
});
