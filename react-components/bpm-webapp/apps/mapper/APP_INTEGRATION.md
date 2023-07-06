# Integrating generic-builder app

* First create one folder (directory) e.g. ax-apps
```bat
mkdir ax-apps
```
* Create apps directory in ax-apps
```bat
mkdir ax-apps/apps
```
* Create package.json file in ax-apps
```bat
touch ax-apps/package.json
```


``` 
{
  "name": "ax-apps",
  "private": true,
  "engines": {
    "node": ">=14",
    "yarn": ">=1.22"
  },
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "start": "yarn workspace assignment-builder run start",
    "build": "yarn workspace assignment-builder run build"
  }
}
```

* Move your assignment-builder app into /apps directory or clone it from github
* Move your generic-builder app into /apps directory or clone it from github
* Final directory structure should look like this

```
ax-apps
│   package.json
│───apps
│   │   assignment-builder
│   │   generic-builder
```

### Steps to use generic-builder in assignment-builder app
* add dependency of generic-builder (name of directory should match with its relative package.json name i.e. generic-builder) (File : apps/assignment-builder/package.json)
```
{
  "name": "assignment-builder",
  "version": "1.0.0",
  "private": true,
  "homepage": "./",
  "main": "./src/App.js",
  "dependencies": {
    "generic-builder": "*",
```
* add path in craco config file (File : apps/assignment-builder/craco.config.json)

```
const appsDir = path.resolve('../');

const apps = ['generic-builder'];
const sources = apps.map(name => path.join(appsDir, name, 'src'));
```
* now you can use generic-builder app files with direct import
```
import ExpressionBuilder from 'generic-builder/src/expression-builder';
```

### Run app
* yarn install on ax-apps (root directory)
* run app with yarn workspace or yarn start (configured in scripts)
```bat
yarn workspace assignment-builder run start
```
### Build app
* yarn install on ax-apps (root directory)
* build app with yarn workspace or yarn build (configured in scripts)
```bat
yarn workspace assignment-builder run build
```

## Important Note

* Don't commit changes of integrating apps like package.json dependency change, craco config change
* Let say you want to commit import app change like below one
```
import ExpressionBuilder from 'generic-builder/src/expression-builder';
```
* Instead of import line, create dummy component and commit like this
```
function ExpressionBuilder() {
    return (
        <p>
            Integrate Generic builder 
        </p>
    )
}
```