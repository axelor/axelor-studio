/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionLine;
import com.axelor.studio.db.WsConnector;
import com.axelor.studio.db.WsKeyValue;
import com.axelor.studio.db.WsRequestList;
import com.axelor.studio.db.repo.StudioActionRepository;
import com.axelor.utils.junit.BaseTest;
import com.google.inject.Inject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

class ExportServiceImplTest extends BaseTest {

  private static final int DEFAULT_INDENT = 1;

  protected final ExportService service;

  @Inject
  ExportServiceImplTest(ExportService service) {
    this.service = service;
  }

  // --- exportStudioActionLines tests ---

  @Test
  void exportStudioActionLines_shouldReturnEmptyStringForEmptyList() {
    assertEquals("", service.exportStudioActionLines(Collections.emptyList(), DEFAULT_INDENT));
  }

  @Test
  void exportStudioActionLines_shouldEscapeXmlInValue() {
    StudioActionLine line = createRootLine("target", "source");
    line.setValue("<script> & \"test\"");

    String result = service.exportStudioActionLines(List.of(line), DEFAULT_INDENT);

    assertEquals("&lt;script&gt; &amp; &quot;test&quot;", extractTagContent(result, "value"));
  }

  @Test
  void exportStudioActionLines_shouldEscapeXmlInConditionText() {
    StudioActionLine line = createRootLine("target", "source");
    line.setConditionText("a > 0 && b < 10");

    String result = service.exportStudioActionLines(List.of(line), DEFAULT_INDENT);

    assertEquals("a &gt; 0 &amp;&amp; b &lt; 10", extractTagContent(result, "conditionText"));
  }

  @Test
  void exportStudioActionLines_shouldEscapeXmlInFilter() {
    StudioActionLine line = createRootLine("target", "source");
    line.setFilter("name = \"test\"");

    String result = service.exportStudioActionLines(List.of(line), DEFAULT_INDENT);

    assertEquals("name = &quot;test&quot;", extractTagContent(result, "filter"));
  }

  @Test
  void exportStudioActionLines_shouldEscapeXmlInValidationMsg() {
    StudioActionLine line = createRootLine("target", "source");
    line.setValidationMsg("<b>Error</b>");

    String result = service.exportStudioActionLines(List.of(line), DEFAULT_INDENT);

    assertEquals("&lt;b&gt;Error&lt;/b&gt;", extractTagContent(result, "validationMsg"));
  }

  @Test
  void exportStudioActionLines_shouldHandleNullFields() {
    StudioActionLine line = createRootLine("", "");

    String result = service.exportStudioActionLines(List.of(line), DEFAULT_INDENT);

    assertEquals("", extractTagContent(result, "value"));
    assertEquals("", extractTagContent(result, "conditionText"));
    assertEquals("", extractTagContent(result, "filter"));
    assertEquals("", extractTagContent(result, "validationMsg"));
    assertEquals("", extractTagContent(result, "name"));
    assertEquals("false", extractTagContent(result, "dummy"));
    assertEquals("", extractTagContent(result, "metaJsonField"));
    assertEquals("", extractTagContent(result, "metaField"));
    assertEquals("", extractTagContent(result, "valueJson"));
    assertEquals("", extractTagContent(result, "valueField"));
  }

  @Test
  void exportStudioActionLines_shouldSetTargetAsModelForUpdateType() {
    StudioAction action = new StudioAction();
    action.setTargetModel("com.axelor.Target");
    action.setModel("com.axelor.Source");
    action.setTypeSelect(StudioActionRepository.TYPE_SELECT_UPDATE);

    StudioActionLine line = new StudioActionLine();
    line.setStudioAction(action);
    line.setSubLines(new ArrayList<>());

    String result = service.exportStudioActionLines(List.of(line), DEFAULT_INDENT);

    assertEquals("com.axelor.Source", extractTagContent(result, "target"));
    assertEquals("com.axelor.Source", extractTagContent(result, "source"));
    assertFalse(
        result.contains("<target>com.axelor.Target</target>"),
        "Update type should override target with model, not use targetModel");
  }

