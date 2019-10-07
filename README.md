# singlepage-js


## Overview
Singlepage.js is a pure Javascript portal framework for building modular Web applications. Key features include:

Singlepage CLI
- Create minimal or full app boilerplate
- Development support via "singlepage serve" that serves from memory and uses livereload for hot reloads
- Build app distribution for deployment

Singlepage Portal Framework
- Application construction via drag-n-drop of Vue component
- Component customization via auto-generated property editor
- Support for custom component commands and property editor
- Portal window templates that can be customized for your own look & feel
- Built-in page grid layouts with the ability to define your own
- Web Services framework to support component communication with backend services
- Role based access control for services
- Default implmentation of core services that do not have any external dependencies
- Internationalization via global message file as well as embedded component-specific messages


## Installation
```
npm install -g singlepage-js
```
## Project setup
Use global command `singlepage` to generate application boilerplate

```
singlepage create myapp
```

For more customization control, use `-f` flag to create application set up with all files that can be overridden.

```
singlepage create myapp -f
```

### Compiles and hot-reloads for development
```
cd myapp
singlepage serve
```

### Compiles and minifies for production
Use `build` command to create your distribution. The distribution is created in the `dist` folder under your application directory. You can use `spstart.js`  script in the `bin` directory to run the server.

```
cd myapp
singlepage build
node ./dist/bin/spstart.js
```
