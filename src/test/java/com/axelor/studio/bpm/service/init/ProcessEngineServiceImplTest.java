/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.init;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;

import com.axelor.db.tenants.TenantConnectionProvider;
import com.axelor.studio.bpm.service.log.WkfLoggerInitService;
import com.axelor.studio.bpm.utils.BpmTools;
import com.axelor.studio.service.AppSettingsStudioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ProcessEngineServiceImplTest {

  private ProcessEngineServiceImpl processEngineService;
  private WkfLoggerInitService mockWkfLoggerInitService;
  private TenantConnectionProvider mockTenantConnectionProvider;
  private AppSettingsStudioService mockAppSettingsStudioService;

  @BeforeEach
  void setUp() {
    mockWkfLoggerInitService = mock(WkfLoggerInitService.class);
    mockTenantConnectionProvider = mock(TenantConnectionProvider.class);
    mockAppSettingsStudioService = mock(AppSettingsStudioService.class);

    processEngineService =
        new ProcessEngineServiceImpl(
            mockWkfLoggerInitService, mockTenantConnectionProvider, mockAppSettingsStudioService);
  }

  @Test
  void isInitialized_shouldReturnFalse_whenEngineNotInitialized() {
    try (var mockedBpmTools = mockStatic(BpmTools.class)) {
      mockedBpmTools.when(BpmTools::getCurrentTenant).thenReturn("default");

      assertFalse(processEngineService.isInitialized());
    }
  }

  @Test
  void getEngine_shouldThrowIllegalStateException_whenEngineNotInitialized() {
    try (var mockedBpmTools = mockStatic(BpmTools.class)) {
      mockedBpmTools.when(BpmTools::getCurrentTenant).thenReturn("default");

      IllegalStateException exception =
          assertThrows(IllegalStateException.class, () -> processEngineService.getEngine());

      assertTrue(exception.getMessage().contains("not initialized"));
    }
  }
}