  @Test
  void exportStudioActionLines_shouldRecurseIntoSubLines() {
    StudioActionLine grandchild = createRootLine("gcTarget", "gcSource");
    grandchild.setName("grandchildName");

    StudioActionLine child = createRootLine("childTarget", "childSource");
    child.setName("childName");
    child.setSubLines(new ArrayList<>(List.of(grandchild)));

    StudioActionLine parent = createRootLine("parentTarget", "parentSource");
    parent.setName("parentName");
    parent.setSubLines(new ArrayList<>(List.of(child)));

    String result = service.exportStudioActionLines(List.of(parent), DEFAULT_INDENT);

    List<String> names = extractAllTagContents(result, "name");
    assertEquals(3, names.size(), "Should render parent, child, and grandchild names");
    assertEquals("parentName", names.get(0));
    assertEquals("childName", names.get(1));
    assertEquals("grandchildName", names.get(2));

    // Verify nested structure contains child content inside <subLines>
    String outerSubLines = extractTagContent(result, "subLines");
    assertNotNull(outerSubLines, "Parent should have a <subLines> block");
    assertTrue(outerSubLines.contains("<name>childName</name>"));
    assertTrue(outerSubLines.contains("<name>grandchildName</name>"));
  }

  // --- exportWsKeyValueLines tests ---

  @Test
  void exportWsKeyValueLines_shouldReturnEmptyStringForEmptyList() {
    assertEquals(
        "", service.exportWsKeyValueLines(Collections.emptyList(), DEFAULT_INDENT, "payload"));
  }

  @Test
  void exportWsKeyValueLines_shouldEscapeXmlInKeyAndValue() {
    WsKeyValue kv = createWsKeyValue("key<>&\"", "val<>&\"");

    String result = service.exportWsKeyValueLines(List.of(kv), DEFAULT_INDENT, "payload");

    assertEquals("key&lt;&gt;&amp;&quot;", extractTagContent(result, "key"));
    assertEquals("val&lt;&gt;&amp;&quot;", extractTagContent(result, "value"));
  }

  @Test
  void exportWsKeyValueLines_shouldHandleNullKeyAndValue() {
    WsKeyValue kv = createWsKeyValue(null, null);

    String result = service.exportWsKeyValueLines(List.of(kv), DEFAULT_INDENT, "payload");

    assertEquals("", extractTagContent(result, "key"));
    assertEquals("", extractTagContent(result, "value"));
  }

  // --- exportRequests tests ---

  @Test
  void exportRequests_shouldEscapeXmlInNameAndHandleNull() {
    WsRequestList req1 = new WsRequestList();
    req1.setName("req<1>");

    WsRequestList req2 = new WsRequestList();

    String result = service.exportRequests(List.of(req1, req2), DEFAULT_INDENT, "wsRequest");

    List<String> names = extractAllTagContents(result, "name");
    assertEquals(2, names.size());
    assertEquals("req&lt;1&gt;", names.get(0));
    assertEquals("", names.get(1));
  }

  // --- exportConnectors tests ---

  @Test
  void exportConnectors_shouldEscapeXmlInNameAndHandleNull() {
    WsConnector conn1 = new WsConnector();
    conn1.setName("conn<&>\"test\"");

    WsConnector conn2 = new WsConnector();

    String result = service.exportConnectors(List.of(conn1, conn2), DEFAULT_INDENT, "wsConnector");

    List<String> names = extractAllTagContents(result, "name");
    assertEquals(2, names.size());
    assertEquals("conn&lt;&amp;&gt;&quot;test&quot;", names.get(0));
    assertEquals("", names.get(1));
  }

  /** Extracts text content between the first occurrence of {@code <tag>...</tag>}. */
  private static String extractTagContent(String xml, String tag) {
    Pattern pattern = Pattern.compile("<" + tag + ">(.*?)</" + tag + ">", Pattern.DOTALL);
    Matcher matcher = pattern.matcher(xml);
    return matcher.find() ? matcher.group(1) : null;
  }

  /** Extracts text content from every occurrence of {@code <tag>...</tag>}. */
  private static List<String> extractAllTagContents(String xml, String tag) {
    List<String> results = new ArrayList<>();
    Pattern pattern = Pattern.compile("<" + tag + ">(.*?)</" + tag + ">", Pattern.DOTALL);
    Matcher matcher = pattern.matcher(xml);
    while (matcher.find()) {
      results.add(matcher.group(1));
    }
    return results;
  }

  // --- Entity factory helpers (real instances, no mocks) ---

  private StudioActionLine createRootLine(String targetModel, String sourceModel) {
    StudioAction action = new StudioAction();
    action.setTargetModel(targetModel);
    action.setModel(sourceModel);
    action.setTypeSelect(StudioActionRepository.TYPE_SELECT_CREATE);

    StudioActionLine line = new StudioActionLine();
    line.setStudioAction(action);
    line.setSubLines(new ArrayList<>());
    return line;
  }

  private WsKeyValue createWsKeyValue(String key, String value) {
    WsKeyValue kv = new WsKeyValue();
    kv.setWsKey(key);
    kv.setWsValue(value);
    kv.setIsList(false);
    kv.setSubWsKeyValueList(new ArrayList<>());
    return kv;
  }
}
