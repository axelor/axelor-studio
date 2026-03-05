/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.axelor.db.JpaRepository;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.repo.MetaActionRepository;
import com.axelor.meta.db.repo.MetaJsonFieldRepository;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.studio.db.repo.StudioActionRepository;
import com.axelor.studio.db.repo.StudioChartRepository;
import com.axelor.studio.db.repo.StudioDashboardRepository;
import com.axelor.studio.db.repo.StudioDashletRepository;
import com.axelor.studio.db.repo.StudioMenuRepository;
import com.axelor.studio.db.repo.StudioSelectionRepository;
import com.axelor.studio.db.repo.WkfDmnModelRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WsAuthenticatorRepository;
import com.axelor.studio.db.repo.WsConnectorRepository;
import com.axelor.studio.db.repo.WsRequestListRepository;
import com.axelor.studio.db.repo.WsRequestRepository;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import javax.xml.parsers.DocumentBuilderFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

class StudioAppUpdateCleanupServiceImplTest {

  private StudioAppUpdateCleanupServiceImpl service;

  @TempDir Path tempDir;

  @BeforeEach
  void setUp() {
    service =
        new StudioAppUpdateCleanupServiceImpl(
            mock(StudioSelectionRepository.class),
            mock(MetaJsonModelRepository.class),
            mock(MetaJsonFieldRepository.class),
            mock(StudioChartRepository.class),
            mock(StudioDashboardRepository.class),
            mock(StudioDashletRepository.class),
            mock(StudioActionRepository.class),
            mock(StudioMenuRepository.class),
            mock(WsRequestRepository.class),
            mock(WsConnectorRepository.class),
            mock(WsAuthenticatorRepository.class),
            mock(WsRequestListRepository.class),
            mock(MetaViewRepository.class),
            mock(MetaActionRepository.class),
            mock(WkfModelRepository.class),
            mock(WkfDmnModelRepository.class),
            mock(StudioAppDetachHelper.class));
  }

  // --- Helper to build DOM elements ---

