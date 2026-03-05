/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.loader;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import com.axelor.meta.MetaFiles;
import com.axelor.studio.db.repo.AppLoaderRepository;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class AppLoaderImportServiceImplTest {

  private AppLoaderRepository appLoaderRepository;
  private MetaFiles metaFiles;
  private AppLoaderExportService appLoaderExportService;
  private AppLoaderImportServiceImpl service;

  @TempDir Path tempDir;

  @BeforeEach
  void setUp() {
    appLoaderRepository = mock(AppLoaderRepository.class);
    metaFiles = mock(MetaFiles.class);
    appLoaderExportService = mock(AppLoaderExportService.class);

    service =
        new AppLoaderImportServiceImpl(appLoaderRepository, metaFiles, appLoaderExportService);
  }

  // --- Helper ---

  private File createZipWithEntries(Map<String, String> entries) throws IOException {
    File zipFile = tempDir.resolve("test.zip").toFile();
    try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipFile))) {
      for (Map.Entry<String, String> entry : entries.entrySet()) {
        zos.putNextEntry(new ZipEntry(entry.getKey()));
        zos.write(entry.getValue().getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
      }
    }
    return zipFile;
  }

  // --- extractImportZip tests ---

  @Test
  void extractImportZip_shouldExtractAllEntries() throws IOException {
    File dataDir = tempDir.resolve("data").toFile();
    dataDir.mkdirs();

    File zipFile =
        createZipWithEntries(
            Map.of(
                "file1.xml", "<root/>",
                "file2.xml", "<data/>",
                "file3.xml", "<items/>"));

    service.extractImportZip(dataDir, zipFile);

    assertEquals(3, dataDir.listFiles().length);
    assertEquals("<root/>", Files.readString(new File(dataDir, "file1.xml").toPath()));
    assertEquals("<data/>", Files.readString(new File(dataDir, "file2.xml").toPath()));
    assertEquals("<items/>", Files.readString(new File(dataDir, "file3.xml").toPath()));
  }

  @Test
  void extractImportZip_shouldRejectPathTraversal() throws IOException {
    File dataDir = tempDir.resolve("data-traversal").toFile();
    dataDir.mkdirs();

    File zipFile = createZipWithEntries(Map.of("../../etc/passwd", "malicious content"));

    IOException exception =
        assertThrows(IOException.class, () -> service.extractImportZip(dataDir, zipFile));

    assertTrue(exception.getMessage().contains("outside of target dir"));
  }

  @Test
  void extractImportZip_shouldDoNothingForNullZipFile() throws IOException {
    File dataDir = tempDir.resolve("data-null").toFile();
    dataDir.mkdirs();

    service.extractImportZip(dataDir, null);

    assertEquals(0, dataDir.listFiles().length);
  }

  @Test
  void extractImportZip_shouldHandleEmptyZip() throws IOException {
    File dataDir = tempDir.resolve("data-empty").toFile();
    dataDir.mkdirs();

    File zipFile = createZipWithEntries(Map.of());

    service.extractImportZip(dataDir, zipFile);

    assertEquals(0, dataDir.listFiles().length);
  }

  // --- getAppImportConfigFiles tests ---

  @Test
  void getAppImportConfigFiles_shouldReturnConfigsForExistingDataFiles() throws IOException {
    File dataDir = tempDir.resolve("import-data").toFile();
    dataDir.mkdirs();
    Files.writeString(
        new File(dataDir, "studio-app.xml").toPath(), "<studio-apps/>", StandardCharsets.UTF_8);

    List<File> configFiles = service.getAppImportConfigFiles(dataDir);

    assertFalse(configFiles.isEmpty());
    assertTrue(configFiles.stream().anyMatch(f -> f.getName().equals("studio-app-config.xml")));
  }

  @Test
  void getAppImportConfigFiles_shouldSkipMissingDataFiles() throws IOException {
    File dataDir = tempDir.resolve("import-empty").toFile();
    dataDir.mkdirs();

    List<File> configFiles = service.getAppImportConfigFiles(dataDir);

    assertTrue(configFiles.isEmpty());
  }

  @Test
  void getAppImportConfigFiles_shouldIncludeDataConfigIfPresent() throws IOException {
    File dataDir = tempDir.resolve("import-config").toFile();
    dataDir.mkdirs();
    Files.writeString(
        new File(dataDir, "data-config.xml").toPath(), "<xml-config/>", StandardCharsets.UTF_8);

    List<File> configFiles = service.getAppImportConfigFiles(dataDir);

    assertEquals(1, configFiles.size());
    assertEquals("data-config.xml", configFiles.get(0).getName());
  }

  @Test
  void getAppImportConfigFiles_shouldRespectImportOrder() throws IOException {
    File dataDir = tempDir.resolve("import-order").toFile();
    dataDir.mkdirs();

    Files.writeString(
        new File(dataDir, "studio-app.xml").toPath(), "<data/>", StandardCharsets.UTF_8);
    Files.writeString(
        new File(dataDir, "meta-action.xml").toPath(), "<data/>", StandardCharsets.UTF_8);
    Files.writeString(
        new File(dataDir, "studio-menu.xml").toPath(), "<data/>", StandardCharsets.UTF_8);

    List<File> configFiles = service.getAppImportConfigFiles(dataDir);

    assertEquals(3, configFiles.size());
    assertEquals("studio-app-config.xml", configFiles.get(0).getName());
    assertEquals("studio-menu-config.xml", configFiles.get(1).getName());
    assertEquals("meta-action-config.xml", configFiles.get(2).getName());
  }

  // --- validateZipForApp tests ---

  @Test
  void validateZipForApp_shouldPassWhenNoStudioAppFilePresent() throws IOException {
    File dataDir = tempDir.resolve("validate-no-file").toFile();
    dataDir.mkdirs();

    service.validateZipForApp(dataDir, "my-app");
  }

  @Test
  void validateZipForApp_shouldPassWhenCodeMatches() throws IOException {
    File dataDir = tempDir.resolve("validate-match").toFile();
    dataDir.mkdirs();
    Files.writeString(
        new File(dataDir, "studio-app.xml").toPath(),
        "<studio-apps><studio-app><code>my-app</code></studio-app></studio-apps>",
        StandardCharsets.UTF_8);

    service.validateZipForApp(dataDir, "my-app");
  }

  @Test
  void validateZipForApp_shouldThrowWhenCodeMismatches() throws IOException {
    File dataDir = tempDir.resolve("validate-mismatch").toFile();
    dataDir.mkdirs();
    Files.writeString(
        new File(dataDir, "studio-app.xml").toPath(),
        "<studio-apps><studio-app><code>other-app</code></studio-app></studio-apps>",
        StandardCharsets.UTF_8);

    assertThrows(IllegalStateException.class, () -> service.validateZipForApp(dataDir, "my-app"));
  }

  @Test
  void validateZipForApp_shouldThrowWhenMultipleAppsInZip() throws IOException {
    File dataDir = tempDir.resolve("validate-multi").toFile();
    dataDir.mkdirs();
    Files.writeString(
        new File(dataDir, "studio-app.xml").toPath(),
        "<studio-apps><studio-app><code>a</code></studio-app>"
            + "<studio-app><code>b</code></studio-app></studio-apps>",
        StandardCharsets.UTF_8);

    assertThrows(IllegalStateException.class, () -> service.validateZipForApp(dataDir, "a"));
  }

  @Test
  void validateZipForApp_shouldPassWhenNoCodeElementPresent() throws IOException {
    File dataDir = tempDir.resolve("validate-no-code").toFile();
    dataDir.mkdirs();
    Files.writeString(
        new File(dataDir, "studio-app.xml").toPath(),
        "<studio-apps><studio-app><name>My App</name></studio-app></studio-apps>",
        StandardCharsets.UTF_8);

    service.validateZipForApp(dataDir, "my-app");
  }
}
