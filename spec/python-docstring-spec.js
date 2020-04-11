'use babel';

import PythonDocstring from '../lib/pydoc';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('PythonDocstring', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('pydoc');
  });

  describe('when the pydoc:comment event is triggered', () => {
    it('adds a python docstring based on the formatted method header', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.pydoc')).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'pydoc:comment');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.pydoc')).toExist();

        let pythonDocstringElement = workspaceElement.querySelector('.pydoc');
        expect(pythonDocstringElement).toExist();

        let pythonDocstringPanel = atom.workspace.panelForItem(pythonDocstringElement);
        expect(pythonDocstringPanel.isVisible()).toBe(true);
        atom.commands.dispatch(workspaceElement, 'pydoc:comment');
        expect(pythonDocstringPanel.isVisible()).toBe(false);
      });
    });

    it('hides and shows the view', () => {
      // This test shows you an integration test testing at the view level.

      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector('.pydoc')).not.toExist();

      // This is an activation event, triggering it causes the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'pydoc:comment');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        // Now we can test for view visibility
        let pythonDocstringElement = workspaceElement.querySelector('.pydoc');
        expect(pythonDocstringElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'pydoc:comment');
        expect(pythonDocstringElement).not.toBeVisible();
      });
    });
  });
});
