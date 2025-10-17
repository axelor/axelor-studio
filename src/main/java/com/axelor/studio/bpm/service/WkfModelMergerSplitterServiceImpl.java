/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service;

import com.axelor.db.Model;
import com.axelor.db.Query;
import com.axelor.i18n.I18n;
import com.axelor.meta.db.MetaModel;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.pojo.MergeSplitContributor;
import com.axelor.studio.bpm.pojo.MergeSplitResult;
import com.axelor.studio.bpm.service.deployment.BpmDeploymentService;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.BpmWkfModelRepository;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.ProcessEngines;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class WkfModelMergerSplitterServiceImpl implements WkfModelMergerSplitterService {

  protected static final String CODE_ATTR = "camunda:code";
  protected static final String NAME_ATTR = "camunda:diagramName";
  protected static final String ID_ATTR = "id";
  protected static final String Y_ATTR = "y";
  protected static final String COLLABORATION_TAG = "bpmn2:collaboration";
  protected static final String PROCESS_TAG = "bpmn2:process";
  protected static final String MSG_TAG = "bpmn2:message";
  protected static final String BPMN_PLANE_TAG = "bpmndi:BPMNPlane";
  protected static final String PARTICIPANT_TAG = "bpmn2:participant";
  protected static final String PROCESS_REF_ATTR = "processRef";
  protected static final String BPMN_DIAG_TAG = "bpmndi:BPMNDiagram";
  protected static final String BPMN_ELEMENT_ATTR = "bpmnElement";
  protected static final String EXTERNAL_ENTITIES_DECLARATION =
      "http://xml.org/sax/features/external-general-entities";
  protected final Logger log = LoggerFactory.getLogger(WkfModelMergerSplitterServiceImpl.class);

  protected final WkfModelRepository wkfModelRepository;
  protected final WkfModelService wkfModelService;
  protected final BpmDeploymentService bpmDeploymentService;
  protected final WkfInstanceService wkfInstanceService;
  protected final BpmWkfModelRepository bpmWkfModelRepository;
  protected final WkfInstanceRepository wkfInstanceRepository;

  @Inject
  public WkfModelMergerSplitterServiceImpl(
      WkfModelRepository wkfModelRepository,
      WkfModelService wkfModelService,
      BpmDeploymentService bpmDeploymentService,
      WkfInstanceService wkfInstanceService,
      BpmWkfModelRepository bpmWkfModelRepository,
      WkfInstanceRepository wkfInstanceRepository) {
    this.wkfModelRepository = wkfModelRepository;
    this.wkfModelService = wkfModelService;
    this.bpmDeploymentService = bpmDeploymentService;
    this.wkfInstanceService = wkfInstanceService;
    this.bpmWkfModelRepository = bpmWkfModelRepository;
    this.wkfInstanceRepository = wkfInstanceRepository;
  }

  @Override
  public List<String> split(MergeSplitContributor contributor) {
    if (contributor.getId() == null && contributor.getDiagramXml() == null) {
      throw new IllegalArgumentException(I18n.get(BpmExceptionMessage.BPM_WKF_MODEL_EXPECTED));
    }
    if (contributor.getId() != null) {
      return split(
          wkfModelRepository.find(contributor.getId()).getDiagramXml(),
          contributor.getParticipants());
    } else {
      return split(contributor.getDiagramXml(), contributor.getParticipants());
    }
  }

  @Override
  public String merge(List<MergeSplitContributor> contributors) {
    if (contributors.size() < 2) {
      throw new IllegalArgumentException(
          I18n.get(BpmExceptionMessage.BPM_MODEL_REQUIRED_NUMBER_TO_PERFORM_MERGE_OPERATION));
    }
    for (MergeSplitContributor contributor : contributors) {
      if (contributor.getId() == null && contributor.getDiagramXml() == null) {
        throw new IllegalArgumentException(I18n.get(BpmExceptionMessage.BPM_WKF_MODEL_EXPECTED));
      }
    }
    List<String> modelXmlList = new ArrayList<>();
    for (MergeSplitContributor contributor : contributors) {
      if (contributor.getId() != null) {
        modelXmlList.add(
            importParticipants(
                wkfModelRepository.find(contributor.getId()).getDiagramXml(),
                contributor.getParticipants()));
      } else {
        modelXmlList.add(
            importParticipants(contributor.getDiagramXml(), contributor.getParticipants()));
      }
    }
    return mergeXml(modelXmlList);
  }

  protected String mergeXml(List<String> modelsXmlList) throws IllegalStateException {
    String mergedDiag = regenerateIds(modelsXmlList.getFirst());
    mergedDiag = initialize(mergedDiag);

    String finalMergedDiagXml = mergedDiag;
    String resultXml =
        modelsXmlList.stream()
            .skip(1)
            .map(
                diag -> {
                  int newY = getMaxYCoordinate(finalMergedDiagXml);
                  String modifiedDiag = adjustYCoordinates(diag, newY + 10);
                  return regenerateIds(modifiedDiag);
                })
            .reduce(mergedDiag, this::mergeBpmnDiagrams);

    return update(resultXml);
  }

  protected String update(String mergedDiagXml) {
    try {
      Document document = getDocument(mergedDiagXml);
      List<String> bpmnElements = extractBpmnElements(document);

      removeUnusedNodes(document, bpmnElements);

      return convertDocumentToString(document);
    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected List<String> extractBpmnElements(Document document) {
    List<String> bpmnElements = new ArrayList<>();

    NodeList participants = document.getElementsByTagName(PARTICIPANT_TAG);
    extractElementsFromNodeList(participants, ID_ATTR, bpmnElements);

    NodeList processes = document.getElementsByTagName(PROCESS_TAG);
    for (int i = 0; i < processes.getLength(); i++) {
      NodeList childs = processes.item(i).getChildNodes();
      extractElementsFromNodeList(childs, ID_ATTR, bpmnElements);
    }

    return bpmnElements;
  }

  protected void extractElementsFromNodeList(
      NodeList nodeList, String attributeName, List<String> bpmnElements) {
    for (int i = 0; i < nodeList.getLength(); i++) {
      Node node = nodeList.item(i);
      if (node.getAttributes() != null
          && node.getAttributes().getNamedItem(attributeName) != null) {
        bpmnElements.add(node.getAttributes().getNamedItem(attributeName).getTextContent());
        if (node.hasChildNodes()) {
          extractElementsFromNodeList(node.getChildNodes(), attributeName, bpmnElements);
        }
      }
    }
  }

  protected void removeUnusedNodes(Document document, List<String> bpmnElements) {
    NodeList bpmnPlaneNodes = document.getElementsByTagName(BPMN_PLANE_TAG);
    for (int i = 0; i < bpmnPlaneNodes.getLength(); i++) {
      Node bpmnPlaneNode = bpmnPlaneNodes.item(i);
      NodeList childNodes = bpmnPlaneNode.getChildNodes();
      for (int j = 0; j < childNodes.getLength(); j++) {
        Node childNode = childNodes.item(j);
        if (childNode.getNodeType() == Node.ELEMENT_NODE && childNode.hasAttributes()) {
          String nodeId =
              childNode.getAttributes().getNamedItem(BPMN_ELEMENT_ATTR).getTextContent();
          if (!bpmnElements.contains(nodeId)) {
            bpmnPlaneNode.removeChild(childNode);
          }
        }
      }
    }
  }

  protected Document getDocument(String xmlDiag)
      throws ParserConfigurationException, SAXException, IOException {
    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
    factory.setFeature(EXTERNAL_ENTITIES_DECLARATION, false);
    DocumentBuilder builder = factory.newDocumentBuilder();
    return builder.parse(new org.xml.sax.InputSource(new java.io.StringReader(xmlDiag)));
  }

  protected int getMaxYCoordinate(String xmlDiagram) {
    int maxYCoordinate = 0;

    try {
      Document doc = getDocument(xmlDiagram);
      NodeList allNodes = doc.getElementsByTagName("*");
      for (int i = 0; i < allNodes.getLength(); i++) {
        Node node = allNodes.item(i);
        if (node.getAttributes().getNamedItem(Y_ATTR) != null) {
          String yValue = node.getAttributes().getNamedItem(Y_ATTR).getTextContent();
          int yCoordinate = Integer.parseInt(yValue);
          maxYCoordinate = Math.max(maxYCoordinate, yCoordinate);
        }
      }
      return maxYCoordinate;

    } catch (ParserConfigurationException | SAXException | IOException e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected String adjustYCoordinates(String xmlDiagram, int deltaY) {
    try {
      Document doc = getDocument(xmlDiagram);

      NodeList allNodes = doc.getElementsByTagName("*");
      for (int i = 0; i < allNodes.getLength(); i++) {
        Node node = allNodes.item(i);
        if (node instanceof Element element) {
          String yValue = element.getAttribute(Y_ATTR);
          if (yValue != null && !yValue.isEmpty()) {
            try {
              int yCoordinate = Integer.parseInt(yValue);
              int adjustedCoordinate = yCoordinate + deltaY;
              element.setAttribute(Y_ATTR, String.valueOf(adjustedCoordinate));
            } catch (Exception e) {
              throw new IllegalStateException(e.getMessage());
            }
          }
        }
      }
      TransformerFactory transformerFactory = TransformerFactory.newInstance();
      Transformer transformer = transformerFactory.newTransformer();
      DOMSource source = new DOMSource(doc);
      StringWriter writer = new StringWriter();
      StreamResult result = new StreamResult(writer);
      transformer.transform(source, result);
      return writer.toString();

    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected String mergeBpmnDiagrams(String xmlA, String xmlB) {
    try {
      Document docA = getDocument(xmlA);
      Document docB = getDocument(xmlB);

      mergeCollaborationNodes(docA, docB);
      mergeProcesses(docA, docB);
      mergeMessages(docA, docB);
      mergeBPMNPlane(docA, docB);

      return convertDocumentToString(docA);
    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected void mergeCollaborationNodes(Document docA, Document docB) {
    Node collaborationNodeA = findCollaborationNode(docA);
    Node collaborationNodeB = findCollaborationNode(docB);
    NodeList participantsB = collaborationNodeB.getChildNodes();
    for (int i = 0; i < participantsB.getLength(); i++) {
      Node participantNodeB = participantsB.item(i);
      Node importedNode = docA.importNode(participantNodeB, true);
      collaborationNodeA.appendChild(importedNode);
    }
  }

  protected Node findCollaborationNode(Document doc) {
    NodeList collaborationList = doc.getElementsByTagName(COLLABORATION_TAG);
    if (collaborationList.getLength() > 0) {
      return collaborationList.item(0);
    } else {
      throw new IllegalArgumentException(
          I18n.get(BpmExceptionMessage.BPM_MISSING_PROCESS_CONFIGURATION));
    }
  }

  protected void mergeBPMNPlane(Document docA, Document docB) {
    Node bpmnPlaneNodeA = findBPMNPlaneNode(docA);
    Node bpmnPlaneNodeB = findBPMNPlaneNode(docB);

    NodeList bpmnShapeListB = bpmnPlaneNodeB.getChildNodes();
    for (int i = 0; i < bpmnShapeListB.getLength(); i++) {
      Node bpmnShapeNodeB = bpmnShapeListB.item(i);
      Node importedNode = docA.importNode(bpmnShapeNodeB, true);
      bpmnPlaneNodeA.appendChild(importedNode);
    }
  }

  protected Node findBPMNPlaneNode(Document doc) {
    NodeList bpmnPlaneList = doc.getElementsByTagName(BPMN_PLANE_TAG);
    return bpmnPlaneList.item(0);
  }

  protected String convertDocumentToString(Document doc) throws TransformerException {
    TransformerFactory tf = TransformerFactory.newInstance();
    Transformer transformer = tf.newTransformer();
    StringWriter writer = new StringWriter();
    transformer.transform(new DOMSource(doc), new StreamResult(writer));
    return writer.getBuffer().toString();
  }

  protected void mergeProcesses(Document docA, Document docB) {
    Node processesParentNodeA = findParentNode(docA);
    NodeList processListA = docA.getElementsByTagName(PROCESS_TAG);
    NodeList processListB = docB.getElementsByTagName(PROCESS_TAG);
    for (int i = 0; i < processListB.getLength(); i++) {
      Node processNodeB = processListB.item(i);
      Node importedNode = docA.importNode(processNodeB, true);
      Node lastProcessNode = processListA.item(processListA.getLength() - 1);
      processesParentNodeA.insertBefore(importedNode, lastProcessNode.getNextSibling());
    }
  }

  protected Node findParentNode(Document doc) {
    return doc.getDocumentElement();
  }

  protected void mergeMessages(Document docA, Document docB) {
    Node messagesParentNodeA = findParentNode(docA);
    NodeList messageListA = docA.getElementsByTagName(MSG_TAG);
    NodeList messageListB = docB.getElementsByTagName(MSG_TAG);
    for (int i = 0; i < messageListB.getLength(); i++) {
      Node messageNodeB = messageListB.item(i);
      Node importedNode = docA.importNode(messageNodeB, true);
      if (messageListA.getLength() > 0) {
        Node lastMessageNode = messageListA.item(messageListA.getLength() - 1);
        messagesParentNodeA.insertBefore(importedNode, lastMessageNode.getNextSibling());
      } else {
        messagesParentNodeA.appendChild(importedNode);
      }
    }
  }

  protected String initialize(String xmlDiag) {
    try {
      Document mergedDoc = getDocument(xmlDiag);

      Node parent = findParentNode(mergedDoc);
      parent.getAttributes().removeNamedItem(CODE_ATTR);
      parent.getAttributes().removeNamedItem(NAME_ATTR);

      return convertDocumentToString(mergedDoc);

    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected String changeProcessIds(String xmlDiag) {
    try {
      Document doc = getDocument(xmlDiag);
      String prefix =
          findParentNode(doc)
              .getAttributes()
              .getNamedItem(CODE_ATTR)
              .getTextContent()
              .toLowerCase()
              .concat("-");
      prefix = prefix.replace(" ", "_");
      NodeList processList = doc.getElementsByTagName(PROCESS_TAG);
      for (int i = 0; i < processList.getLength(); i++) {
        String initialID =
            processList.item(i).getAttributes().getNamedItem(ID_ATTR).getTextContent();
        xmlDiag = xmlDiag.replace(initialID, prefix.concat(initialID));
      }
      return xmlDiag;

    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected List<String> split(String diagram, List<String> participantsList) {
    try {
      String newXmlDiag = changeProcessIds(diagram);
      Document parentDoc = getDocument(newXmlDiag);
      NodeList participants = parentDoc.getElementsByTagName(PARTICIPANT_TAG);
      Node parentNode = findParentNode(parentDoc);
      parentNode.getAttributes().removeNamedItem(NAME_ATTR);
      parentNode.getAttributes().removeNamedItem(CODE_ATTR);
      Node collaborationNode = findCollaborationNode(parentDoc);
      List<String> splittedXml = new ArrayList<>();
      for (int i = 0; i < participants.getLength(); i++) {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.newDocument();
        Node importedParentNode = doc.importNode(parentNode, false);
        doc.appendChild(importedParentNode);
        Node importedcollaborationNode = doc.importNode(collaborationNode, false);
        importedParentNode.appendChild(importedcollaborationNode);
        Node importedPariticipantNode = doc.importNode(participants.item(i), true);
        if (participantsList != null
            && participantsList.contains(
                importedPariticipantNode.getAttributes().getNamedItem(ID_ATTR).getTextContent())) {
          importedcollaborationNode.appendChild(importedPariticipantNode);
          String processId =
              participants.item(i).getAttributes().getNamedItem(PROCESS_REF_ATTR).getTextContent();
          importProcess(parentDoc, processId, doc, importedParentNode);
          importMessages(doc, parentDoc, importedParentNode);
          importBPMNDiag(doc, parentDoc, importedParentNode);
          String resulted = convertDocumentToString(doc);
          splittedXml.add(update(resulted));
        }
      }
      return splittedXml;
    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected void importBPMNDiag(Document doc, Document parentDoc, Node importedParentNode) {
    Node importedBPMNDiag =
        doc.importNode(parentDoc.getElementsByTagName(BPMN_DIAG_TAG).item(0), true);
    importedParentNode.appendChild(importedBPMNDiag);
  }

  protected void importMessages(Document doc, Document parentDoc, Node importedParentNode) {
    try {
      String xmlDiag = convertDocumentToString(doc);
      NodeList messageList = parentDoc.getElementsByTagName(MSG_TAG);
      for (int j = 0; j < messageList.getLength(); j++) {
        String ref =
            "messageRef=\""
                + messageList.item(j).getAttributes().getNamedItem(ID_ATTR).getTextContent()
                + "\"";
        if (xmlDiag.contains(ref)) {
          Node importedMessageNode = doc.importNode(messageList.item(j), true);
          importedParentNode.appendChild(importedMessageNode);
        }
      }
    } catch (TransformerException e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected void importProcess(
      Document parentDoc, String processId, Document doc, Node importedParentNode) {
    NodeList processList = parentDoc.getElementsByTagName(PROCESS_TAG);

    for (int j = 0; j < processList.getLength(); j++) {
      if (processList
          .item(j)
          .getAttributes()
          .getNamedItem(ID_ATTR)
          .getTextContent()
          .equals(processId)) {
        Node node = processList.item(j);
        Node importedProcess = doc.importNode(node, true);
        importedParentNode.appendChild(importedProcess);
      }
    }
  }

  protected String regenerateIds(String xmlDiag) {
    try {
      Document doc = getDocument(xmlDiag);
      String prefix =
          findParentNode(doc)
              .getAttributes()
              .getNamedItem(CODE_ATTR)
              .getTextContent()
              .toLowerCase()
              .concat("-");
      prefix = prefix.replace(" ", "_");
      NodeList nodes = doc.getElementsByTagName("*");
      for (int i = 0; i < nodes.getLength(); i++) {
        if (nodes.item(i).getAttributes().getNamedItem(ID_ATTR) != null
            && !nodes.item(i).getAttributes().getNamedItem(ID_ATTR).getTextContent().isEmpty()) {
          String initialID = nodes.item(i).getAttributes().getNamedItem(ID_ATTR).getTextContent();
          xmlDiag = xmlDiag.replace(initialID, prefix.concat(initialID));
        }
      }
      return xmlDiag;
    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected String importParticipants(String xmlDiagram, List<String> selectedParticipants) {
    try {
      Document doc = getDocument(xmlDiagram);
      Node collaboration = findCollaborationNode(doc);
      NodeList participants = doc.getElementsByTagName(PARTICIPANT_TAG);
      List<Node> nodesToRemove = new ArrayList<>();
      for (int i = 0; i < participants.getLength(); i++) {
        Node item = participants.item(i);
        if (item.getAttributes().getNamedItem(ID_ATTR) != null
            && !selectedParticipants.contains(
                item.getAttributes().getNamedItem(ID_ATTR).getTextContent())) {
          nodesToRemove.add(item);
        }
      }
      for (Node node : nodesToRemove) {
        collaboration.removeChild(node);
      }
      return convertDocumentToString(doc);
    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  @Override
  @Transactional
  public List<Long> save(
      List<MergeSplitResult> results, List<MergeSplitContributor> contributors, boolean deploy) {
    List<Long> ids = new ArrayList<>();
    for (MergeSplitResult result : results) {
      ids.add(saveResult(result, deploy));
    }
    for (MergeSplitContributor contributor : contributors) {
      saveContributor(contributor, deploy);
    }
    return ids;
  }

  protected void saveContributor(MergeSplitContributor contributor, boolean deploy) {
    if (contributor.getId() == null) {
      return;
    }
    WkfModel wkfModel = wkfModelRepository.find(contributor.getId());
    if (wkfModel == null) {
      return;
    }
    wkfModel = removeParticipants(wkfModel, contributor.getParticipants());
    WkfModel newVersion = wkfModelService.createNewVersion(wkfModel);
    wkfModelService.start(null, newVersion);
    checkContributor(wkfModel);
    if (deploy) {
      deploy(wkfModel);
    }
  }

  protected void checkContributor(WkfModel wkfModel) {
    WkfModel latestVersion =
        Query.of(WkfModel.class)
            .filter("self.code = :code")
            .bind("code", wkfModel.getCode())
            .order("-versionTag")
            .fetchOne();
    try {
      Document doc = getDocument(latestVersion.getDiagramXml());
      NodeList participants = doc.getElementsByTagName(PARTICIPANT_TAG);
      if (participants.getLength() < 1) {
        latestVersion.setArchived(true);
      }

    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected Long saveResult(MergeSplitResult result, boolean deploy) {
    WkfModel existingWkfModel = wkfModelRepository.findByCode(result.getCode());
    if (existingWkfModel != null) {
      throw new IllegalArgumentException(
          I18n.get(BpmExceptionMessage.BPM_WKF_MODEL_UNIQUE_CODE).formatted(result.getCode()));
    }
    try {
      String diagram = result.getDiagram();
      Document doc = getDocument(diagram);
      Node parent = findParentNode(doc);
      if (parent.getNodeType() == Node.ELEMENT_NODE) {
        Element element = (Element) parent;
        element.setAttribute(CODE_ATTR, result.getCode());
        element.setAttribute(NAME_ATTR, result.getName());
      }
      diagram = convertDocumentToString(doc);
      WkfModel wkfModel = new WkfModel();
      wkfModel.setCode(result.getCode());
      wkfModel.setName(result.getName());
      wkfModel.setDiagramXml(diagram);
      wkfModelService.start(null, wkfModel);
      if (deploy) {
        bpmDeploymentService.deploy(null, wkfModel, null, false);
      }
      wkfModelRepository.save(wkfModel);
      return wkfModel.getId();

    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected void deploy(WkfModel wkfModel) {

    List<WkfProcess> wkfProcessList = wkfModel.getWkfProcessList();
    if (wkfProcessList == null) {
      return;
    }

    wkfProcessList.forEach(
        process -> {
          ProcessEngine processEngine = ProcessEngines.getDefaultProcessEngine();
          List<ProcessInstance> instances =
              processEngine
                  .getRuntimeService()
                  .createProcessInstanceQuery()
                  .processDefinitionKey(process.getName())
                  .active()
                  .list();

          instances.forEach(
              instance -> {
                processEngine
                    .getRuntimeService()
                    .deleteProcessInstance(
                        instance.getId(), "removed wkf instance " + instance.getId());

                List<WkfProcessConfig> wkfProcessConfigs =
                    process.getWkfProcessConfigList().stream()
                        .filter(WkfProcessConfig::getIsStartModel)
                        .toList();

                if (!wkfProcessConfigs.isEmpty()) {
                  MetaModel metaModel = wkfProcessConfigs.getFirst().getMetaModel();
                  try {
                    Model model =
                        Query.of(Class.forName(metaModel.getFullName()).asSubclass(Model.class))
                            .filter("self.processInstanceId = ?1", instance.getProcessInstanceId())
                            .fetchOne();
                    log.debug("Update process instance for model {}", model.getId());
                    model.setProcessInstanceId(null);

                    wkfInstanceService.evalInstance(model, null);
                  } catch (ClassNotFoundException e) {
                    throw new IllegalStateException(e.getMessage());
                  }
                }
                WkfInstance wkfInstance =
                    wkfInstanceRepository.findByInstanceId(instance.getProcessInstanceId());
                wkfInstanceRepository.remove(wkfInstance);
              });
        });
  }

  @Transactional(rollbackOn = Exception.class)
  protected WkfModel removeParticipants(WkfModel wkfModel, List<String> participants) {
    try {
      Document document = getDocument(wkfModel.getDiagramXml());
      Node collaborationNode = findCollaborationNode(document);
      NodeList participantsList = document.getElementsByTagName(PARTICIPANT_TAG);
      List<String> partcipantIdsToRemove = new ArrayList<>();
      for (int i = 0; i < participantsList.getLength(); i++) {
        Node item = participantsList.item(i);
        if (item.getAttributes().getNamedItem(ID_ATTR) != null
            && participants.contains(item.getAttributes().getNamedItem(ID_ATTR).getTextContent())) {
          partcipantIdsToRemove.add(item.getAttributes().getNamedItem(ID_ATTR).getTextContent());
        }
      }
      List<Node> nodeList =
          IntStream.range(0, participantsList.getLength())
              .mapToObj(participantsList::item)
              .toList();

      List<String> processRefstoRemove = new ArrayList<>();
      for (int i = 0; i < participantsList.getLength(); i++) {
        Node item = participantsList.item(i);
        if (item.getAttributes().getNamedItem(ID_ATTR) != null
            && partcipantIdsToRemove.contains(
                item.getAttributes().getNamedItem(ID_ATTR).getTextContent())) {
          String processRef =
              item.getAttributes().getNamedItem(PROCESS_REF_ATTR) != null
                  ? item.getAttributes().getNamedItem(PROCESS_REF_ATTR).getTextContent()
                  : null;
          processRefstoRemove.add(processRef);
        }
      }
      NodeList processList = document.getElementsByTagName(PROCESS_TAG);
      for (int i = 0; i < processList.getLength(); i++) {
        Element process = (Element) processList.item(i);
        String processId = process.getAttribute(ID_ATTR);
        if (processRefstoRemove.contains(processId)) {
          Node parentNode = process.getParentNode();
          parentNode.removeChild(process);
        }
      }
      partcipantIdsToRemove.forEach(
          participantId ->
              nodeList.stream()
                  .filter(
                      item ->
                          item.getAttributes().getNamedItem(ID_ATTR) != null
                              && participantId.equals(
                                  item.getAttributes().getNamedItem(ID_ATTR).getTextContent()))
                  .findFirst()
                  .ifPresent(collaborationNode::removeChild));
      wkfModel.setDiagramXml(convertDocumentToString(document));
      return wkfModel;
    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  @Override
  public String getMergeUrl(List<Integer> ids) {
    if (ids == null || ids.size() <= 1) {
      return null;
    }

    StringBuilder link = new StringBuilder("bpm-merge-split/?type=merge&&id=");
    for (int i = 0; i < ids.size(); i++) {
      link.append(ids.get(i));
      if (i < ids.size() - 1) {
        link.append("-");
      }
    }

    return link.toString();
  }

  @Override
  public String getSplitUrl(List<Integer> ids) {
    if (ids == null || ids.size() != 1) {
      return null;
    }

    return "bpm-merge-split/?type=split&&id=" + ids.getFirst();
  }
}
