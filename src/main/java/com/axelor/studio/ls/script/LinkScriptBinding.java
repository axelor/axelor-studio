package com.axelor.studio.ls.script;

import groovy.lang.Binding;
import groovy.lang.MissingPropertyException;
import java.util.Map;

public class LinkScriptBinding extends Binding {

  public LinkScriptBinding() {}

  public LinkScriptBinding(Map variables) {
    super(variables);
  }

  public LinkScriptBinding(String[] args) {
    super(args);
  }

  @Override
  public Object getVariable(String name) {
    try {
      return super.getVariable(name);
    } catch (MissingPropertyException e) {
      return null;
    }
  }
}
