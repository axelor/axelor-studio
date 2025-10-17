/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor.components.actions;

import com.axelor.i18n.I18n;
import com.axelor.message.db.Message;
import com.axelor.message.db.Template;
import com.axelor.message.db.repo.TemplateRepository;
import com.axelor.message.exception.MessageExceptionMessage;
import com.axelor.message.service.MessageService;
import com.axelor.message.service.TemplateMessageService;
import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.studio.service.constructor.GroovyTemplateService;
import com.google.inject.Inject;
import jakarta.mail.MessagingException;
import java.util.HashMap;
import java.util.Map;

public class StudioActionEmailServiceImpl implements StudioActionEmailService {

  protected static final String TEMPLATE_PATH = "templates/actionMethod.tmpl";

  protected MetaModelRepository metaModelRepo;
  protected MetaJsonModelRepository metaJsonModelRepo;
  protected TemplateRepository templateRepo;

  protected StudioMetaService studioMetaService;
  protected TemplateMessageService templateMessageService;
  protected MessageService messageService;
  protected GroovyTemplateService groovyTemplateService;

  @Inject
  public StudioActionEmailServiceImpl(
      MetaModelRepository metaModelRepo,
      MetaJsonModelRepository metaJsonModelRepo,
      TemplateRepository templateRepo,
      StudioMetaService studioMetaService,
      TemplateMessageService templateMessageService,
      MessageService messageService,
      GroovyTemplateService groovyTemplateService) {
    this.metaModelRepo = metaModelRepo;
    this.metaJsonModelRepo = metaJsonModelRepo;
    this.templateRepo = templateRepo;
    this.studioMetaService = studioMetaService;
    this.templateMessageService = templateMessageService;
    this.messageService = messageService;
    this.groovyTemplateService = groovyTemplateService;
  }

  @Override
  public MetaAction build(StudioAction studioAction) {
    String name = studioAction.getName();
    Object model =
        Boolean.TRUE.equals(studioAction.getIsJson())
            ? metaJsonModelRepo.all().filter("self.name = ?", studioAction.getModel()).fetchOne()
            : metaModelRepo.all().filter("self.fullName = ?", studioAction.getModel()).fetchOne();

    int sendOption = studioAction.getEmailSendOptionSelect();
    Template template = studioAction.getEmailTemplate();

    Map<String, Object> binding = new HashMap<>();
    binding.put("name", name);
    binding.put("id", studioAction.getXmlId());
    binding.put("className", StudioActionEmailService.class.getName());
    binding.put(
        "model",
        (Boolean.TRUE.equals(studioAction.getIsJson())
            ? ((MetaJsonModel) model).getName()
            : ((MetaModel) model).getFullName()));
    binding.put(
        "tag",
        ((Boolean.TRUE.equals(studioAction.getIsJson())
            ? ((MetaJsonModel) model).getName()
            : ((MetaModel) model).getName())));
    binding.put("templateId", template.getId());
    binding.put("sendOption", sendOption);

    String xml = groovyTemplateService.createXmlWithGroovyTemplate(TEMPLATE_PATH, binding);
    return studioMetaService.updateMetaAction(
        name, "action-method", xml, null, studioAction.getXmlId());
  }

  @Override
  @CallMethod
  public ActionResponse sendEmail(
      Long objectId, String model, String tag, Long templateId, int sendOption)
      throws ClassNotFoundException, MessagingException {

    Template template = templateRepo.find(templateId);
    Message message = templateMessageService.generateMessage(objectId, model, tag, template);
    ActionResponse response = new ActionResponse();

    if (sendOption == 0) {
      messageService.sendByEmail(message);
    } else {
      response.setView(
          ActionView.define(I18n.get(MessageExceptionMessage.MESSAGE_3))
              .model(Message.class.getName())
              .add("form", "message-form")
              .param("forceEdit", "true")
              .context("_showRecord", message.getId().toString())
              .map());
    }
    return response;
  }
}
