import { describe, it, expect } from "vitest";

import { parseXmlRootElements, getMessagesFromXml } from "../utils/xml-parser";

const MINIMAL_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
</bpmn:definitions>`;

const BPMN_WITH_MESSAGES = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmn:message id="Message_1" name="OrderReceived" />
  <bpmn:message id="Message_2" name="ModelRef" camunda:modelRefCode="REF_001" />
  <bpmn:message id="Message_3" name="PaymentDone" />
</bpmn:definitions>`;

const EMPTY_DEFINITIONS = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
</bpmn:definitions>`;

describe("xml-parser", () => {
  describe("parseXmlRootElements", () => {
    it("returns rootElements from valid BPMN XML", async () => {
      const rootElements = await parseXmlRootElements(MINIMAL_BPMN);
      expect(rootElements).toBeInstanceOf(Array);
      expect(rootElements.length).toBeGreaterThan(0);
      const process = rootElements.find((e: { $type: string; id?: string }) => e.$type === "bpmn:Process");
      expect(process).toBeDefined();
      expect(process!.id).toBe("Process_1");
    });

    it("returns empty array for empty definitions", async () => {
      const rootElements = await parseXmlRootElements(EMPTY_DEFINITIONS);
      expect(rootElements).toEqual([]);
    });

    it("returns multiple root elements including messages", async () => {
      const rootElements = await parseXmlRootElements(BPMN_WITH_MESSAGES);
      expect(rootElements.length).toBeGreaterThanOrEqual(4); // 1 process + 3 messages
      const messages = rootElements.filter((e: { $type: string }) => e.$type === "bpmn:Message");
      expect(messages).toHaveLength(3);
    });
  });

  describe("getMessagesFromXml", () => {
    it("returns only bpmn:Message elements without camunda:modelRefCode", async () => {
      const messages = await getMessagesFromXml(BPMN_WITH_MESSAGES);
      expect(messages).toHaveLength(2);
      expect(messages.every((m: { $type: string }) => m.$type === "bpmn:Message")).toBe(true);
      const names = messages.map((m: { name?: string }) => m.name);
      expect(names).toContain("OrderReceived");
      expect(names).toContain("PaymentDone");
      expect(names).not.toContain("ModelRef");
    });

    it("returns empty array when no messages", async () => {
      const messages = await getMessagesFromXml(MINIMAL_BPMN);
      expect(messages).toEqual([]);
    });
  });
});
