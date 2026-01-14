/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.bpm.service.init;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;

import com.axelor.db.tenants.TenantConnectionProvider;
import com.axelor.studio.baml.tools.BpmTools;
import com.axelor.studio.bpm.service.log.WkfLoggerInitService;
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
      mockedBpmTools.when(BpmTools::getCurentTenant).thenReturn("default");

      assertFalse(processEngineService.isInitialized());
    }
  }

  @Test
  void getEngine_shouldThrowIllegalStateException_whenEngineNotInitialized() {
    try (var mockedBpmTools = mockStatic(BpmTools.class)) {
      mockedBpmTools.when(BpmTools::getCurentTenant).thenReturn("default");

      IllegalStateException exception =
          assertThrows(IllegalStateException.class, () -> processEngineService.getEngine());

      assertTrue(exception.getMessage().contains("not initialized"));
    }
  }
}
