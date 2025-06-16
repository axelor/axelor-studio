# Axelor Studio

The main repository for Studio and BPM

## Installation on a project using nexus dependencies

Add the following to the dependencies section of your build.gradle file:

```groovy
implementation 'com.axelor.addons:axelor-studio:x.y.z'
```

## Installation on a project as a git submodule

Firstly, clone the project in your webapp's modules.

Then, add the following lines to the settings.gradle file of your project:

```groovy
include 'modules:axelor-studio'
```

Then, add the following lines to the dependencies section of your build.gradle file:

```groovy
implementation project(':modules:axelor-studio')
```

## Required configurations

Add the following lines to the axelor-config.properties file of your project:

```properties
# Install apps. This deprecate the old 'aos.apps.install-apps' property
studio.apps.install = all

# Enable utils api. This deprecate the old 'aos.api.enable' property
utils.api.enable = true

# Custom context values
# ~~~~~
context.app = com.axelor.studio.app.service.AppService

# Enable BPMN logging
studio.bpm.logging = true

# Configure Utils process timeout
utils.process.timeout = 10

#Controls the maximum number of idle database connections (default 10)
studio.bpm.max.idle.connections = 10

#Maximum number of active database connections (default 50)
studio.bpm.max.active.connections = 50
```

## BPM Groovy Script Variables

Some variables are available to be used with groovy script expressions in BPM. This includes:

* `__studiouser__` - current user or admin if no user
* `__date__` - current date as `LocalDate`
* `__datetime__` - current datetime as `LocalDateTime`
* `__time__` - current time as `LocalTime`
* `__config__` - application configuration as `axelor-config.properties`
* `__beans__` - beans class as `Beans.class`
* `__ctx__` - workflow context helper as `WkfContextHelper`
* `__transform__` - workflow transformation helper for web service connector as `WkfTransformationHelper`
* `__repo__` - repository of given model class
* `__log__` - get the global instance of the Logger

## Versioning compatibility

It is recommended to use the module with AOP and AOS versions as described below:

| Studio module version | AOP compatible version | AOS compatible version |
|-----------------------|------------------------|------------------------|
| 1.0                   | 6.1                    | 7.0                    |
| 1.1                   | 6.1                    | 7.0                    |
| 1.2                   | 6.1                    | 7.1                    |
| 1.3                   | 6.1                    | 7.2                    |
| 2.x                   | 7.0                    | 8.0                    |
| 3.1                   | 7.1                    | 8.1                    |
| 3.2                   | 7.1                    | 8.1                    |
| 3.3                   | 7.2                    | 8.2                    |
| 3.4                   | 7.3                    | 8.3                    |
| 3.5                   | 7.4                    | 8.4                    |
