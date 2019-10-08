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
### View application
Open a Web browser and access your application at http://localhost:8080

### Editing application
Click on the Login button on the top right corner. Use admin/admin as your username/password. Turn the edit mode on via dropdown menu on the top right corner.

- Add Component:  Select a component from the select box in each column and click Add
- Edit Component Properties: Click on the gear icon on a window and select "Edit Settings" to set component properties
- Delete Component: Select "Delete Component" from the portal window menu 
- Rearrange Components: You can drag and drop components by clicking on the drag icon shown on the top right corner of each portal window
- Add Page: Select "New Page" from the top right dropdown and enter requested page metadata
- Delete Page: Select "Delete Current Page" from the top level dropdown
- Change Page Order: Drag and drop the top menubar page links
- Add Folder: Open Page Manager from the top level menu and click on "New Folder" button
