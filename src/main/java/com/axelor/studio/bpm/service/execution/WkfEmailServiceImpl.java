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
package com.axelor.studio.bpm.service.execution;

import com.axelor.auth.db.User;
import com.axelor.common.Inflector;
import com.axelor.db.EntityHelper;
import com.axelor.db.Model;
import com.axelor.message.db.EmailAddress;
import com.axelor.message.db.Message;
import com.axelor.message.db.Template;
import com.axelor.message.db.repo.EmailAddressRepository;
import com.axelor.message.db.repo.MessageRepository;
import com.axelor.message.db.repo.TemplateRepository;
import com.axelor.message.service.MessageService;
import com.axelor.message.service.TemplateMessageService;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaActionRepository;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.utils.helpers.context.FullContext;
import com.google.inject.Inject;
import jakarta.mail.MessagingException;
import java.util.ArrayList;
import java.util.List;
import org.camunda.bpm.engine.delegate.DelegateExecution;

public class WkfEmailServiceImpl implements WkfEmailService {

  protected MessageService messageService;

  protected WkfUserActionService wkfUserActionService;

  protected MetaActionRepository metaActionRepository;
  protected AppSettingsStudioService appSettingsStudioService;

  protected TemplateRepository templateRepo;
  protected TemplateMessageService templateMessageService;
  protected EmailAddressRepository emailAddressRepo;

  @Inject
  public WkfEmailServiceImpl(
      MessageService messageService,
      WkfUserActionService wkfUserActionService,
      MetaActionRepository metaActionRepository,
      AppSettingsStudioService appSettingsStudioService,
      TemplateRepository templateRepo,
      TemplateMessageService templateMessageService,
      EmailAddressRepository emailAddressRepo) {
    this.messageService = messageService;
    this.wkfUserActionService = wkfUserActionService;
    this.metaActionRepository = metaActionRepository;
    this.appSettingsStudioService = appSettingsStudioService;
    this.templateRepo = templateRepo;
    this.templateMessageService = templateMessageService;
    this.emailAddressRepo = emailAddressRepo;
  }

  protected Inflector inflector = Inflector.getInstance();

  public static final String EMAIL_CONTENT = /*$$(*/
      "Hello %s<br/> BPM state <b>%s</b> is activated on<br/> <a href=\"%s\">%s</a><br/>" /*)*/;

  @Override
  public void sendEmail(WkfTaskConfig wkfTaskConfig, DelegateExecution execution)
      throws ClassNotFoundException, MessagingException {

    String title = wkfTaskConfig.getTaskEmailTitle();
    if (title == null) {
      title = wkfTaskConfig.getName();
    }

    FullContext wkfContext = wkfUserActionService.getModelCtx(wkfTaskConfig, execution);

    if (wkfContext == null) {
      return;
    }

    String model = null;
    String tag = null;
    Long id = null;

    title = wkfUserActionService.processTitle(title, wkfContext);
    model = wkfContext.getTarget().getClass().getName();
    if (wkfContext.getTarget().getClass().equals(MetaJsonRecord.class)) {
      tag = (String) wkfContext.get("jsonModel");
      model = tag;
    } else {
      tag = wkfContext.getTarget().getClass().getSimpleName();
    }
    id = (Long) wkfContext.get("id");

    String url = createUrl(wkfContext, wkfTaskConfig.getDefaultForm());
    String activeNode = execution.getCurrentActivityName();
    Template template = templateRepo.findByName(wkfTaskConfig.getTemplateName());

    Message message = null;
    if (template != null) {
      url = "<a href=\"" + url + "\" >" + url + "</a>";
      message = templateMessageService.generateMessage(id, model, tag, template);
      if (activeNode != null) {
        message.setSubject(message.getSubject().replace("{{activeNode}}", activeNode));
        message.setContent(message.getContent().replace("{{activeNode}}", activeNode));
      }
      message.setSubject(message.getSubject().replace("{{recordUrl}}", url));
      message.setContent(message.getContent().replace("{{recordUrl}}", url));
    } else {
      User user = null;
      if (wkfTaskConfig.getUserPath() != null) {
        user = wkfUserActionService.getUser(wkfTaskConfig.getUserPath(), wkfContext);
      }

      if (user == null || user.getEmail() == null) {
        return;
      }

      String content = EMAIL_CONTENT.formatted(user.getName(), activeNode, url, url);

      List<EmailAddress> toEmailAddressList = new ArrayList<>();
      EmailAddress emailAddress = emailAddressRepo.findByAddress(user.getEmail());
      if (emailAddress == null) {
        emailAddress = new EmailAddress(user.getEmail());
      }
      toEmailAddressList.add(emailAddress);

      message =
          messageService.createMessage(
              model,
              id,
              title,
              content,
              null,
              null,
              toEmailAddressList,
              null,
              null,
              null,
              null,
              MessageRepository.MEDIA_TYPE_EMAIL,
              null,
              null);
    }
    messageService.sendByEmail(message);
  }

  @Override
  public String createUrl(FullContext wkfContext, String formName) {

    if (wkfContext == null) {
      return "";
    }

    String url = appSettingsStudioService.baseUrl();

    Model model = (Model) EntityHelper.getEntity(wkfContext.getTarget());

    if (formName == null) {
      if (model instanceof MetaJsonRecord metaJsonRecord) {
        formName = "custom-model-" + metaJsonRecord.getJsonModel() + "-form";
      } else {
        formName = inflector.dasherize(model.getClass().getSimpleName());
      }
    }

    String action = getAction(formName);

    if (action == null) {
      url += "/#ds/form::" + model.getClass().getName() + "/edit/" + wkfContext.get("id");
    } else {
      url += "/#ds/" + action + "/edit/" + wkfContext.get("id");
    }

    return url;
  }

  protected String getAction(String formName) {

    MetaAction metaAction =
        metaActionRepository.all().filter("self.xml like '%\"" + formName + "\"%'").fetchOne();

    if (metaAction != null) {
      return metaAction.getName();
    }

    return null;
  }
}
