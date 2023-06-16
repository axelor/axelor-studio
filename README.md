# Axelor Studio

The main repository for Studio and BPM

## Test react components

Use following commands to build and test specific react component after completing full build (`./gradlew -x test clean build`) one time. It can be tested without server restart.
- `./gradlew -x test copyBpmWebapp` : Build the BPM (wkf-editor) component and copy it into the main webapp. 
- `./gradlew -x test copyStudioWebapp` : Build the studio editor component and copy it into the main webapp.
- `./gradlew -x test copyMapperWebapp` : Build the mapper component and copy it into the main webapp. 
- `./gradlew -x test copyWebServicesBuilderWebapp` :  Build ws-builder component and copy it into the main webapp.
- `./gradlew -x test copyBamlWebapp` :  Build the BAML react component and copy it into the main webapp. 

