# Contributing
Contributing to this repository is simple. To get started you will need `node` and `npm` installed on your machine. The files to edit can be found in the `manifests/` folder and they each have their owned defined structures.

To setup the project, run `npm install` to install project dependencies and configure hooks for editing. When editing files, please ensure that there are no syntax errors with the JSON. Before you push, an automated hook will run, formatting and reorganizing the files.

On a pull request, you may add as many commits as you want, however, they will be squashed and merged into the main branch, triggering a redeploy and updating the live site. If you have push access, please be careful to not disrupt the deploy action lifecycle.
