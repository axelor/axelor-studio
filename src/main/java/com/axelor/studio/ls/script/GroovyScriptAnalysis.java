package com.axelor.studio.ls.script;

import groovy.lang.GroovyClassLoader;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.Getter;
import org.codehaus.groovy.ast.ClassNode;
import org.codehaus.groovy.ast.DynamicVariable;
import org.codehaus.groovy.ast.MethodNode;
import org.codehaus.groovy.ast.Variable;
import org.codehaus.groovy.ast.expr.VariableExpression;
import org.codehaus.groovy.control.CompilationUnit;
import org.codehaus.groovy.control.CompilerConfiguration;
import org.codehaus.groovy.control.Phases;

@Getter
public class GroovyScriptAnalysis {
  protected final Set<String> dynamicVariables = new HashSet<>();
  protected final Set<String> expressionVariables = new HashSet<>();
  protected Boolean finalReturnPresent = false;

  protected GroovyScriptAnalysis() {}

  public static GroovyScriptAnalysis analyze(
      String script, CompilerConfiguration config, GroovyClassLoader gcl) {
    GroovyScriptAnalysis analysis = new GroovyScriptAnalysis();
    analysis.analyzeScript(script, config, gcl);
    return analysis;
  }

  protected boolean isLastLineReturn(String script) {
    if (script == null || script.isEmpty()) {
      return false;
    }
    String[] lines = script.trim().split("\n");
    String lastLine = lines[lines.length - 1].trim();
    return lastLine.startsWith("return");
  }

  protected void analyzeScript(String script, CompilerConfiguration config, GroovyClassLoader gcl) {
    finalReturnPresent = isLastLineReturn(script);

    CompilationUnit compilationUnit = new CompilationUnit(config, null, gcl);
    compilationUnit.addSource("script", script);
    String patternString = "__(.*?)__";
    Pattern pattern = Pattern.compile(patternString);

    compilationUnit.addPhaseOperation(
        source -> {
          for (ClassNode classNode : source.getAST().getClasses()) {
            for (MethodNode method : classNode.getMethods()) {
              method
                  .getCode()
                  .visit(
                      new org.codehaus.groovy.ast.CodeVisitorSupport() {
                        @Override
                        public void visitVariableExpression(VariableExpression expression) {
                          Variable variable = expression.getAccessedVariable();
                          if (variable == null) {
                            return;
                          }
                          Matcher matcher = pattern.matcher(variable.getName());
                          if (variable instanceof DynamicVariable && !matcher.matches()) {
                            dynamicVariables.add(variable.getName());
                          }
                          if (variable instanceof VariableExpression && !matcher.matches()) {
                            expressionVariables.add(variable.getName());
                          }
                          super.visitVariableExpression(expression);
                        }
                      });
            }
          }
        },
        Phases.SEMANTIC_ANALYSIS);

    compilationUnit.compile(Phases.SEMANTIC_ANALYSIS);
  }
}