  private Element createElement(String xml) throws Exception {
    Document doc =
        DocumentBuilderFactory.newInstance()
            .newDocumentBuilder()
            .parse(new java.io.ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
    return doc.getDocumentElement();
  }

  // --- getElementText tests ---

  @Test
  void getElementText_shouldReturnTextWhenPresent() throws Exception {
    Element el = createElement("<root><name>hello</name></root>");

    assertEquals("hello", service.getElementText(el, "name"));
  }

  @Test
  void getElementText_shouldReturnNullWhenTagNotFound() throws Exception {
    Element el = createElement("<root><other>value</other></root>");

    assertNull(service.getElementText(el, "name"));
  }

  @Test
  void getElementText_shouldReturnNullWhenTextIsBlank() throws Exception {
    Element el = createElement("<root><name>   </name></root>");

    assertNull(service.getElementText(el, "name"));
  }

  @Test
  void getElementText_shouldTrimWhitespace() throws Exception {
    Element el = createElement("<root><name>  hello  </name></root>");

    assertEquals("hello", service.getElementText(el, "name"));
  }

  // --- buildJsonFieldKey tests ---

  @Test
  void buildJsonFieldKey_shouldCombineAllParts() throws Exception {
    Element el =
        createElement(
            "<field><name>myField</name><model>com.axelor.MyModel</model>"
                + "<modelField>attrs</modelField><jsonModel>CustomModel</jsonModel></field>");

    assertEquals("myField|com.axelor.MyModel|attrs|CustomModel", service.buildJsonFieldKey(el));
  }

  @Test
  void buildJsonFieldKey_shouldReturnNullWhenNameIsNull() throws Exception {
    Element el = createElement("<field><model>com.axelor.MyModel</model></field>");

    assertNull(service.buildJsonFieldKey(el));
  }

  @Test
  void buildJsonFieldKey_shouldUseEmptyForNullParts() throws Exception {
    Element el = createElement("<field><name>myField</name></field>");

    assertEquals("myField|||", service.buildJsonFieldKey(el));
  }

  // --- buildJsonFieldKeyFromEntity tests ---

  @Test
  void buildJsonFieldKeyFromEntity_shouldCombineAllParts() {
    MetaJsonModel jsonModel = mock(MetaJsonModel.class);
    when(jsonModel.getName()).thenReturn("CustomModel");

    assertEquals(
        "myField|com.axelor.MyModel|attrs|CustomModel",
        service.buildJsonFieldKeyFromEntity("myField", "com.axelor.MyModel", "attrs", jsonModel));
  }

  @Test
  void buildJsonFieldKeyFromEntity_shouldReturnNullWhenNameIsNull() {
    assertNull(service.buildJsonFieldKeyFromEntity(null, "model", "field", null));
  }

  @Test
  void buildJsonFieldKeyFromEntity_shouldHandleNullJsonModel() {
    assertEquals(
        "myField|com.axelor.MyModel|attrs|",
        service.buildJsonFieldKeyFromEntity("myField", "com.axelor.MyModel", "attrs", null));
  }

  // --- buildDashletKey tests ---

  @Test
  void buildDashletKey_shouldCombineNameAndDashboard() throws Exception {
    Element el =
        createElement(
            "<dashlet><name>myDashlet</name>"
                + "<studioDashboard>myDashboard</studioDashboard></dashlet>");

    assertEquals("myDashlet|myDashboard", service.buildDashletKey(el));
  }

  @Test
  void buildDashletKey_shouldReturnNullWhenNameIsNull() throws Exception {
    Element el = createElement("<dashlet><studioDashboard>myDashboard</studioDashboard></dashlet>");

    assertNull(service.buildDashletKey(el));
  }

  // --- extractKeysFromXml tests ---

  @SuppressWarnings("unchecked")
  private StudioAppUpdateCleanupServiceImpl.EntityDescriptor<MetaJsonField>
      createJsonFieldDescriptor() {
    return new StudioAppUpdateCleanupServiceImpl.EntityDescriptor<>(
        "json-field.xml",
        "json-field",
        MetaJsonField.class,
        mock(JpaRepository.class),
        element -> service.getElementText(element, "name"),
        "self.studioApp.id = :appId",
        1L,
        MetaJsonField::getName,
        field -> field.setStudioApp(null));
  }

  @Test
  void extractKeysFromXml_shouldReturnEmptySetWhenFileAbsent() throws IOException {
    File dataDir = tempDir.resolve("absent").toFile();
    dataDir.mkdirs();

    Set<String> keys = service.extractKeysFromXml(dataDir, createJsonFieldDescriptor());

    assertTrue(keys.isEmpty());
  }

  @Test
  void extractKeysFromXml_shouldExtractKeysFromValidXml() throws IOException {
    File dataDir = tempDir.resolve("valid").toFile();
    dataDir.mkdirs();
    Files.writeString(
        new File(dataDir, "json-field.xml").toPath(),
        "<json-fields><json-field><name>field1</name></json-field>"
            + "<json-field><name>field2</name></json-field></json-fields>",
        StandardCharsets.UTF_8);

    Set<String> keys = service.extractKeysFromXml(dataDir, createJsonFieldDescriptor());

    assertEquals(2, keys.size());
    assertTrue(keys.contains("field1"));
    assertTrue(keys.contains("field2"));
  }

  @Test
  void extractKeysFromXml_shouldSkipNullAndEmptyKeys() throws IOException {
    File dataDir = tempDir.resolve("nullkeys").toFile();
    dataDir.mkdirs();
    Files.writeString(
        new File(dataDir, "json-field.xml").toPath(),
        "<json-fields><json-field><name>valid</name></json-field>"
            + "<json-field><name>  </name></json-field>"
            + "<json-field><other>noname</other></json-field></json-fields>",
        StandardCharsets.UTF_8);

    Set<String> keys = service.extractKeysFromXml(dataDir, createJsonFieldDescriptor());

    assertEquals(1, keys.size());
    assertTrue(keys.contains("valid"));
  }

  @Test
  void extractKeysFromXml_shouldRejectXxeDoctype() throws IOException {
    File dataDir = tempDir.resolve("xxe").toFile();
    dataDir.mkdirs();
    Files.writeString(
        new File(dataDir, "json-field.xml").toPath(),
        "<?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>"
            + "<json-fields><json-field><name>&xxe;</name></json-field></json-fields>",
        StandardCharsets.UTF_8);

    assertThrows(
        IOException.class, () -> service.extractKeysFromXml(dataDir, createJsonFieldDescriptor()));
  }
}
