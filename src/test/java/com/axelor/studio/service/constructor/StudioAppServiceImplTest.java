/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.axelor.inject.Beans;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.studio.db.App;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.repo.AppRepository;
import com.axelor.studio.db.repo.StudioAppRepo;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.studio.service.loader.AppLoaderExportService;
import com.axelor.studio.service.loader.AppLoaderImportService;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.MockedStatic;

class StudioAppServiceImplTest {

  private AppLoaderExportService appLoaderExportService;
  private AppLoaderImportService appLoaderImportService;
  private MetaFiles metaFiles;
  private AppRepository appRepo;
  private MetaJsonModelRepository metaJsonModelRepo;
  private StudioAppRepo studioAppRepo;
  private StudioAppUpdateCleanupService cleanupService;
  private StudioAppServiceImpl service;

  @TempDir Path tempDir;

  @BeforeEach
  void setUp() {
    appLoaderExportService = mock(AppLoaderExportService.class);
    appLoaderImportService = mock(AppLoaderImportService.class);
    metaFiles = mock(MetaFiles.class);
    appRepo = mock(AppRepository.class);
    metaJsonModelRepo = mock(MetaJsonModelRepository.class);
    studioAppRepo = mock(StudioAppRepo.class);
    cleanupService = mock(StudioAppUpdateCleanupService.class);

    service =
        new StudioAppServiceImpl(
            appLoaderExportService,
            appLoaderImportService,
            metaFiles,
            appRepo,
            metaJsonModelRepo,
            studioAppRepo,
            cleanupService);
  }

  // --- checkCode tests ---

  @Test
  void checkCode_shouldPassWhenNoExistingApp() {
    StudioApp studioApp = new StudioApp("Test App", "test-app");
    when(appRepo.findByCode("test-app")).thenReturn(null);

    service.checkCode(studioApp);
  }

  @Test
  void checkCode_shouldPassWhenSameGeneratedApp() {
    App generatedApp = new App("Test App", "test-app");
    StudioApp studioApp = new StudioApp("Test App", "test-app");
    studioApp.setGeneratedApp(generatedApp);
    when(appRepo.findByCode("test-app")).thenReturn(generatedApp);

    service.checkCode(studioApp);
  }

  @Test
  void checkCode_shouldThrowWhenDifferentAppExists() {
    App existingApp = new App("Other App", "test-app");
    App generatedApp = new App("Test App", "test-app");
    StudioApp studioApp = new StudioApp("Test App", "test-app");
    studioApp.setGeneratedApp(generatedApp);
    when(appRepo.findByCode("test-app")).thenReturn(existingApp);

    assertThrows(IllegalStateException.class, () -> service.checkCode(studioApp));
  }

  // --- build tests ---

  @Test
  void build_shouldCreateNewAppWhenNoGeneratedApp() {
    StudioApp studioApp = new StudioApp("My App", "my-app");
    studioApp.setSequence(5);
    when(appRepo.findByCode("my-app")).thenReturn(null);
    when(appRepo.save(any(App.class))).thenAnswer(invocation -> invocation.getArgument(0));

    StudioApp result = service.build(studioApp);

    assertNotNull(result.getGeneratedApp());
    App app = result.getGeneratedApp();
    assertEquals("My App", app.getName());
    assertEquals("my-app", app.getCode());
    assertTrue(app.getIsCustom());
    assertEquals(AppRepository.TYPE_CUSTOM, app.getTypeSelect());
  }

  @Test
  void build_shouldUpdateExistingApp() {
    App existingApp = new App("Old Name", "my-app");
    StudioApp studioApp = new StudioApp("New Name", "my-app");
    studioApp.setGeneratedApp(existingApp);
    when(appRepo.findByCode("my-app")).thenReturn(existingApp);
    when(appRepo.save(any(App.class))).thenAnswer(invocation -> invocation.getArgument(0));

    StudioApp result = service.build(studioApp);

    assertEquals("New Name", result.getGeneratedApp().getName());
    assertEquals("my-app", result.getGeneratedApp().getCode());
  }

  @Test
  void build_shouldMapAllFields() {
    StudioApp studioApp = new StudioApp("Full App", "full-app");
    studioApp.setDescription("A description");
    studioApp.setModules("axelor-studio");
    studioApp.setSequence(10);
    studioApp.setIsInAppView(true);
    MetaFile image = new MetaFile();
    image.setFileName("logo.png");
    studioApp.setImage(image);

    Set<App> depends = new HashSet<>();
    App dep = new App("Dep", "dep");
    depends.add(dep);
    studioApp.setDependsOnSet(depends);

    when(appRepo.findByCode("full-app")).thenReturn(null);
    when(appRepo.save(any(App.class))).thenAnswer(invocation -> invocation.getArgument(0));

    StudioApp result = service.build(studioApp);

    App app = result.getGeneratedApp();
    assertEquals("A description", app.getDescription());
    assertEquals("axelor-studio", app.getModules());
    assertEquals(10, app.getSequence());
    assertTrue(app.getIsInAppView());
    assertEquals(image, app.getImage());
    assertNotNull(app.getDependsOnSet());
    assertEquals(1, app.getDependsOnSet().size());
  }

  @Test
  void build_shouldHandleNullDependsOnSet() {
    StudioApp studioApp = new StudioApp("Simple App", "simple-app");
    studioApp.setDependsOnSet(null);
    when(appRepo.findByCode("simple-app")).thenReturn(null);
    when(appRepo.save(any(App.class))).thenAnswer(invocation -> invocation.getArgument(0));

    StudioApp result = service.build(studioApp);

    assertNotNull(result.getGeneratedApp());
  }

