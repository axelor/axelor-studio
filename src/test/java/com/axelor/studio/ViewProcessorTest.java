package com.axelor.studio;

import static org.mockito.Mockito.*;

import com.axelor.auth.AuthUtils;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.inject.Beans;
import com.axelor.meta.loader.LoaderHelper;
import com.axelor.meta.schema.views.Button;
import com.axelor.meta.schema.views.FormView;
import com.axelor.meta.service.ViewProcessor;
import com.axelor.studio.db.AppStudio;
import com.axelor.studio.db.repo.AppStudioRepository;
import com.axelor.studio.service.app.AppStudioService;
import com.axelor.utils.junit.BaseTest;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

class ViewProcessorTest extends BaseTest {

  private final UserRepository userRepository;
  private final LoaderHelper loaderHelper;
  private final ViewProcessor viewProcessor;
  private final AppStudioService appStudioService;

  @Inject
  public ViewProcessorTest(
      UserRepository userRepository,
      LoaderHelper loaderHelper,
      ViewProcessor viewProcessor,
      AppStudioService appStudioService) {
    this.userRepository = userRepository;
    this.loaderHelper = loaderHelper;
    this.viewProcessor = viewProcessor;
    this.appStudioService = appStudioService;
  }

  @BeforeEach
  void setUp() {
    loaderHelper.importCsv("data/groups-input.xml");
    loaderHelper.importCsv("data/users-input.xml");
    loaderHelper.importCsv("data/app-studio-input.xml");
  }

  @Test
  @Transactional
  void shouldNotAddButtonWhenFeatureIsDisabled() {
    AppStudio appStudio = appStudioService.getAppStudio();
    appStudio.setEnableStudioButton(false);
    Beans.get(AppStudioRepository.class).save(appStudio);

    FormView formView = new FormView();
    try (MockedStatic<AuthUtils> mockedAuthUtils = mockStatic(AuthUtils.class)) {
      mockedAuthUtils
          .when(AuthUtils::getUser)
          .thenReturn(userRepository.findByName("customize-user"));
      viewProcessor.process(formView);
    }

    Assertions.assertTrue(formView.getToolbar() == null || formView.getToolbar().isEmpty());
  }

  @Test
  @Transactional
  void shouldAddButtonWhenFeatureIsEnabled() {
    AppStudio appStudio = appStudioService.getAppStudio();
    appStudio.setEnableStudioButton(true);
    Beans.get(AppStudioRepository.class).save(appStudio);

    FormView formView = new FormView();
    try (MockedStatic<AuthUtils> mockedAuthUtils = mockStatic(AuthUtils.class)) {
      mockedAuthUtils
          .when(AuthUtils::getUser)
          .thenReturn(userRepository.findByName("customize-user"));
      viewProcessor.process(formView);
    }

    var toolbar = formView.getToolbar();
    Assertions.assertNotNull(toolbar);
    Assertions.assertFalse(toolbar.isEmpty());

    Button studioButton = toolbar.getFirst();
    Assertions.assertEquals("openStudioBtn", studioButton.getName());
    Assertions.assertEquals("action-studio-method-open-studio-builder", studioButton.getOnClick());
  }

  @Test
  void shouldAddButtonByDefault() {

    FormView formView = new FormView();
    try (MockedStatic<AuthUtils> mockedAuthUtils = mockStatic(AuthUtils.class)) {
      mockedAuthUtils
          .when(AuthUtils::getUser)
          .thenReturn(userRepository.findByName("customize-user"));
      viewProcessor.process(formView);
    }

    var toolbar = formView.getToolbar();
    Assertions.assertNotNull(toolbar);
    Assertions.assertFalse(toolbar.isEmpty());

    Button studioButton = toolbar.getFirst();
    Assertions.assertEquals("openStudioBtn", studioButton.getName());
    Assertions.assertEquals("action-studio-method-open-studio-builder", studioButton.getOnClick());
  }
}
