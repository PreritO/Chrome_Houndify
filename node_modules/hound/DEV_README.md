# Houndify Web SDK (Developer Readme)

## Project Structure

### dist

Contains the latest compiled in-browser and node module components

### example

Contains files of example project. **_public** folder and **_config.json** are used for development and contain "id:211" client's private ClientKey. **public**, **config.json**, **package.json** and **server.js** will be packed into published archive (See grunt tasks).

### src 

Contains source code for in-browser **hound-web-sdk** and **hound-web-sdk-node** node module.

### gruntFile.js

Grunt tasks for building the SDK, starting example project and packaging the SDK. 

* `grunt build` - will build source code and copy files to example project and dist folder, watches for changes.
* `grunt bounce` - will start the example project with **_public** and **_config.json**.
* `grunt dist` - will gather all the files to be published inside **./tmp/hound-web-sdk** folder. Double check the files inside it before archiving.

## Developing 

Run `grunt build` that will build everything and watch for changes in **src** folder.

Run `grunt bounce` that will start example project with development configs. Rerun the script if you make changes to **hound-web-sdk-node**. No need to restart anything for in-browser part changes.

## Publishing

1. Change the version in **./src/hound-web-sdk/config.js**.
2. Run `grunt build`
3. Commit all the changes after the build is done.
4. Run `build-changelog` to bump
5. Run `grunt bounce` to update example project package.json and to start the server. 
6. Open the demo page and test.
7. Run `grunt dist` to copy all the files that need to be published into **./tmp/hound-web-sdk**
8. Double check the files in **./tmp/hound-web-sdk**
9. Zip the folder and add current version to its name.
10. Publish the zip on houndify.com
11. You're done! Go make some tea.

## Source files

### hound-web-sdk-node

A simple node.js module with middleware that is used for authenticating and proxying search requests.

**TODO:** needs to be annotated and ported into platforms and languages other than node.js and js.

### hound-web-sdk

**index.js** is a parent object **Hound** that will contain VoiceSearch, TextSearch and Conversation objects. Respective files can be found in this folder. **audio** folder contains modules for handling audio files, in-browser recording and speex wrapper. **connection** contains a module that handles websocket connections to Hound backend. Some useful methods and objects can be found in **utils** and **lib** contains soundhound-speex and xaudio libraries. See [soundhound-speex](http://web-git-a-1.pnp.melodis.com/aamirgul/soundhound-speex) for more details about this library.

**TODO:** rewrite Resampler to get rid of xaudio dependency.

**TODO:** find alternative to browserify for building the source into a single module



