package com.axelor.studio.bpm.service;

import com.axelor.common.FileUtils;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.MetaScanner;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.MetaModule;
import com.axelor.meta.db.repo.MetaFileRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.meta.db.repo.MetaModuleRepository;
import com.axelor.studio.bpm.service.deployment.BpmDeploymentService;
import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.repo.WkfDmnModelRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.dmn.service.DmnDeploymentService;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.common.io.ByteStreams;
import com.google.inject.persist.Transactional;
import jakarta.inject.Inject;
import java.io.*;
import java.lang.invoke.MethodHandles;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.function.Predicate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfBpmImportServiceImpl implements WkfBpmImportService {
  private final WkfModelRepository wkfModelRepository;
  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  protected final BpmDeploymentService bpmDeploymentService;
  protected static final String DIR_PROCESSES = "processes";
  protected static final String DIR_DMN = "processes/dmn";
  protected final MetaModelRepository metaModelRepo;
  protected final MetaModuleRepository metaModuleRepo;
  protected final WkfModelService wkfModelService;
  protected final WkfDmnModelRepository wkfDmnModelRepository;
  protected final MetaFiles metaFiles;
  protected final MetaFileRepository metaFileRepository;

  @Inject
  public WkfBpmImportServiceImpl(
      WkfModelRepository wkfModelRepository,
      BpmDeploymentService bpmDeploymentService,
      MetaModelRepository metaModelRepo,
      MetaModuleRepository metaModuleRepo,
      WkfModelService wkfModelService,
      WkfDmnModelRepository wkfDmnModelRepository,
      MetaFiles metaFiles,
      MetaFileRepository metaFileRepository) {
    this.wkfModelRepository = wkfModelRepository;
    this.bpmDeploymentService = bpmDeploymentService;
    this.metaModelRepo = metaModelRepo;
    this.metaModuleRepo = metaModuleRepo;
    this.wkfModelService = wkfModelService;
    this.wkfDmnModelRepository = wkfDmnModelRepository;
    this.metaFiles = metaFiles;
    this.metaFileRepository = metaFileRepository;
  }

  @Override
  public void importDmn() throws IOException {
    final List<MetaModule> modules = metaModuleRepo.all().fetch();
    importDmnModels(modules);
  }

  protected void importDmnModels(List<MetaModule> modules) throws IOException {
    File tmp;
    for (MetaModule module : modules) {

      tmp = extract(module.getName(), DIR_DMN);

      try {
        File dataDir = tmp == null ? null : new File(tmp, DIR_DMN);

        File[] dataFiles =
            dataDir == null ? null : dataDir.listFiles((dir, name) -> name.endsWith(".dmn"));

        if (dataFiles == null || dataFiles.length == 0) {
          continue;
        }

        for (File dataFile : dataFiles) {
          log.debug("Importing {} dmn file", dataFile.getName());
          WkfDmnModel dmnModel = importDmnModel(dataFile);
        }

      } catch (Exception e) {
        ExceptionHelper.trace(e);
      } finally {
        clean(tmp);
      }
    }
  }

  protected String findDiagramByCode(String code) throws IOException {
    List<MetaModule> modules = metaModuleRepo.all().fetch();
    File tmp;
    String bpmdiag = null;
    for (MetaModule module : modules) {
      tmp = extract(module.getName(), DIR_PROCESSES);
      try {
        File dataDir = tmp == null ? null : new File(tmp, DIR_PROCESSES);

        File[] dataFiles =
            dataDir == null ? null : dataDir.listFiles((dir, name) -> name.endsWith(".bpmn"));
        if (dataFiles == null || dataFiles.length == 0) {
          continue;
        }
        for (File dataFile : dataFiles) {
          String tempDiag = readFile(dataFile);
          if (isSameCode(tempDiag, code)) {
            if (bpmdiag != null) {
              throw new IllegalArgumentException(
                  String.format(StudioExceptionMessage.STUDIO_MULTIPLE_BPM_FILES, code));
            }
            bpmdiag = tempDiag;
          }
        }
      } catch (Exception e) {
        ExceptionHelper.trace(e);
      } finally {
        clean(tmp);
      }
    }
    if (bpmdiag == null) {
      throw new IllegalArgumentException(
          String.format(StudioExceptionMessage.STUDIO_NO_BPM_FILE, code));
    }
    return bpmdiag;
  }

  protected boolean isSameCode(String bpmDiag, String code) throws IOException {
    String diagCode = "";
    Pattern pattern = Pattern.compile("camunda:code=\"(.*?)\"");
    Matcher matcher = pattern.matcher(bpmDiag);
    if (matcher.find()) {
      diagCode = matcher.group(1);
    }
    return code != null && code.equals(diagCode);
  }

  @Override
  @Transactional
  public WkfModel importWkfModel(String code) throws IOException {
    String bpmDiag = findDiagramByCode(code);
    if (!isSameCode(bpmDiag, code)) {
      return null;
    }
    String diagName = "";
    Pattern pattern = Pattern.compile("camunda:diagramName=\"(.*?)\"");
    Matcher matcher = pattern.matcher(code);
    if (matcher.find()) {
      diagName = matcher.group(1);
    }
    code = code.replaceAll("\u0000", "");
    bpmDiag = bpmDiag.replaceAll("\u0000", "");
    WkfModel wkfModel = wkfModelRepository.findByCode(code);
    if (wkfModel == null) {
      wkfModel = new WkfModel();
      wkfModel.setName(diagName);
      wkfModel.setCode(code);
      wkfModel.setIsActive(true);
      wkfModel.setDiagramXml(bpmDiag);
      addDmnFiles(wkfModel, bpmDiag);
      wkfModelService.start(null, wkfModel);
      bpmDeploymentService.deploy(null, wkfModel, null, false);
    } else {
      WkfModel lasVersionModel = wkfModel;
      while (lasVersionModel != null) {
        wkfModel = lasVersionModel;
        lasVersionModel =
            wkfModelRepository
                .all()
                .filter("self.previousVersion.id=:previousVersionId")
                .bind("previousVersionId", lasVersionModel.getId())
                .fetchOne();
      }
      WkfModel newVersion = wkfModel;
      if (checkIfBpmChanged(bpmDiag, wkfModel.getDiagramXml())) {
        newVersion = wkfModelService.createNewVersion(wkfModel);
        log.debug("New version is created for WkfModel {}", wkfModel.getCode());
        newVersion.setDiagramXml(bpmDiag);
        addDmnFiles(newVersion, bpmDiag);
        wkfModelService.start(null, newVersion);
      }
      wkfModel = newVersion;
    }
    wkfModel = wkfModelRepository.save(wkfModel);
    return wkfModel;
  }

  protected boolean checkIfBpmChanged(String sourceBpmnFileStr, String savedBpmnFileStr) {

    List<String> sourceBpmnProcessDef = parseProcessDefinitions(sourceBpmnFileStr);
    List<String> savedBpmnProcessDef = parseProcessDefinitions(savedBpmnFileStr);
    if (savedBpmnProcessDef.size() != sourceBpmnProcessDef.size()) return true;
    for (String processDef : sourceBpmnProcessDef) {
      if (savedBpmnProcessDef.stream().noneMatch(Predicate.isEqual(processDef))) {
        return true;
      }
    }
    return false;
  }

  protected List<String> parseProcessDefinitions(String bpmnDefinition) {
    Pattern pattern =
        Pattern.compile(
            "<bpmn2:process[^>]*>.*?</bpmn2:process|<bpmn2:process(.*?)/>", Pattern.DOTALL);
    Matcher matcher = pattern.matcher(bpmnDefinition);
    List<String> processDefs = new ArrayList<>();
    while (matcher.find()) {
      processDefs.add(matcher.group());
    }
    return processDefs;
  }

  @Override
  @Transactional
  public WkfDmnModel importDmnModel(File dmnDiagFile) throws IOException {

    String dmnDiag = readFile(dmnDiagFile);
    String dmnName = "";
    Pattern pattern = Pattern.compile("<decision id=\"(.*?)\"");
    Matcher matcher = pattern.matcher(dmnDiag);
    if (matcher.find()) {
      dmnName = matcher.group(1);
    }
    WkfDmnModel dmnModel = wkfDmnModelRepository.findByName(dmnName);
    if (dmnModel == null) {
      dmnModel = new WkfDmnModel();
      dmnModel.setName(dmnName);
    }
    dmnModel.setDiagramXml(dmnDiag.replaceAll("\u0000", ""));

    // Create dmn meta file :

    MetaFile metaFile = new MetaFile();
    metaFile.setFileName(dmnName);
    metaFile.setFilePath("");
    metaFile = metaFiles.upload(dmnDiagFile, metaFile);

    dmnModel = wkfDmnModelRepository.save(dmnModel);
    Beans.get(DmnDeploymentService.class).deploy(dmnModel);
    return dmnModel;
  }

  protected WkfModel addDmnFiles(WkfModel wkfModel, String bpmDiag) {
    Pattern pattern = Pattern.compile("camunda:decisionRef=\"(.*?)\"");
    Matcher matcher = pattern.matcher(bpmDiag);
    Set<MetaFile> metaFileSet = new HashSet<>();
    String dmnRef = null;
    while (matcher.find()) {
      dmnRef = matcher.group(1);
      MetaFile metaFile =
          metaFileRepository
              .all()
              .filter("self.fileName=:dmnFileName")
              .bind("dmnFileName", dmnRef)
              .fetchOne();
      metaFileSet.add(metaFile);
    }
    if (wkfModel.getDmnFileSet() == null) {
      wkfModel.setDmnFileSet(new HashSet<>());
    }
    wkfModel.getDmnFileSet().addAll(metaFileSet);

    return wkfModel;
  }

  protected File extract(String module, String dirName) throws IOException {
    String dirNamePattern = dirName.replaceAll("[/\\\\]", "(/|\\\\\\\\)");
    List<URL> files = new ArrayList<>();
    files.addAll(MetaScanner.findAll(module, dirNamePattern, "(.+?)\\.(bpmn|dmn)"));
    if (files.isEmpty()) {
      return null;
    }
    final File tmp = Files.createTempDirectory(null).toFile();

    files.forEach(
        url -> {
          String name = url.getFile();
          name = Paths.get(name.replaceAll("file:.+!/", "")).toString();
          try {
            copy(url.openStream(), tmp, name);
          } catch (IOException e) {
            ExceptionHelper.trace(e);
          }
        });

    return tmp;
  }

  protected void copy(InputStream in, File toDir, String name) throws IOException {
    File dst = FileUtils.getFile(toDir, name);
    com.google.common.io.Files.createParentDirs(dst);
    try (FileOutputStream out = new FileOutputStream(dst)) {
      ByteStreams.copy(in, out);
    }
  }

  protected void clean(File file) throws IOException {
    File[] files = file == null ? null : file.listFiles();
    if (files == null) {
      return;
    }
    if (file.isDirectory()) {
      for (File child : files) {
        clean(child);
      }
      FileUtils.deleteDirectory(file.toPath());
    } else if (file.exists()) {
      Files.delete(file.toPath());
    }
  }

  protected String readFile(File file) throws IOException {
    Reader reader = new BufferedReader(new FileReader(file));
    StringBuilder stringBuilder = new StringBuilder();
    char[] buffer = new char[10];
    while (reader.read(buffer) != -1) {
      stringBuilder.append(new String(buffer));
      buffer = new char[10];
    }
    reader.close();
    return stringBuilder.toString();
  }
}
