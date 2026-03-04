/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.loader;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.axelor.db.JpaSecurity;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaJsonRecordRepository;
import com.axelor.studio.db.repo.AppLoaderRepository;
import com.axelor.utils.helpers.context.FullContext;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class AppLoaderExportServiceImplTest {

  private MetaFiles metaFiles;
  private AppLoaderRepository appLoaderRepository;
  private MetaJsonRecordRepository metaJsonRecordRepository;
  private JpaSecurity jpaSecurity;
  private MetaJsonModelRepository metaJsonModelRepository;
  private AppLoaderExportServiceImpl service;

  @TempDir Path tempDir;

  @BeforeEach
  void setUp() {
    metaFiles = mock(MetaFiles.class);
    appLoaderRepository = mock(AppLoaderRepository.class);
    metaJsonRecordRepository = mock(MetaJsonRecordRepository.class);
    jpaSecurity = mock(JpaSecurity.class);
    metaJsonModelRepository = mock(MetaJsonModelRepository.class);

    service =
        new AppLoaderExportServiceImpl(
            metaFiles,
            appLoaderRepository,
            metaJsonRecordRepository,
            jpaSecurity,
            metaJsonModelRepository);
  }

  // --- createHeader tests ---

  @Test
  void createHeader_shouldReturnOpenFileWriter() throws IOException {
    File dataFile = tempDir.resolve("test.xml").toFile();

    FileWriter writer = service.createHeader("test-model", dataFile);

    writer.write("<test/>");
    writer.close();

    String content = Files.readString(dataFile.toPath(), StandardCharsets.UTF_8);
    assertTrue(content.contains("<test/>"));
  }

  @Test
  void createHeader_shouldWriteXmlDeclaration() throws IOException {
    File dataFile = tempDir.resolve("test.xml").toFile();

    FileWriter writer = service.createHeader("test-model", dataFile);
    writer.close();

    String content = Files.readString(dataFile.toPath(), StandardCharsets.UTF_8);
    assertTrue(content.contains("<?xml version=\"1.0\" encoding=\"utf-8\"?>"));
  }

  @Test
  void createHeader_shouldWriteRootElementWithNamespaces() throws IOException {
    File dataFile = tempDir.resolve("test.xml").toFile();

    FileWriter writer = service.createHeader("test-model", dataFile);
    writer.close();

    String content = Files.readString(dataFile.toPath(), StandardCharsets.UTF_8);
    assertTrue(
        content.contains("<test-models xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\""));
    assertTrue(content.contains("xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">"));
  }

  // --- deleteEmptyFile tests ---

  @Test
  void deleteEmptyFile_shouldDeleteZeroLengthFile() throws IOException {
    File emptyFile = tempDir.resolve("empty.xml").toFile();
    emptyFile.createNewFile();

    service.deleteEmptyFile(emptyFile);

    assertFalse(emptyFile.exists());
  }

  @Test
  void deleteEmptyFile_shouldDeleteSingleLineFile() throws IOException {
    File singleLineFile = tempDir.resolve("single.xml").toFile();
    Files.writeString(singleLineFile.toPath(), "<?xml version=\"1.0\" encoding=\"utf-8\"?>");

    service.deleteEmptyFile(singleLineFile);

    assertFalse(singleLineFile.exists());
  }

  @Test
  void deleteEmptyFile_shouldKeepMultiLineFile() throws IOException {
    File multiLineFile = tempDir.resolve("multi.xml").toFile();
    Files.writeString(multiLineFile.toPath(), "<?xml version=\"1.0\"?>\n<root></root>\n");

    service.deleteEmptyFile(multiLineFile);

    assertTrue(multiLineFile.exists());
  }

  @Test
  void deleteEmptyFile_shouldDeleteFileWithXmlDeclarationAndBlankLines() throws IOException {
    File file = tempDir.resolve("test.xml").toFile();
    Files.writeString(file.toPath(), "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n\n");

    service.deleteEmptyFile(file);

    assertFalse(file.exists());
  }

  // --- extractJsonFieldValue tests ---

  @Test
  void extractJsonFieldValue_shouldReturnStringValue() {
    FullContext record = mock(FullContext.class);
    Map<String, Object> fieldAttrs = new HashMap<>();
    fieldAttrs.put("jsonPath", "myField");
    when(record.get("myField")).thenReturn("hello");

    Object result = service.extractJsonFieldValue(record, fieldAttrs);

    assertEquals("hello", result);
  }

  @Test
  void extractJsonFieldValue_shouldReturnEmptyForNull() {
    FullContext record = mock(FullContext.class);
    Map<String, Object> fieldAttrs = new HashMap<>();
    fieldAttrs.put("jsonPath", "myField");
    when(record.get("myField")).thenReturn(null);

    Object result = service.extractJsonFieldValue(record, fieldAttrs);

    assertEquals("", result);
  }

  @Test
  void extractJsonFieldValue_shouldEscapeXmlChars() {
    FullContext record = mock(FullContext.class);
    Map<String, Object> fieldAttrs = new HashMap<>();
    fieldAttrs.put("jsonPath", "myField");
    when(record.get("myField")).thenReturn("<value>&\"test\"</value>");

    Object result = service.extractJsonFieldValue(record, fieldAttrs);

    String resultStr = result.toString();
    assertFalse(resultStr.contains("<value>"));
    assertTrue(resultStr.contains("&lt;"));
    assertTrue(resultStr.contains("&amp;"));
  }

  @Test
  void extractJsonFieldValue_shouldExtractFromFullContext() {
    FullContext record = mock(FullContext.class);
    FullContext relatedRecord = mock(FullContext.class);
    Map<String, Object> fieldAttrs = new HashMap<>();
    fieldAttrs.put("jsonPath", "myRelation");
    fieldAttrs.put("targetName", "label");
    when(record.get("myRelation")).thenReturn(relatedRecord);
    when(relatedRecord.get("label")).thenReturn("Related Name");

    Object result = service.extractJsonFieldValue(record, fieldAttrs);

    assertEquals("Related Name", result);
  }

  @Test
  @SuppressWarnings("unchecked")
  void extractJsonFieldValue_shouldJoinCollectionWithSemicolon() {
    FullContext record = mock(FullContext.class);
    FullContext item1 = mock(FullContext.class);
    FullContext item2 = mock(FullContext.class);

    Map<String, Object> fieldAttrs = new HashMap<>();
    fieldAttrs.put("jsonPath", "tags");
    fieldAttrs.put("targetName", "name");

    Collection<Object> collection = new ArrayList<>();
    collection.add(item1);
    collection.add(item2);

    when(record.get("tags")).thenReturn(collection);
    when(item1.get("name")).thenReturn("Tag1");
    when(item2.get("name")).thenReturn("Tag2");

    Object result = service.extractJsonFieldValue(record, fieldAttrs);

    assertEquals("Tag1;Tag2", result);
  }

  // --- fixTargetName tests ---

  @Test
  void fixTargetName_shouldSetNameFieldAsTarget() {
    Map<String, Object> jsonFieldMap = new HashMap<>();
    Map<String, Object> fieldAttrs = new HashMap<>();
    fieldAttrs.put("jsonTarget", "CustomModel");
    jsonFieldMap.put("myField", fieldAttrs);

    MetaJsonField nameField = new MetaJsonField();
    nameField.setName("label");

    when(metaJsonModelRepository.findByName("CustomModel")).thenReturn(null);
    when(metaJsonModelRepository.findNameField(null)).thenReturn(nameField);

    service.fixTargetName(jsonFieldMap);

    @SuppressWarnings("unchecked")
    Map<String, Object> result = (Map<String, Object>) jsonFieldMap.get("myField");
    assertEquals("label", result.get("targetName"));
  }

  @Test
  void fixTargetName_shouldDefaultToIdWhenNoNameField() {
    Map<String, Object> jsonFieldMap = new HashMap<>();
    Map<String, Object> fieldAttrs = new HashMap<>();
    fieldAttrs.put("jsonTarget", "CustomModel");
    jsonFieldMap.put("myField", fieldAttrs);

    when(metaJsonModelRepository.findByName("CustomModel")).thenReturn(null);
    when(metaJsonModelRepository.findNameField(any())).thenReturn(null);

    service.fixTargetName(jsonFieldMap);

    @SuppressWarnings("unchecked")
    Map<String, Object> result = (Map<String, Object>) jsonFieldMap.get("myField");
    assertEquals("id", result.get("targetName"));
  }

  @Test
  void fixTargetName_shouldSkipFieldsWithoutJsonTarget() {
    Map<String, Object> jsonFieldMap = new HashMap<>();
    Map<String, Object> fieldAttrs = new HashMap<>();
    fieldAttrs.put("type", "string");
    jsonFieldMap.put("simpleField", fieldAttrs);

    service.fixTargetName(jsonFieldMap);

    @SuppressWarnings("unchecked")
    Map<String, Object> result = (Map<String, Object>) jsonFieldMap.get("simpleField");
    assertFalse(result.containsKey("targetName"));
  }

  // --- createExportZip tests ---

  @Test
  void createExportZip_shouldCreateValidZip() throws IOException {
    File exportDir = tempDir.resolve("export").toFile();
    exportDir.mkdirs();
    Files.writeString(new File(exportDir, "file1.xml").toPath(), "<root/>", StandardCharsets.UTF_8);
    Files.writeString(new File(exportDir, "file2.xml").toPath(), "<data/>", StandardCharsets.UTF_8);

    File zipFile = service.createExportZip(exportDir);

    assertNotNull(zipFile);
    assertTrue(zipFile.exists());

    List<String> entryNames = new ArrayList<>();
    try (ZipFile zf = new ZipFile(zipFile)) {
      zf.stream().forEach(e -> entryNames.add(e.getName()));
    }
    assertTrue(entryNames.contains("file1.xml"));
    assertTrue(entryNames.contains("file2.xml"));
    assertEquals(2, entryNames.size());
  }

  @Test
  void createExportZip_shouldPreserveFileContent() throws IOException {
    File exportDir = tempDir.resolve("export2").toFile();
    exportDir.mkdirs();
    String expectedContent = "<root><child>data</child></root>";
    Files.writeString(
        new File(exportDir, "test.xml").toPath(), expectedContent, StandardCharsets.UTF_8);

    File zipFile = service.createExportZip(exportDir);

    try (ZipFile zf = new ZipFile(zipFile)) {
      ZipEntry entry = zf.getEntry("test.xml");
      assertNotNull(entry);
      try (InputStream is = zf.getInputStream(entry)) {
        String content = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        assertEquals(expectedContent, content);
      }
    }
  }

  // --- getExportTemplateResources tests ---

  @Test
  void getExportTemplateResources_shouldReturnAllTemplates() {
    Map<String, InputStream> resources = service.getExportTemplateResources();

    assertEquals(15, resources.size());
    for (Map.Entry<String, InputStream> entry : resources.entrySet()) {
      assertTrue(entry.getKey().endsWith(".xml"));
      assertNotNull(entry.getValue(), "Resource for " + entry.getKey() + " should not be null");
    }
  }

  // --- getTargetName tests ---

  @Test
  void getTargetName_shouldReturnSpecifiedName() {
    Map<String, Object> fieldAttrs = new HashMap<>();
    fieldAttrs.put("targetName", "label");
    fieldAttrs.put("jsonPath", "field");

    FullContext record = mock(FullContext.class);
    FullContext related = mock(FullContext.class);
    when(record.get("field")).thenReturn(related);
    when(related.get("label")).thenReturn("test-value");

    Object result = service.extractJsonFieldValue(record, fieldAttrs);

    assertEquals("test-value", result);
  }

  @Test
  void getTargetName_shouldDefaultToId() {
    Map<String, Object> fieldAttrs = new HashMap<>();
    fieldAttrs.put("jsonPath", "field");

    FullContext record = mock(FullContext.class);
    FullContext related = mock(FullContext.class);
    when(record.get("field")).thenReturn(related);
    when(related.get("id")).thenReturn(42L);

    Object result = service.extractJsonFieldValue(record, fieldAttrs);

    assertEquals(42L, result);
  }
}