  // --- clean tests ---

  @Test
  void clean_shouldRemoveGeneratedApp() {
    App generatedApp = new App("Test", "test");
    StudioApp studioApp = new StudioApp("Test", "test");
    studioApp.setGeneratedApp(generatedApp);

    service.clean(studioApp);

    verify(appRepo).remove(generatedApp);
    assertNull(studioApp.getGeneratedApp());
  }

  @Test
  void clean_shouldDoNothingWhenNoGeneratedApp() {
    StudioApp studioApp = new StudioApp("Test", "test");

    service.clean(studioApp);

    verify(appRepo, never()).remove(any(App.class));
  }

  // --- deleteApp tests ---

  @Test
  void deleteApp_shouldCallStudioAppRepoRemove() {
    StudioApp studioApp = new StudioApp("Test", "test");

    service.deleteApp(studioApp);

    verify(studioAppRepo).remove(studioApp);
  }

  // --- generateExportFile tests ---

  @Test
  void generateExportFile_shouldDelegateToExportService() throws Exception {
    java.io.File exportDir = java.nio.file.Files.createTempDirectory("test-export").toFile();

    service.generateExportFile(exportDir, false, 1, 2);

    verify(appLoaderExportService).generateMetaDataFiles(any(), any());
  }

  // --- importApp tests ---

  @Test
  void importApp_shouldCallValidateZipForAppWhenStudioAppProvided() throws IOException {
    StudioApp studioApp = new StudioApp("My App", "my-app");
    when(appLoaderImportService.getAppImportConfigFiles(any())).thenReturn(Collections.emptyList());

    withStaticMocks(
        "import-validate",
        fakeZip -> {
          service.importApp(Map.of("filePath", fakeZip.toString()), studioApp);
          verify(appLoaderImportService).validateZipForApp(any(File.class), eq("my-app"));
        });
  }

  @Test
  void importApp_shouldSkipValidationWhenStudioAppIsNull() throws IOException {
    when(appLoaderImportService.getAppImportConfigFiles(any())).thenReturn(Collections.emptyList());

    withStaticMocks(
        "import-null",
        fakeZip -> {
          service.importApp(Map.of("filePath", fakeZip.toString()), (StudioApp) null);
          verify(appLoaderImportService, never()).validateZipForApp(any(), any());
        });
  }

  // --- updateApp tests ---

  @Test
  void updateApp_shouldAlwaysCallValidateZipForApp() throws IOException {
    StudioApp studioApp = new StudioApp("My App", "my-app");
    when(appLoaderImportService.getAppImportConfigFiles(any())).thenReturn(Collections.emptyList());

    withStaticMocks(
        "update-validate",
        fakeZip -> {
          service.updateApp(Map.of("filePath", fakeZip.toString()), studioApp, false);
          verify(appLoaderImportService).validateZipForApp(any(File.class), eq("my-app"));
        });
  }

  @Test
  void updateApp_shouldCallDetachWhenFlagIsTrue() throws IOException {
    StudioApp studioApp = new StudioApp("My App", "my-app");
    when(appLoaderImportService.getAppImportConfigFiles(any())).thenReturn(Collections.emptyList());
    when(cleanupService.detachObsoleteElements(any(), any())).thenReturn(Collections.emptyList());

    withStaticMocks(
        "update-detach",
        fakeZip -> {
          service.updateApp(Map.of("filePath", fakeZip.toString()), studioApp, true);
          verify(cleanupService).detachObsoleteElements(any(File.class), eq(studioApp));
        });
  }

  @Test
  void updateApp_shouldSkipDetachWhenFlagIsFalse() throws IOException {
    StudioApp studioApp = new StudioApp("My App", "my-app");
    when(appLoaderImportService.getAppImportConfigFiles(any())).thenReturn(Collections.emptyList());

    withStaticMocks(
        "update-no-detach",
        fakeZip -> {
          service.updateApp(Map.of("filePath", fakeZip.toString()), studioApp, false);
          verify(cleanupService, never()).detachObsoleteElements(any(), any());
        });
  }

  @FunctionalInterface
  private interface StaticMockAction {
    void execute(Path fakeZip) throws IOException;
  }

  private void withStaticMocks(String testName, StaticMockAction action) throws IOException {
    Path fakeTempDir = tempDir.resolve(testName);
    Files.createDirectories(fakeTempDir);
    Path fakeZip = tempDir.resolve(testName + ".zip");
    Files.writeString(fakeZip, "data");

    try (MockedStatic<MetaFiles> metaFilesMock = mockStatic(MetaFiles.class);
        MockedStatic<Files> filesMock = mockStatic(Files.class);
        MockedStatic<Beans> beansMock = mockStatic(Beans.class)) {
      filesMock.when(() -> Files.createTempDirectory("")).thenReturn(fakeTempDir);
      filesMock.when(() -> Files.deleteIfExists(any(Path.class))).thenReturn(true);
      metaFilesMock.when(() -> MetaFiles.getPath(fakeZip.toString())).thenReturn(fakeZip);
      beansMock
          .when(() -> Beans.get(StudioMetaService.class))
          .thenReturn(mock(StudioMetaService.class));

      action.execute(fakeZip);
    }
  }
}
